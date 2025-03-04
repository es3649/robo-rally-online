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
import { PlayerStatusUpdate, type PlayerUpdate } from '../main/models/connection';
import type { PlayerID, PlayerStateBrief } from '../main/models/player';
import { BOTS_MAP } from '../main/data/robots';

// create and mount the Vue app
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

// add communication listeners
const game_state = useGameDataStore()

// TODO move this logic into ConnectionsStore, and just pass the game store as an argument
window.mainEventHandlerAPI.onPlayerUpdate((update: PlayerUpdate): void => {
    console.log('update', update)
    if (update.status === PlayerStatusUpdate.ADDED) {
        if (update.name === undefined) {
            console.warn("Player to be added but name was not provided")
            return
        }
        console.log(`Adding player: ${update.name} (${update.id})`)
        game_state.addPlayer(update.id, update.name)
    } else if (update.status === PlayerStatusUpdate.REMOVED) {
        console.log(`Removing player: ${update.name} (${update.id})`)
        game_state.removePlayer(update.id)
    }

    if (update.character !== undefined) {
        const character = BOTS_MAP.get(update.character)
        if (character === undefined) {
            console.error(`No bot exists with ID ${update.character}`)
            return
        }
        game_state.characterSelected(update.id, character)
    }
})

window.mainEventHandlerAPI.onToDo((to_dos: Map<PlayerID, string[]>): void => {
    console.log(to_dos)
    game_state.setToDos(to_dos)
})

window.mainEventHandlerAPI.onPlayerDataUpdated((id: PlayerID, update: PlayerStateBrief) => {
    console.log(id, update)
    game_state.setPlayerData(id, update)
})
