import { Server2Client, Server2Main } from "../shared/models/events"
import { connections, S2MSend, store, type RRSocketConnection, type RRSocketServer } from "./data"
import { PlayerStatusUpdate, type PlayerUpdate, type ProgrammingData } from "../shared/models/connection"
import type { Character, CharacterID, PlayerID, PlayerStateData } from "../shared/models/player"
import { BOTS } from "../shared/data/robots"
import { newRegisterArray, type Program } from "../shared/models/game_data"

/**
 * created a disconnect handler which will 1) notify the main that a player disconnected,
 * 2) set a timer to delete the socket in a certain amount of time, and 3) tell main to
 * delete the player when the timer expires
 * @param socket the socket which this disconnect handler will be put onto
 * @returns a new disconnect handler
 */
export function makeDisconnectHandle(socket: RRSocketConnection): () => void {
    return () => {
        console.log('a user disconnected')
        // remove the user from the connections
        connections.delete(socket.data.id)
        // notify the main that the player has disconnected
        S2MSend<never>({
            name: Server2Main.PLAYER_DISCONNECTED,
            id: socket.data.id
        })
        
        // TODO: set a timeout for this user after which they will be removed from the game
        // make it generous, like 5 or 10 minutes
        const to = setTimeout(() => {
            // remove the user
            connections.delete(socket.data.id)
            // request that main remove the player from the game
            S2MSend<PlayerUpdate>({
                name: Server2Main.PLAYER_DISCONNECTED,
                id: socket.data.id,
                data: {
                    id: socket.data.id,
                    status: PlayerStatusUpdate.REMOVED
                }
            })
        }, 600000) // TODO: make this 600000 configurable by the user
        
        // save this timer so we can cancel it if needed
        store.timeout_counters.set(socket.data.id, to)
    }
}

/**
 * creates a handler for the join game event which validates the event. If it's valid, the player is added to
 * the game, and the event is forwarded to the main thread
 * @param socket the socket which this handler is being added to
 * @returns a handler for the join game event
 */
export function makeJoinGameHandle(socket: RRSocketConnection): (name: string, callback: (ok: boolean) => void) => void {
    const handle = (name:string, callback: (ok: boolean) => void) => {
        console.log('Player is attempting to join the game:', name)
        try {

            const ok = store.initializer.addPlayer(name, socket.data.id)
            callback(ok)
            
            if (ok) {
                // notify the main process
                S2MSend<string>({
                    name: Server2Main.ADD_PLAYER,
                    id: socket.data.id,
                    data: name
                })
            }
        } catch (error) {
            console.error("Error in join-game handler", error)
        }
    }
    return handle
}

/**
 * defined a handler for the get ID event. It looks up the id that was assigned to this socket on
 * connection (saved on the socket object)
 * @param socket the socket this handler will be added to
 * @returns the handler
 */
export function makeGetIDHandle(socket: RRSocketConnection): (callback: (id: PlayerID) => void) => void {
    const handle = (callback:(id: PlayerID) => void) => callback(socket.data.id)
    return handle
}

/**
 * creates a handler for the useID event. It checks if the requested ID is available, and if so,
 * makes the change within the ID registry. If the new ID is accepted, this handle also sends lots
 * of peripheral game information to the client, as it was likely lost. This event should really
 * only be used to recover a session from a disconnection
 * @param socket  the socket that this handler will be added to
 * @returns a handler for the use ID event
 */
export function makeUseIDHandle(socket: RRSocketConnection): (id: PlayerID, callback: (ok: boolean) => void) => void {
    const handle = (id: PlayerID, callback:(ok: boolean) => void) => {
        // check if the ID currently exists, if so, then be ok with it, and update this socket's ID
        // to the ID in the request, otherwise send false
        if (store.initializer.players.has(id)) {
            socket.data.id = id
            callback(true)

            // check if there is a timer on this user at the end of which they will be removed
            // from the game (set in on DISCONNECT)
            const to_counter = store.timeout_counters.get(socket.data.id)
            if (to_counter !== undefined) {
                // cancel any such timer, as the player is back
                clearTimeout(to_counter)
                store.timeout_counters.delete(socket.data.id)
            }

            // emit game data to this player. They likely lost it
            socket.emit(Server2Client.PHASE_UPDATE, store.cur_phase)
            socket.emit(Server2Client.UPDATE_PLAYER_STATES, store.player_data)

            // check if there is a pending request for this player, if so, then they have likely
            // lost this information if they are requesting an existing ID; send a new notification
            // that we need information from them
            const pending_requests = store.pending_requests.get(socket.data.id)
            if (pending_requests !== undefined && pending_requests.length > 0) {
                for (const request of pending_requests) {
                    socket.emit(Server2Client.REQUEST_INPUT, request)
                }
                // TODO eventually these need to expire per the expiration
            }
        } else {
            callback(false)
        }
    }
    return handle
}

/**
 * a direct handle for listing bots. It looks up the data in the store and sends it back
 * @param callback the callback function used to return the data
 */
export function listBotsHandle(callback: (bots: Character[], unavailable: CharacterID[]) => void): void {
    callback(BOTS, store.initializer.getUnusedCharacters())
}

/**
 * looks up the robots which are available for selection and sends the data
 * @param callback the callback function used to return the data
 */
export function listAvailableBotsHandle(callback: (bots: CharacterID[]) => void): void {
    callback(store.initializer.getUnusedCharacters())
}

/**
 * creates a handler for the select bot event. It checks that the bot is available, and if so,
 * reserved it for this player, and notifies the other players that the bot is no longer
 * available
 * @param io the socket server object for broadcasting socket events
 * @param socket the socket this handler will be added to
 * @returns the handler for the select bot event
 */
export function makeSelectBotHandle(io: RRSocketServer, socket: RRSocketConnection): (bot_id: string, callback: (ok: boolean) => void) => void {
    const handle = (bot_id:string, callback: (ok:boolean) => void) => {
        // try selecting the bot on the initializer
        const update = store.initializer.setCharacter(socket.data.id, bot_id)
        const ok = update.newly_unavailable.length !== 0
        // update them with the callback
        callback(ok)

        // notify the main thread
        if (ok) {
            // broadcast to other clients that that character is no longer available
            io.emit(Server2Client.BOT_SELECTED, update)
            // notify the main thread that the character was selected
            S2MSend<string>({
                name:Server2Main.SELECT_BOT,
                id: socket.data.id,
                data: bot_id
            })
        }
    }
    return handle
}

/**
 * creates a handler for the program submit event. It forwards the event to the main thread
 * @param socket the socket this handler will be attached to
 * @returns a handler for the program submit event
 */
export function makeProgramSubmitHandle(socket: RRSocketConnection): (program: Program) => void {
    const handle = (program: Program): void => {
        S2MSend<Program>({
            name: Server2Main.PROGRAM_SET,
            id: socket.id,
            data: program
        })
    }
    return handle
}

/**
 * handles the get player state event by getting the player state information
 * @param callback the callback function for returning data to the caller
 */
export function getPlayerStatesHandle(callback: (data: Map<PlayerID, PlayerStateData>) => void): void {
    callback(store.player_data)
}

/**
 * creates a handler for the get programming data event. It gets the programming data locally cached
 * for the player and returns it
 * @param socket the socket this handler will be added to
 * @returns the handler for the get programming data event
 */
export function makeGetProgrammingDataHandle(socket: RRSocketConnection): (callback: (data: ProgrammingData) => void) => void {
    const handle = (callback: (data: ProgrammingData) => void) => {
        // check if we have got programming data for this bro
        const programming_data = store.programming_data.get(socket.data.id)
        if (programming_data === undefined) {
            console.warn("No programming data found for:", socket.data.id)
            callback({
                hand: [],
                new_registers: newRegisterArray()
            })
            return
        }

        callback(programming_data)
    }
    return handle    
}

/**
 * handles a confirm position event by sending a notification to the main thread.
 * The main thread should be tracking who the position has been requested from
 * 
 * TODO, we could verify that this is coming from the correct player, that is that
 * the player sending this event actually has an outstanding event
 */
export function confirmPositionHandle(): void {
    S2MSend<never>({
        name: Server2Main.CONFIRM_POSITION
    })
}
