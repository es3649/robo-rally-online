import { Player } from "./player"

export declare type GameAction = {}

export declare interface ConnectionDetails {
    host: string,
    port: number,
    AES: any // TODO get the correct type for this
}

/**
 * the GameServer interface allows a game server to be implemented in any number
 * of ways. Ideally this means that a game can be hosted and displayed digitally,
 * or it could be another server proxy which controls another literal game.
 * 
 * It exposes all the methods that a game server needs to run effectively
 */
export declare interface GameServer {
    do_move(player:Player, move: GameAction): boolean
    add_player(player: Player): ConnectionDetails | string
    stop(): void
}