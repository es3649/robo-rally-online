import { Color, type Player, type PlayerState } from "../models/player"
import type { ConnectionDetails } from '../models/connection'
import { type GameAction, GamePhase, type RegisterArray } from '../models/game_data'
import { Server, Socket } from "socket.io"
import { type ServerToClientEvents, type ClientToServerEvents, ClientEvents, ServerEvents } from '../models/connection'
import { randomUUID } from "crypto"
import { MAX_PLAYERS } from "../server/game_controller/game"
import type { BoardManager } from "./board_action_manager"
import type { Board } from "./board"


/**
 * the GameServer interface allows a game server to be implemented in any number
 * of ways. Ideally this means that a game can be hosted and displayed digitally,
 * or it could be another server proxy which controls another literal game.
 * 
 * It exposes all the methods that a game server needs to run effectively
 */
export declare interface GameServer {
    // do_move(player:Player, move: GameAction): boolean
    add_player(player_name: string): ConnectionDetails | string
    stop(): void
    load_board(board: Board): void
}

interface InterServerEvents {
    ping: () => void
}

interface SocketData {
    name: string
}

export class DataServer implements GameServer {
    private started: boolean = false
    private players = new Map<string,Player>() // maps player names to players
    private conn = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>()
    private programs = new Map<string, RegisterArray>()
    private board_manager: BoardManager
    private player_states = new Map<string, PlayerState>()

    constructor(manager: BoardManager) {
        this.started = false
        this.board_manager = manager

        this.socket_setup()
    }

    socket_setup() {
        this.conn.on('connect', this.connectionHandler)
        // this.conn.on(ClientEvents.submitProgram, this.programSubmittedHandler)
    }
    /**
     * Adds a new player to the game
     * @param player_name the name of the player we are adding to the game
     */
    add_player(player_name: string): ConnectionDetails | string {
        // don't allow adding more than max players
        if (this.players.size >= MAX_PLAYERS) {
            return "Max player count reached"
        }
        // issue a new connection
        const playerID = randomUUID()
        // build the player object
        const player = {
            name: player_name,
            conn_details: {
                playerID: playerID,
                host: 'localhost', // TODO
                port: 31729
            },
            // get a default color for the player
            colors: Color.by_number(this.players.size)
        }
        
        // set the players initial state
        this.player_states.set(playerID, {
            priority: this.players.size,
            energy: 3,
            name: player_name,
            checkpoints: 0,
            active: true
        })
        
        // add this player to our registry
        this.players.set(player.name, player)
        // return the conn details to the caller
        return player.conn_details
    }

    stop() {
        this.started = false
    }

    load_board(board: Board): void {
        this.board_manager.load_board(board)
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