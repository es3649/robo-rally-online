import { type M2SGameActionMessage, type M2SGetInputMessage, type M2SPhaseUpdateMessage, type M2SProgrammingDataMessage, type M2SRequestPositionMessage, type M2SUpdatePlayerStatesMessage, type Main2ServerMessage, type ProgrammingData } from "../shared/models/connection";
import { Server2Client } from "../shared/models/events";
import { GamePhase, ProgrammingCard, type GameAction } from "../shared/models/game_data";
import { connections, store, type RRSocketServer } from "./data";
import { GameInitializer } from "../main/game_manager/initializers";
import type { PlayerID, PlayerState } from "../shared/models/player";

/**
 * handles a gameAction message. This is done by forwarding it to all listening sockets
 * @param io the socket server object
 * @param message the message object to handle
 */
export function gameActionHandle(io: RRSocketServer, message: M2SGameActionMessage): void {
    if (message.data === undefined) {
        console.warn("Received empty game action")
        return
    }
    io.emit(Server2Client.GAME_ACTION, message.data)
}

/**
 * handles a phase update event from main. It forwards the event to the clients, and saves the phase
 * locally. If the phase is not provided for some reason, a warning is fired off, and an attempt is
 * made to infer the correct next state.
 * @param io the socket server object
 * @param message the message received
 */
export function phaseUpdateHandle(io: RRSocketServer, message: M2SPhaseUpdateMessage): void {
    let phase = message.data
    if (phase === undefined) {
        console.warn("Received phase update with no phase, updating manually")
        switch (store.cur_phase) {
            case GamePhase.Lobby:
            case GamePhase.Activation:
                phase = GamePhase.Upgrade
                break
            case GamePhase.Upgrade:
            case GamePhase.Programming:
                phase = GamePhase.Activation
                break
            case GamePhase.Setup:
                phase = GamePhase.Lobby
                break
            case GamePhase.Finished:
                phase = GamePhase.Setup
                break
        }
    }
    io.emit(Server2Client.PHASE_UPDATE, phase)
    store.cur_phase = phase
}

/**
 * handles a reset event by resetting the initializer and forwarding the command
 * to the connected clients
 * @param io the socket server
 */
export function resetHandle(io: RRSocketServer): void {
    io.emit(Server2Client.RESET)
    store.initializer = new GameInitializer()
}

/**
 * handles a get input event by setting it on the store, and forwarding the event to the
 * appropriate player
 * @param message the message from main
 */
export function getInputHandle(message: M2SGetInputMessage): void {
    console.log("recv'd new GetInput event")
    if (message.id === undefined) {
        console.error("Received malformed event data")
        return
    }
    if (!connections.has(message.id)) {
        console.error("trying to get input for nonexistent player")
        return
    }
    connections.get(message.id)?.emit(Server2Client.REQUEST_INPUT, message.data)
}

/**
 * handles a request position event. It forwards the event to the correct player
 * @param message the message from main
 */
export function requestPositionHandle(message: M2SRequestPositionMessage): void {
    if (message.id === undefined) {
        console.warn("Empty PlayerID on position request")
        return
    }
    connections.get(message.id)?.emit(Server2Client.REQUEST_POSITION)
}

/**
 * handles an update player states event by saving the update locally, then broadcasting the
 * data to the connected clients
 * @param message the message from main
 */
export function updatePlayerStatesHandle(message: M2SUpdatePlayerStatesMessage): void {
    // save the player data for faster distribution later
    store.player_data = message.data as Map<PlayerID, PlayerState>
    // emit the player_data summaries to each player
    for (const sock of connections.values()) {
        sock.emit(Server2Client.UPDATE_PLAYER_STATES, store.player_data)
    }
}

/**
 * handles a programming data event by storing the information in the store. We expect players to
 * fetch this information when they are ready for programming
 * @param message the message from main
 */
export function programmingDataHandle(message: M2SProgrammingDataMessage): void {
    console.log("received programming data")
    const programming_data = message.data as Map<PlayerID, ProgrammingData>
    if (programming_data === undefined) {
        console.error("got empty programming data")
        return
    }

    // just hold onto this until the clients ask for it
    store.programming_data = programming_data
}
