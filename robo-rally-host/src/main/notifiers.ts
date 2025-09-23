import { BoardElement, GamePhase, ProgrammingCard, type GameAction } from "../shared/models/game_data"
import { Main2Render, Main2Server } from "../shared/models/events"
import type { Notifier } from "./game_manager/game_state"
import type { PlayerID } from "../shared/models/player"
import type { Main2ServerMessage, Sender } from "../shared/models/connection"

/**
 * implements the Notifier interface for notifying renderer windows of the events specified
 * in the interface
 */
export class RenderNotifier implements Notifier {
    private render_sender: <T>(channel: Main2Render, data: T) => void
    constructor(render_sender: <T>(channel: Main2Render, data: T) => void) {
        this.render_sender = render_sender
    }

    gameAction(action: GameAction): void {
        // send to the render as well
        this.render_sender<GameAction>(Main2Render.GAME_ACTION, action)
    }

    getInput(player: PlayerID, request: ProgrammingCard.ActionChoice): void {
        // send a short notification to the renderer that input is required
        this.render_sender<PlayerID>(Main2Render.GET_INFO_NOTIFICATION, player)
    }

    beginActivation(): void {
        // notify the players and the renderer that activation is beginning
        this.render_sender(Main2Render.UPDATE_PHASE, GamePhase.Activation)
    }

    updateRegister(register: number): void {
        this.render_sender<number>(Main2Render.UPDATE_REGISTER, register)
    }

    updateBoardElement(element: BoardElement): void {
        this.render_sender(Main2Render.UPDATE_BOARD_ELEMENT, element)
    }
}

/**
 * implements the Notifier interface for notifying the server process (and by extension the
 * clients) of the events specified in the interface
 */
export class ServerNotifier implements Notifier {
    private m2s_sender: Sender<Main2ServerMessage>

    constructor(m2s_sender: Sender<Main2ServerMessage>) {
        this.m2s_sender = m2s_sender
    }

    gameAction(action: GameAction): void {
        // tell the server to send the game action notification
        this.m2s_sender({
            name: Main2Server.GAME_ACTION,
            data: action
        })
    }

    getInput(player: PlayerID, request: ProgrammingCard.ActionChoiceData): void {
        // send the full request to the server to be forwarded to the player
        this.m2s_sender({
            name: Main2Server.GET_INPUT,
            id: player,
            data: request
        })
    }

    beginActivation(): void {
        // notify the players and the renderer that activation is beginning
        this.m2s_sender({
            name: Main2Server.UPDATE_PHASE,
            data: GamePhase.Activation
        })
    }

    updateRegister(register: number) {
        this.m2s_sender({
            name: Main2Server.UPDATE_REGISTER,
            data: register
        })
    }

    updateBoardElement(element: BoardElement) {
        this.m2s_sender({
            name: Main2Server.UPDATE_BOARD_ELEMENT,
            data: element
        })
    }
}