import { Game } from "./game";
import { GameServer } from "./game_server";
import { Player } from "./player";

declare type GameStore = Map<string,Game>

const store: GameStore = new Map<string,Game>()

const LETTERS: string = 'BCDFGHJKLNPQRTVWXZ'
const MAX_GAMES = 100

function make_game_code(): string {

    let parts: string[] = []

    for (var i: number = 0; i < 4; i++) {
        // get a random number 
        parts.push(LETTERS[Math.floor(LETTERS.length*Math.random())])
    }

    return parts.join('')
}

export function get_game(game_code:string): Game|undefined {
    return store.get(game_code)
}

/**
 * add a game to the game store
 * @param host_code a specific code assigned to the host so they can be identified when joining
 * @param game_type the type of game to be hosted
 * @returns the game object created
 */
export function add_game(host_code:string, game_type: string): Game | string {
    if (store.size >= MAX_GAMES) {
        return "Max game count exceeded"
    }
    // create a variable to hold the new game
    var game_server: GameServer

    // construct a live game server if 
    if (game_type == 'live') {
        game_server = {
            do_move(player, move) {
                return true
            },
            add_player(player) {
                return ""
            },
            stop() {}
        }
    } else /* use default: (game_type == 'virtual') */ {
        game_server = {
            do_move(player, move) {
                return true
            },
            add_player(player) {
                return ""
            },
            stop() {}
        }
    }

    let game_code: string

    do {
        game_code = make_game_code()
    } while (!store.has(game_code))

    // construct the game
    const game: Game = {
        room_code: game_code,
        players: new Map<string,Player>(),
        host: undefined,
        host_code: host_code,
        lobby_open: true,
        game_server: game_server,
        time_created: new Date(),
    }

    store.set(game_code, game)

    return game
}

/**
 * remove the named game
 * @param game_code the code of the game to remove
 * @returns true if the game was successfully ended
 */
export function remove_game(game_code: string): boolean {
    // get the game
    const game = store.get(game_code)

    try {
        // end if it it exists
        game?.game_server.stop()
    } catch (error) {
        return false
    }

    return true
}

/**
 * just gets the games in the store
 * @returns a list of the games
 */
export function get_all_games(): Game[] {
    return Array.from(store.values())
}