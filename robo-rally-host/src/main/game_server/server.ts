import { Color, type Player, type PlayerState } from "../models/player"
import type { Sender } from '../models/connection'
import { type GameAction, GamePhase, type RegisterArray } from '../models/game_data'
import fork from 'child_process'

import type { Board } from "./board"
import type { Main2Server } from "../models/events"

const MAX_PLAYERS = 6

/**
 * 
 */
export class GameManager {
    private started: boolean = false
    private players = new Map<string,Player>() // maps player names to players
    private programs = new Map<string, RegisterArray>()
    private board: Board|undefined
    private player_states = new Map<string, PlayerState>()
    private readonly sender: Sender<Main2Server>

    /**
     * 
     * @param server_proc the process for the server which we will need to send data to
     */
    constructor(sender: Sender<Main2Server>) {
        this.sender = sender
        this.started = false
    }

    /**
     * Adds a new player to the game
     * @param player_name the name of the player we are adding to the game
     */
    add_player(player_name: string, id: string): boolean {
        // don't allow adding more than max players
        if (this.players.size >= MAX_PLAYERS) {
            return false
        }
        // build the player object
        const player = {
            name: player_name,
            // get a default color for the player
            colors: Color.by_number(this.players.size)
        }
        
        // set the players initial state
        this.player_states.set(id, {
            priority: this.players.size,
            energy: 3,
            name: player_name,
            checkpoints: 0,
            active: true
        })
        
        // add this player to our registry
        this.players.set(id, player)
        // return the conn details to the caller
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
        // lol
        this.board = board
    }

    set_program(player_name:string, program: RegisterArray) {
        this.programs.set(player_name, program)
        for (const [_, program] of this.programs.entries()) {
            if (program === undefined) {
                return
            }
        }
        // if we've gotten here, then all programs are set. Proceed to activation phase

        // broadcast phase update
        this.activationPhase()
    }

    private activationPhase() {
        // serious logic happens here
        // begin with the priority player, and run through the registers, performing actions
        let players_in_priority: (Player|undefined)[] = []
        this.players.forEach((player: Player, _: string) => {
            const state = this.player_states.get(player.name) as PlayerState
            players_in_priority.splice(state.priority, 0, player)
        })

    }

    private broadcast() {
        
    }

    private connectionHandler() {}
    private programSubmittedHandler(playerID: string, program: RegisterArray) {
        this.programs.set(playerID, program)
        // check if all programs are in
        if (this.programs.size == this.players.size) {
            // move to the next phase
            this.conn.emit(ServerEvents.beginPhase, GamePhase.Activation)
            this.activationPhase()
            this.programs.clear()
        }
    }
}