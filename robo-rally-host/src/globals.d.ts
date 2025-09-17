import type { BoardData } from "./main/game_manager/board"
import type { PlayerUpdate } from "./main/models/connection"
import type { Character, PlayerID, PlayerStateBrief } from "./main/models/player"
import type { BoardElement, GamePhase } from "./shared/models/game_data"
import { CharacterID } from "./shared/models/player"

declare global {
    interface Window {
        mainAPI: {
            connectRobot: (id: CharacterID) => Promise<boolean>
            getBotStatus: () => Promise<Map<CharacterID, boolean>>
            getIP: () => Promise<string|undefined>
            listBoards: () => Promise<string[]>
            loadBoard: (name: string) => Promise<BoardData>
            // loadSerial: () => void
            startGame: () => Promise<boolean>
            reset: () => void
            getToDos: () => Promise<Map<PlayerID, string[]>>
        },
        mainEventHandlerAPI: {
            onPlayerUpdate: (callback: (update: PlayerUpdate) => void) => void
            onToDo: (callback: (todos:Map<PlayerID, string[]>) => void) => void
            onPlayerDataUpdated: (callback: (id: PlayerID, update: PlayerStateBrief) => void) => void
            onGameAction: (callback: (action: GameAction) => void) => void
            onGetInputNotification: (callback: (player: PlayerID) => void) => void
            onUpdateGamePhase: (callback: (phase: GamePhase) => void) => void
            onUpdateRegister: (callback: (register: number) => void) => void
            onUpdateBoardElement: (callback: (element: BoardElement) => void) => void
            onGameOverNotification: (callback: (winner: Player) => void) => void
        },
    }

    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
    const MAIN_WINDOW_VITE_NAME: string
}
