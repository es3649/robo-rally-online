import type { CharacterID, Character, Player, PlayerID, PlayerStateData } from "../../shared/models/player";
import type { BoardData } from "../../main/game_manager/board";
import { defineStore } from "pinia";
import { MAX_PLAYERS } from "../../main/game_manager/initializers";
import type { GameAction } from "../../shared/models/game_data";
import { BoardElement, GamePhase, ProgrammingCard } from "../../shared/models/game_data";

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
            game_phase: GamePhase.Setup,
            register: 1,
            board_element: BoardElement.Players,
            board: undefined as BoardData|undefined,
            board_name: undefined as string|undefined,
            loadable_boards: [] as string[],
            players: new Map<PlayerID, string>(),
            characters: new Map<PlayerID, Character>(),
            player_states: new Map<PlayerID, PlayerStateData>(),
            bot_connections: new Map<CharacterID, boolean>(),
            to_dos: new Map<PlayerID, string[]>(),
            get_input: {
                player: undefined as PlayerID|undefined,
                timeout: 0
            },

            qr: {
                svg_path: "",
                view_box: ""
            },

            game_events: [{
                action: {
                    id: 0,
                    action: ProgrammingCard.left
                },
                actor: {
                    name: "Gemma",
                    id: "saph1234",
                    character: {
                        name: 'bro',
                        id: "ruby1234",
                        sprite_large: "",
                        sprite_small: "",
                        color: {
                            fill_color: "#6789AB",
                            border_color: "#123456"
                        },
                        bluetooth_id: "", 
                    }
                }
            },{
                action: {
                    id: 0,
                    action: ProgrammingCard.left
                },
                actor: {
                    name: "Fitz",
                    id: "emer1234",
                    character: {
                        name: 'sci',
                        id: "topaz1234",
                        sprite_large: "",
                        sprite_small: "",
                        color: {
                            fill_color: "#FEDCBA",
                            border_color: "#987654"
                        },
                        bluetooth_id: "", 
                    }
                }
            }] as GameAction[],
            winner: undefined as (Player|undefined)
        }
    },
    getters: {},
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
        /**
         * set a list of TO DOs received from the server on the state. This is used by the renderer
         * when it receives an event from main
         * @param to_dos the list of TO DOs
         */
        setToDos(to_dos: Map<PlayerID, string[]>): void {
            if (this.setup_status === SetupPhase.Done) {
                console.warn("Tried to add a player after the game has started")
                return
            }
            this.to_dos = to_dos
        },
        /**
         * updates player data. It is invoked by the renderer to modify the game state on updates
         * from main
         * @param id the id of the player to set data for
         * @param update the data update to apply
         */
        setPlayerData(id: PlayerID, update: PlayerStateData): void {
            this.player_states.set(id, update)
        },
        /**
         * unset any get input data. This should cancel timeouts, or at least hide them
         */
        unsetGetInput() {
            this.get_input = {
                player: undefined,
                timeout: 0
            }
        },
        /**
         * request an update of the bot connection statuses from main
         */
        getBotConnectionStatuses() {
            window.mainAPI.getBotStatus().then((value: Map<CharacterID, boolean>) => {
                this.bot_connections = value
            }).catch((reason: any) => {
                console.error("Failed to get bot connections", reason)
            })
        }
    }
})