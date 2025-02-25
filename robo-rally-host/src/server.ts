console.log('running server.js')
import express, { type Express } from 'express'
import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { Server, Socket } from 'socket.io'
import { GamePhase, type RegisterArray } from "./main/models/game_data"
import { Client2Server, Default, Server2Main, Main2Server, Server2Client } from './main/models/events'
import { senderMaker } from './main/models/connection'
import type { ClientToServerEvents, ServerToClientEvents, SocketData, Main2ServerMessage } from './main/models/connection'
import type { EventsMap } from 'node_modules/socket.io/dist/typed-events'
import { GameInitializer } from './main/game_manager/initializers'
import type { PlayerID, Character, PlayerState, Player, CharacterID } from './main/models/player'
import { BOTS } from './main/data/robots'

export const app: Express = express()
const port = process.env.PORT || 80
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
const io = new Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>(server, {
    cors: {
        origin: "*"
    }
})

// add a file handler at the root
app.use(express.static('assets/public_html'))

// create a sender wrapper for server to main communications
const S2MSender = senderMaker<Server2Main>(process)

// this connections map will hold all the socket connections in case we need to
// send a message to a particular user
const connections: Map<string, Socket> = new Map<string,Socket>()

// set up an initializer, which we will maintain locally and use to quickly process join
// and character update requests from clients. This will also allow us to maintain 2-way
// communication with the clients, since inter-process comms are one-way
let initializer = new GameInitializer()

// TODO it might be good to maintain copies of other data here as well, such as PlayerStates
// as far as we know them, and the current phase, so that clients can quickly query these
// data if they disconnect or something
let cur_phase = GamePhase.Lobby
const player_data = new Map<PlayerID, PlayerState>()

// handle the connection event
io.on(Default.CONNECTION, (socket) => {
    console.log('a user connected')

    // generate a socket ID and store it
    const id = randomUUID()
    connections.set(id, socket)
    socket.data.id = id

    // connection events
    socket.on(Default.DISCONNECT, () => {
        console.log('a user disconnected')
        // remove the user from the connections
        connections.delete(socket.data.id)
        // notify the main that the player has disconnected
        S2MSender<never>({
            name: Server2Main.PLAYER_DISCONNECTED,
            id: socket.data.id
        })
    })
    
    // lobby events
    socket.on(Client2Server.JOIN_GAME, (name:string, callback: (ok: boolean) => void) => {
        console.log('Player is attempting to join the game:', name)
        try {

            const ok = initializer.addPlayer(name, socket.data.id)
            callback(ok)
            
            if (ok) {
                // notify the main process
                S2MSender<string>({
                    name: Server2Main.ADD_PLAYER,
                    id: socket.data.id,
                    data: name
                })
            }
        } catch (error) {
            console.error("Error in join-game handler", error)
        }
    })

    // let the player get their ID
    socket.on(Client2Server.GET_ID, (callback:(id: PlayerID) => void) => callback(socket.data.id))

    socket.on(Client2Server.USE_ID, (id: PlayerID, callback:(ok: boolean) => void) => {
        // check if the ID currently exists, if so, then be ok with it, and update this socket's ID
        // to the ID in the request, otherwise send false
        if (initializer.players.has(id)) {
            socket.data.id = id
            callback(true)
        } else {
            callback(false)
        }
    })

    // game events
    socket.on(Client2Server.LIST_BOTS, (callback: (bots: Character[], unavailable: CharacterID[]) => void) => {
        callback(BOTS, initializer.getUnusedCharacters())
    })

    socket.on(Client2Server.LIST_AVAILABLE_BOTS, (callback: (bots: CharacterID[]) => void) => {
        callback(initializer.getUnusedCharacters())
    })

    // character selection
    socket.on(Client2Server.SELECT_BOT, (bot_id:string, callback: (ok:boolean) => void) => {
        // try selecting the bot on the initializer
        const update = initializer.setCharacter(socket.data.id, bot_id)
        const ok = update.newly_unavailable.length !== 0
        // update them with the callback
        callback(ok)

        // notify the main thread
        if (ok) {
            // broadcast to other clients that that character is no longer available
            io.emit(Server2Client.BOT_SELECTED, update)
            // notify the main thread that the character was selected
            S2MSender<string>({
                name:Server2Main.SELECT_BOT,
                id: socket.data.id,
                data: bot_id
            })
        }
    })

    // when a program is submitted
    socket.on(Client2Server.PROGRAM_SUBMIT, (program:RegisterArray) => {
        S2MSender<RegisterArray>({
            name: Server2Main.PROGRAM_SET,
            id: socket.id,
            data: program
        })
    })

    // when a shutdown is submitted
    socket.on(Client2Server.PROGRAM_SHUTDOWN, () => S2MSender<never>({
        name: Server2Main.PROGRAM_SHUTDOWN,
        id: socket.data.id
    }))

    // socket.on(Client2Server.REQUEST_UPGRADE, () => {console.log('client:request-upgrade is not implemented')})
    // socket.on(Client2Server.ADD_UPGRADE, () => {console.log('client:add-upgrade is not implemented')})
})

// determine which message was received, send it back
process.on('message', (message: Main2ServerMessage<any>) => {
    switch (message.name) {
        case Main2Server.GAME_ACTION:
            io.emit(Server2Client.GAME_ACTION, message.data)
            break
        case Main2Server.PHASE_UPDATE:
            io.emit(Server2Client.PHASE_UPDATE, message.data)
            break
        case Main2Server.RESET:
            io.emit(Server2Client.RESET)
            initializer = new GameInitializer()
            break
        case Main2Server.GET_INPUT:
            if (message.id === undefined) {
                console.error("Input requested but no ID provided")
                return
            }
            const sock = connections.get(message.id)
            if (sock === undefined) {
                console.error("")
                return
            }
            // TODO
        case Main2Server.REQUEST_POSITION:
            break
    }
})

// listen and serve
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
