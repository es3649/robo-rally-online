import { gameStore } from '../../stores/game_store'
import type { Player } from '../../models/player'
import { MAX_PLAYERS } from '../game_controller/game'

export function joinHandler(name: string, callback: (resp: string) => void): void {

    // Has the max player cont been exceeded?
    if (gameStore.players.size >= MAX_PLAYERS) {
        // callback can't join
        callback("Max player count reached")
        return
    }

    if (gameStore.lobby_closed) {
        // callback can't join
        callback('The lobby is closed')
        return
    }

    let player: Player|undefined = gameStore.players.get(name)
    // is the player already in the game?
    if (player != undefined) {
        // the player is in the game already
        // return their player details
        // emit player exists
        callback("Name is already taken")
        return
    }


    // create the player object
    player = {
        name: name,
    }

    gameStore.players.set(player.name, player)
    // broadcast player added

    // we good
    callback("")
}