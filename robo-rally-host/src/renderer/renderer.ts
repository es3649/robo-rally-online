/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { createApp } from 'vue';
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia';
import { useGameDataStore } from './stores/render_game_data_store';
import { PlayerStatusUpdate, type PlayerUpdate } from '../shared/models/connection';
import type { Player, PlayerID } from '../shared/models/player';
import { BOTS_MAP } from '../shared/data/robots';
import type { PlayerStateData } from '../shared/models/player';
import { BoardElement, GamePhase, type GameAction } from '../shared/models/game_data';

// create and mount the Vue app
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

// add communication listeners
const r_gds = useGameDataStore()

// TODO move this logic into ConnectionsStore, and just pass the game store as an argument
window.mainEventHandlerAPI.onPlayerUpdate((update: PlayerUpdate): void => {
    console.log('update', update)
    if (update.status === PlayerStatusUpdate.ADDED) {
        if (update.name === undefined) {
            console.warn("Player to be added but name was not provided")
            return
        }
        console.log(`Adding player: ${update.name} (${update.id})`)
        r_gds.addPlayer(update.id, update.name)
    } else if (update.status === PlayerStatusUpdate.REMOVED) {
        console.log(`Removing player: ${update.name} (${update.id})`)
        r_gds.removePlayer(update.id)
    }

    if (update.character !== undefined) {
        const character = BOTS_MAP.get(update.character)
        if (character === undefined) {
            console.error(`No bot exists with ID ${update.character}`)
            return
        }
        r_gds.characterSelected(update.id, character)
    }
})

window.mainEventHandlerAPI.onToDo((to_dos: Map<PlayerID, string[]>): void => {
    console.log(to_dos)
    r_gds.setToDos(to_dos)
})

window.mainEventHandlerAPI.onPlayerDataUpdated((id: PlayerID, update: PlayerStateData) => {
    console.log(id, update)
    r_gds.setPlayerData(id, update)
})

window.mainEventHandlerAPI.onGameAction((action: GameAction) => {
    r_gds.game_events.push(action)
})

window.mainEventHandlerAPI.onGetInputNotification((player: PlayerID, timeout?: number) => {
    console.log("Received GetData event for:", player)
    r_gds.get_input.timeout = timeout ? timeout : 30
    r_gds.get_input.player = player
})

window.mainEventHandlerAPI.onUpdateGamePhase((phase: GamePhase) => {
    console.log("Received game phase:", phase)
    if (phase === GamePhase.Activation) {
        r_gds.register = 0
        r_gds.board_element = BoardElement.Players
    }
    r_gds.game_phase = phase
})

window.mainEventHandlerAPI.onUpdateRegister((register: number) => {
    console.log("Received register update", register)
    r_gds.register = register
})

window.mainEventHandlerAPI.onUpdateBoardElement((element: BoardElement) => {
    console.log("Received board element:", BoardElement.toString(element))
    r_gds.board_element = element
})

window.mainEventHandlerAPI.onGameOverNotification((winner: Player) => {
    console.log("Received Game Over")
    r_gds.winner = winner
})
