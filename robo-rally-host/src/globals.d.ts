import type { Board } from "./main/game_server/board"

declare global {
    interface Window {
        mainAPI: {
            connectRobot: (name: string) => void
            getIP: () => Promise<string|undefined>
            listBoards: () => Promise<string[]>
            loadBoard: (name: string) => Promise<Board>
            loadSerial: () => void
        }
    }

    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
    const MAIN_WINDOW_VITE_NAME: string
}
