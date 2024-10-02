import { Color } from "../models/player"
import type {  Character, Player, PlayerID, PlayerName, PlayerState } from "../models/player"
import type { Main2ServerMessage, Sender } from '../models/connection'
import { type GameAction, GamePhase, ProgrammingCard, type RegisterArray } from '../models/game_data'

import type { Board } from "./board"
import { Main2Server } from "../models/events"
import { bot_action, connectRobot, BotAction } from "../bluetooth"
import { DeckManager } from "./deck_manager"
import type { OrientedPosition } from "../models/movement"

const MAX_PLAYERS = 6

declare type PositionMap = Map<PlayerID, OrientedPosition>

/**
 * GameManager class manages the game state and invokes the game logic when it's
 * time to do so.
 */
export class GameManager {
    private started: boolean = false
    private players = new Map<PlayerID,Player>() // maps player names to players
    private decks = new Map<PlayerID, DeckManager>()
    private programs = new Map<PlayerID, RegisterArray|undefined>()
    private shutdowns = new Set<PlayerID>()
    private board: Board|undefined
    private player_states = new Map<string, PlayerState>()
    private readonly M2SSender: Sender<Main2Server>

    /**
     * 
     * @param server_proc the process for the server which we will need to send data to
     */
    constructor(sender: Sender<Main2Server>) {
        this.M2SSender = sender
        this.started = false
    }

    /**
     * Adds a new player to the game
     * @param player_name the name of the player we are adding to the game
     * @returns false if the player couldn't be added
     */
    add_player(player_name: string, player_id: string): boolean {
        // don't add players after game start
        if (this.started) {
            return false
        }
        // don't allow adding more than max players
        // don't allow duplicate player IDs
        if (this.players.size >= MAX_PLAYERS || this.players.has(player_id)) {
            return false
        }
        // build the player object
        const player: Player = {
            name: player_name,
            id: player_id,
            // get a default color for the player
            colors: Color.by_number(this.players.size)
        }
        
        // set the players initial state
        this.player_states.set(player_id, {
            priority: this.players.size,
            energy: 3,
            name: player_name,
            checkpoints: 0,
            active: true
        })
        
        // add this player to our registry
        this.players.set(player_id, player)
        this.decks.set(player_id, new DeckManager())
        // return the conn details to the caller
        return true
    }

    /**
     * adds a character to the player entry
     * @param player_id the id of the player to add the character to
     * @param bot the character to add
     */
    add_character(player_id: string, bot: Character): boolean {
        // don't change bots after game start
        if (this.started) {
            return false
        }
        // get the player
        const player = this.players.get(player_id)
        if (player !== undefined) {
            // set the bot
            player.character = bot
        }

        // connect the bot over bluetooth
        connectRobot(bot.id)
        return true
    }

    /**
     * start the current game
     * @returns false if the game dat is not configured correctly yet
     */
    start(): boolean {
        // there better be a board
        if (this.board === undefined) {
            return false
        }
        // validate all players and bot connections
        for (const player of this.players.values()) {
            if (player.character === undefined) {
                return false
            }
            if (player.colors === undefined) {
                player.colors = Color.GRAY
            }
            if (!connectRobot(player.character.id)) {
                return false
            }
        }
        // add the players to the programs
        this.reset_programs()
        // set the game to started
        this.started = true
        return true
    }

    /**
     * stop the current game. This may require sending a reset
     */
    stop() {
        this.started = false
    }

    /**
     * loads the given board to the game data
     * @param board the board to use
     */
    use_board(board: Board): void {
        // don't change the board after the game has started
        if (this.started) {
            return
        }
        // lol
        this.board = board
    }

    set_program(player_name:PlayerName, program: RegisterArray) {
        this.programs.set(player_name, program)
        for (const [_, program] of this.programs.entries()) {
            if (program === undefined) {
                return
            }
        }
        // if we've gotten here, then all programs are set. Proceed to activation phase
        // broadcast phase update
        const msg: Main2ServerMessage<GamePhase> = {
            name: Main2Server.PHASE_UPDATE,
            data: GamePhase.Activation
        }
        this.M2SSender(msg)

        // run activation phase
        this.activationPhase()
    }

    /**
     * mark the player for a shutdown
     * @param player_id the id of the player marked for shutdown
     */
    set_shutdown(player_id: PlayerID) {
        this.shutdowns.add(player_id)
    }

    /**
     * reset the player's programs
     */
    private reset_programs() {
        for (const player of this.players.keys()) {
            this.programs.set(player, undefined)
        }
        this.shutdowns.clear()
    }

    private board_elements(): void {

    }

    /**
     * run the logic of the activation phase
     */
    private activationPhase() {
        // serious logic happens here
        // begin with the priority player, and run through the registers, performing actions
        let players_in_priority: (Player)[] = []
        this.players.forEach((player: Player, _: string) => {
            const state = this.player_states.get(player.name) as PlayerState
            players_in_priority.splice(state.priority, 0, player)
        })

        // bluetooth shutdown any robots
        this.shutdowns.forEach((player_id: PlayerID, value2: string, _: Set<PlayerID>) => {
            const player = this.players.get(player_id)
            if (player === undefined || player.character === undefined) return
            // send the action to the bot
            bot_action(player.character.id, BotAction.SHUTDOWN)
        })

        // TODO set shutdown players in the renderer

        // for each register
        for (var i = 0; i < 5; i++) {
            // for each player in priority order
            players_in_priority.forEach((player: Player, index: number, arr: Player[]) => {
                // execute their move
                // players who are shutdown do nothing
                if (this.shutdowns.has(player.id)) {
                    return
                }

                const program = this.programs.get(player.id)
                if (program === undefined || this.board === undefined) {
                    return
                }

                const movements = this.resolveMovements(program[index])
                // preprocess the action and create the movement array
                // if this is a spam, resolve it
                // if this is again, resolve it
                // if this is a haywire, resolve it
                    // prompt the user if needed
                    // resolve any decision

                // verify that the execution of the movement array is legal from the current position
                    // i.e.: (no walls in the way of any movements)
                // discover any pushing of other bots

                // execute the action
                
            })

            // execute actions related to board events
            this.board_elements()
        }

        // reset their programs
        this.reset_programs()
        // update the phase
        const message: Main2ServerMessage<GamePhase> = {
            name: Main2Server.PHASE_UPDATE,
            data: GamePhase.Upgrade
        }
        this.M2SSender(message)
    }

    resolveMovements(action: ProgrammingCard[], player_id: PlayerID): MovementArray {
        if (action.length > 1) {
            // figure this case out
            console.warn("multi-input program sets are not Implemented")
            return []
        }

        if (action[0].action == ProgrammingCard.spam) {
            var card: ProgrammingCard
            do {
                card = (this.decks.get(player_id) as DeckManager).drawCard()
            } while (card.action != ProgrammingCard.spam)
            return 
        }
    }
}