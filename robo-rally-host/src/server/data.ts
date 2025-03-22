import { GameInitializer } from "@/main/game_manager/initializers"
import { senderMaker, type ClientToServerEvents, type PendingActionChoice, type ProgrammingData, type ServerToClientEvents, type SocketData } from "@/shared/models/connection"
import type { Server2Main } from "@/shared/models/events"
import { GamePhase } from "@/shared/models/game_data"
import type { PlayerID, PlayerStateData } from "@/shared/models/player"
import type { EventsMap } from "node_modules/socket.io/dist/typed-events"
import type { Server, Socket } from "socket.io"

// declare these types for brevity when we need to pass them to functions
export declare type RRSocketServer = Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>
export declare type RRSocketConnection = Socket<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>

// create a sender wrapper for server to main communications
export const S2MSend = senderMaker<Server2Main>(process)

// this connections map will hold all the socket connections in case we need to
// send a message to a particular user
export const connections = new Map<PlayerID, Socket>()

export const store = {
    // set up an initializer, which we will maintain locally and use to quickly process join
    // and character update requests from clients. This will also allow us to maintain 2-way
    // communication with the clients, since inter-process comms are one-way
    initializer: new GameInitializer(),
    
    // TODO it might be good to maintain copies of other data here as well, such as PlayerStates
    // as far as we know them, and the current phase, so that clients can quickly query these
    // data if they disconnect or something
    cur_phase: GamePhase.Lobby,
    player_data: new Map<PlayerID, PlayerStateData>(),
    
    // a mapping of player IDs to timeout counters, the resolution of which will delete the player
    // from the game
    timeout_counters: new Map<PlayerID, NodeJS.Timeout>(),

    // a mapping of pending requests so that we can resend them if needed on a reconnect
    pending_requests: new Map<PlayerID, PendingActionChoice[]>(),

    // the programming data for the players to get once they are ready to program
    programming_data: new Map<PlayerID, ProgrammingData>()
}