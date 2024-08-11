import { type Player } from "../models/player";

const LETTERS: string = 'BCDFGHJKLNPQRTVWXZ'
/**
 * creates a 4-digit room code
 * @returns a randomly generated 4-letter code
 */
function make_game_code(): string {

    let parts: string[] = []

    for (var i: number = 0; i < 4; i++) {
        // get a random number 
        parts.push(LETTERS[Math.floor(LETTERS.length*Math.random())])
    }

    return parts.join('')
}

// this is our game store, I guess
// nodes has global interpreter lock like python, so it will be safe for threads
export const gameStore = {
    lobby_closed: false,
    players: new Map<string, Player>()
}
