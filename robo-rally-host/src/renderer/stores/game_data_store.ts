import { Board } from "../../main/game_manager/board";
import { defineStore } from "pinia";

export enum SetupPhase {
    PreSetup,
    BoardSetup,
    Lobby,
    Done
}

export const useGameDataStore = defineStore({
    id: 'game_data',
    state() {
        return {
            setup_status: SetupPhase.PreSetup,
            board: undefined as Board|undefined,
            loadable_boards: [] as string[]
        }
    },
    actions: {
        async loadBoard(name: string): Promise<void> {
            this.board = await window.mainAPI.loadBoard(name)
        },
        async loadFromSerial(): Promise<void> {
            // once this is implemented, this will be correct
            // this.board = await window.mainAPI.loadSerial()
        },
        async listBoards(): Promise<void> {
            this.loadable_boards = await window.mainAPI.listBoards()
            console.log("loaded loadable boards:")
            console.log(this.loadable_boards)
        }
    }
})