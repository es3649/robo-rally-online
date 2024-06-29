import { Player } from "../models/player"
import { ConnectionDetails } from '../models/connection'

export declare type GameAction = {}



/**
 * the GameServer interface allows a game server to be implemented in any number
 * of ways. Ideally this means that a game can be hosted and displayed digitally,
 * or it could be another server proxy which controls another literal game.
 * 
 * It exposes all the methods that a game server needs to run effectively
 */
export declare interface GameServer {
    do_move(player:Player, move: GameAction): boolean
    add_player(player_name: string): ConnectionDetails | string
    stop(): void
}