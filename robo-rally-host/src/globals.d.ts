import type { BoardData } from "./main/game_manager/board"
import type { PlayerUpdate } from "./main/models/connection"
import type { Character, PlayerID, PlayerStateBrief } from "./main/models/player"

declare global {
    interface Window {
        mainAPI: {
            connectRobot: (name: string) => void
            getIP: () => Promise<string|undefined>
            listBoards: () => Promise<string[]>
            loadBoard: (name: string) => Promise<BoardData>
            // loadSerial: () => void
            startGame: () => void
            reset: () => void
            getToDos: () => Promise<Map<PlayerID, string[]>>
        },
        mainEventHandlerAPI: {
            onPlayerUpdate: (callback: (update: PlayerUpdate) => void) => void
            onToDo: (callback: (todos:Map<PlayerID, string[]>) => void) => void
            onPlayerDataUpdated: (callback: (id: PlayerID, update: PlayerStateBrief) => void) => void
        },
    }

    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
    const MAIN_WINDOW_VITE_NAME: string
}
