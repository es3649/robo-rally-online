import { Request, Response } from 'express'
import { add_game, get_all_games } from '../game_controller/game_store'
import { games_POST_req, games_POST_res } from '../models/api_models'
import { StatusCodes as http } from 'http-status-codes'

/**
 * handle POST requests to the games endpoint. This should create a new game
 * @param req The incoming HTTP request
 * @param res The response object
 */
export function games_post_handler(req: Request, res: Response): void {
    // validate request structure by trying a typecast to the expected structure
    let body: games_POST_req
    try {
        // typecast
        body = req.body as games_POST_req
        console.log(body)
    } catch (error) {
        // typecast failed, sent error
        console.log("Failed to parse request body")
        res.status(http.BAD_REQUEST)
        res.send(error)
        return
    }

    // create the game
    const game = add_game(body.player_name, body.game_type)

    // check if the game was created
    if (typeof game == 'string') {
        console.log("Unable to create game")
        res.status(http.SERVICE_UNAVAILABLE)
        res.send(game)
        return
    }

    // if so, return the game details
    res.status(http.CREATED)
    const resp: games_POST_res = {
        room_code: game.room_code,
        host_code: game.host_code
    }
    res.send(resp)
    console.log("Game created")
}

/**
 * handle DELETE requests to the games endpoint. This will delete the game
 * @param req The incoming HTTP request
 * @param res The response object
 */
export function games_delete_handler(req: Request, res: Response): void {
    res.status(http.NOT_IMPLEMENTED)
    res.send()
    return
}