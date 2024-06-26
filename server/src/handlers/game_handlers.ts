import {Request, Response} from 'express'
import { get_all_games } from '../game_controller/game_store'

/**
 * handle GET requests to the games endpoint. This will list the existing games
 * @param req The incoming HTTP request
 * @param res The response object
 */
export function games_get_handler(req: Request, res: Response): void {
    const games = get_all_games()

    
}

/**
 * handle POST requests to the games endpoint. This should create a new game
 * @param req The incoming HTTP request
 * @param res The response object
 */
export function games_post_handler(req: Request, res: Response): void {

}

/**
 * handle DELETE requests to the games endpoint. This will delete the game
 * @param req The incoming HTTP request
 * @param res The response object
 */
export function games_delete_handler(req: Request, res: Response): void {
  
}