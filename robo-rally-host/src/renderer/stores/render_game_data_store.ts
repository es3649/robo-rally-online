import { type Character, type PlayerID, type PlayerStateData } from "@/main/models/player";
import type { BoardData } from "../../main/game_manager/board";
import { defineStore } from "pinia";
import { MAX_PLAYERS } from "../../main/game_manager/initializers";
import type { GameAction } from "../../main/models/game_data";

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
            board: undefined as BoardData|undefined,
            board_name: undefined as string|undefined,
            loadable_boards: [] as string[],
            players: new Map<PlayerID, string>(),
            characters: new Map<PlayerID, Character>(),
            player_states: new Map<PlayerID, PlayerStateData>(),
            to_dos: new Map<PlayerID, string[]>(),

            qr: {
                svg_path: "",
                view_box: ""
            },

            game_events: [] as GameAction[]
        }
    },
    actions: {
        async loadBoard(name: string): Promise<boolean> {
            const ret = await window.mainAPI.loadBoard(name)
            if (ret === undefined) {
                // TODO this is an error, flash a toast or smth
                return false
            }
            // only overwrite the board if we got an actual new board
            this.board = ret
            this.board_name = this.board.display_name
            return true
        },
        async loadFromSerial(): Promise<void> {
            // once this is implemented, this will be correct
            // this.board = await window.mainAPI.loadSerial()
        },
        async listBoards(): Promise<void> {
            this.loadable_boards = await window.mainAPI.listBoards()
            console.log("loaded loadable boards:")
            console.log(this.loadable_boards)
        },
        /**
         * adds the player to the lobby
         * @param player_id the id of the new player
         * @param name the name of the player
         */
        addPlayer(player_id: PlayerID, name: string): void {
            if (this.setup_status === SetupPhase.Done) {
                console.warn("Tried to add a player after the game has started")
                return
            }
            if (this.players.size > MAX_PLAYERS) {
                console.warn("Tried to add player when lobby is full")
                return
            }
            this.players.set(player_id, name)
        },
        /**
         * removes the player from the game store
         * @param player_id the id of the player to remove from the collection
         */
        removePlayer(player_id: PlayerID): void {
            console.log(`Attempting to remove ${player_id}`)
            if (this.setup_status === SetupPhase.Done) {
                console.warn("Tried to remove a player when the lobby isn't open")
                return
            }
            // remove the player from everywhere
            if (this.players.has(player_id)) {
                // remove the player
                this.players.delete(player_id)
                console.log('Player removed')
            }
            if (this.characters.has(player_id)) {
                this.characters.delete(player_id)
                console.log("Player's character removed")
            }
        },
        /**
         * sets the given character for the given player
         * @param player_id the id of the player to set the character on
         * @param character the character to set
         */
        characterSelected(player_id: PlayerID, character: Character): void {
            if (this.setup_status !== SetupPhase.Lobby) {
                console.warn("Tried to add a player after the game has started")
                return
            }
            this.characters.set(player_id, character)
        },
        /**
         * remove the character association for the given player
         * @param player_id the id of the player whose character is to be removed
         */
        unsetCharacter(player_id: PlayerID): void {
            if (this.setup_status !== SetupPhase.Lobby) {
                console.warn("Tried to add a player after the game has started")
                return
            }
            this.characters.delete(player_id)
        },
        setToDos(to_dos: Map<PlayerID, string[]>): void {
            if (this.setup_status === SetupPhase.Done) {
                console.warn("Tried to add a player after the game has started")
                return
            }
            this.to_dos = to_dos
        },
        setPlayerData(id: PlayerID, update: PlayerStateData): void {
            this.player_states.set(id, update)
        }
    }
})