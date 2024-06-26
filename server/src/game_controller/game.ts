import { Player } from './player'
import { GameServer } from './game_server'

/**
 * a Game object contains all the properties needed at a surface level to have a game.
 * The game itself is managed by the game_server, but player details are stored here, as
 * well as the game itself so that players can join the lobby while it's open, and so that
 * platers who disconnect can be reconnected (at least in theory)
 */
export declare type Game = {
    room_code: string
    players: Player[],
    host_code: string,
    host: Player|undefined,
    lobby_open: boolean,
    game_server: GameServer
}