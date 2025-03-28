import { ProgrammingCard, type GameAction, type GamePhase, type Program, type ProgrammingHand, type RegisterArray } from './game_data'
import type { Character, CharacterID, PlayerID, PlayerStateData } from './player'
import { Server2Main, Main2Server } from './events'

export type BotAvailabilityUpdate = {
    newly_available: CharacterID[],
    newly_unavailable: CharacterID[]
}

export enum PlayerStatusUpdate {
    ADDED,
    REMOVED
}

export type PlayerUpdate = {
    id: PlayerID,
    name?: string,
    character?: CharacterID,
    status?: PlayerStatusUpdate
}

export interface PendingActionChoice extends ProgrammingCard.ActionChoiceData {
    expiration: number
}

export type ProgrammingData = {
    new_registers: RegisterArray,
    hand: ProgrammingHand
}
/**
 * the events which can be sent from the socket to a client, including the data
 * types, returns, and callback types. The keys should exactly match the properties
 * of Server2Client from events.ts
 */
export interface ServerToClientEvents {
    // noArg: () => void
    // basicEmit: (a:number, b:string, c:boolean) => void
    // withAck: (d:string, callback: (e:number) => void) => void

    // lobby events
    "server:bot-selected": (update:BotAvailabilityUpdate) => void
    "server:bot-list": (bots: Character[]) => void
    
    // game events
    "server:phase-update": (phase:GamePhase) => void
    "server:game-action": (action: GameAction) => void
    "server:update-player-states": (states: Map<PlayerID, PlayerStateData>) => void
    "server:request-input": (message: PendingActionChoice) => void

    "server:reset": () => void
}

/**
 * the list of events with handler signatures that can be sent to the server from the client
 * the keys here should exactly match the properties of Client2Server from events.ts
*/
export interface ClientToServerEvents {
    // lobby events
    "client:join-game": (name:string, callback:(ok:boolean) => void) => void
    "client:leave-game": () => void
    "client:list-bots": (callback:(bots:Character[], available: CharacterID[]) => void) => void
    "client:list-available-bots": (callback: (bots: CharacterID[]) => void) => void
    "client:select-bot": (bot_id: string, callback: (ok: boolean) => void) => void
    "client:get-id": (callback:(id:string) => void) => void
    "client:use-id": (id: PlayerID, callback:(ok:boolean) => void) => void
    "client:get-player-states": (callback: (states: Map<PlayerID, PlayerStateData>) => void) => void
    "client:send-input": (selection: string) => void
    "client:get-programming-data": (callback:(data: ProgrammingData) => void) => void

    // game events
    "client:confirm-position": () => void
    "client:program-submit": (program: Program) => void
    "client:program-shutdown": () => void

    // upgrade events
    // "client:request-upgrade": (callback: (upgrade: UpgradeCard) => void) => void
    // "client:add-upgrade": (upgrade: UpgradeCard) => void
    // useUpgrade: (upgrade: UpgradeCard) => void
}

export const EventsMap = {
    join: true
}

/**
 * the list and types of properties which will be available on socket.data
 */
export interface SocketData {
    id: string
}

/**
 * a generic message type which has a name of type T and data of type S
 * Only specific instances will be exported
 * @template T the type of the message, should be a string
 * @template S the type of the data to be sent in the message
 */
export type Message<T, S> = {
    name: T,
    id?: string,
    data?: S
}

// specific instances of Message for messages sent between Main and Server
export type Main2ServerMessage<T> = Message<Main2Server, T>
export type Server2MainMessage<T> = Message<Server2Main, T>

/**
 * An alias for a templated message sender function
 * @template T the type of the message to be send, should be a string
 */
export type Sender<T> = {
    <S>(message: Message<T, S>,
        sendHandle?: any,
        options?: { keepOpen?: boolean | undefined} | undefined,
        callback?: ((error: Error | null) => void ) | undefined
    ): boolean
}

export interface Sendable {
    send?: (message: any,
        sendHandle?: any,
        options?: { keepOpen?: boolean|undefined } | undefined,
        callback?: ((error: Error|null) => void) | undefined
    ) => boolean
}

/**
 * @template T the type of the message to be sent, should be a string
 * @param process the process that messages can be sent on
 * @returns a template function with the same signature as process.send or childProcess.send
 */
export function senderMaker<T>(process: Sendable): Sender<T> {
    /**
     * a wrapper for process.send, or fork.ChildProcess.send, since the former could
     * technically be undefined
     * @template S the type of the data to be sent in the message
     * @param message the message to be sent. It takes a specific form per the parametrization
     * @param sendHandle see docs for process.send
     * @param options see docs for process.send
     * @param callback see docs for process.send
     * @returns see docs for process.send (false if process.send is undefined)
     */
    function sender<S>(message: Message<T, S>,
        sendHandle?: any,
        options?: { keepOpen?: boolean | undefined} | undefined,
        callback?: ((error: Error | null) => void ) | undefined
    ) : boolean {
        if (process.send === undefined) {
            return false
        }
        return process.send(message, sendHandle, options, callback)
    }
    return sender
}