import express, {Request, Response} from 'express'
import { StatusCodes as http } from 'http-status-codes'

/**
 * checks if the required keys for the request are present
 * @param body the body of the request
 * @returns are required keys for a join POST quest present
 */
function req_body_is_valid(body: any): boolean {
    const attributes: string[] = Object.keys(body)

    if (!('player_name' in attributes) ||
        !('game_code' in attributes)) {
        console.log('Missing a key')
        return false
    }

    return true
}

export function join_post_handler(req: Request, res: Response): void {
    if (!req_body_is_valid(req.body)) {
        res.status(http.BAD_REQUEST)
        res.send('BAD REQUEST: missing required keys')
    }

    // contact the lobby, or create one if a host code was provided

    // lookup games in the game store
    // request a new connection from the game server
}