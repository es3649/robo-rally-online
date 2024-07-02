import { Player } from '../models/player'
import { GameServer } from './game_server'

// the maximum number of players allowed in a game
export const MAX_PLAYERS: number = 6

/**
 * a Game object contains all the properties needed at a surface level to have a game.
 * The game itself is managed by the game_server, but player details are stored here, as
 * well as the game itself so that players can join the lobby while it's open, and so that
 * platers who disconnect can be reconnected (at least in theory)
 */
export declare type Game = {
    room_code: string
    players: Map<string,Player>,
    host_code: string,
    host: string,
    lobby_open: boolean,
    game_server: GameServer,
    time_created: Date,
    // time_accessed: Date
}