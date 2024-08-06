// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// setup IPC (inter-process communication)
// use the BridgeContext API to make some data from the main process visible in the renderer
// https://www.electronjs.org/docs/latest/tutorial/process-model
import { contextBridge, ipcRenderer } from "electron";
import { gameStore } from "./main/stores/game_store";


// load up ipc APIs
contextBridge.exposeInMainWorld('electronAPI', {
    connectRobot: (name: string) => ipcRenderer.send('ble-connect', name)
})

// expose ipcRenderer tasks for: (note: icpRenderer and ipcMain are existing modules,
//     their functions (or curries of them) need to be exposed in the preloader
// - initiating a Bluetooth connection
// - starting a game
// - sending/selecting board data
// - reading game data