import {Request, Response} from 'express'
import { StatusCodes as http } from 'http-status-codes'
import { join_POST_req, join_POST_res } from './api_models'
import { get_game } from '../game_controller/game_store'
import { Player } from '../game_controller/player'
import { MAX_PLAYERS } from '../game_controller/game'
import { ConnectionDetails } from '../game_controller/game_server'

export function join_post_handler(req: Request, res: Response): void {
    // validate the request body by typecasting it to the expected type
    let body: join_POST_req
    try {
        body = req.body as join_POST_req
    } catch (error) {
        res.status(http.BAD_REQUEST)
        res.send(error)
        return
    }

    // get the game
    const game = get_game(body.room_code)

    // if there isn't one, there isn't one
    if (game == undefined) {
        res.status(http.NOT_FOUND)
        return
    }

    // the game exists
    // Has the max player cont been exceeded?
    if (game.players.size >= MAX_PLAYERS) {
        res.status(http.SERVICE_UNAVAILABLE)
        res.send('Max Player count reached')
        return
    }

    let player: Player|undefined = game.players.get(body.player_name)
    // is the player already in the game?
    if (player != undefined) {
        // the player is in the game already
        // return their player details
        res.status(http.OK)
        // typecast is safe because we just determined player is not undefined
        const same_player: join_POST_res = player.conn_details as ConnectionDetails
        res.send(same_player)
    }

    // request a new connection for the player from the game server
    const conn_details: ConnectionDetails | string = game.game_server.add_player(body.player_name)

    // this is the failure type
    if (typeof conn_details == 'string') {
        // failed to create a new player
        res.status(http.BAD_GATEWAY)
        res.send(conn_details)
        return
    }

    // create the player object
    player = {
        name: body.player_name,
        conn_details: conn_details
    }

    game.players.set(player.name, player)

    //  did the player provide a valid host code and in all other respects appear to be the host
    if (body.host_key != undefined && body.host_key == game.host_code) {
        // make them host
        game.host = player
    }

    // we good
    res.status(http.CREATED)
    res.send(conn_details as join_POST_res)
}