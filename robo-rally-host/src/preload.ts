// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// setup IPC (inter-process communication)
// use the BridgeContext API to make some data from the main process visible in the renderer
// https://www.electronjs.org/docs/latest/tutorial/process-model
import { contextBridge, ipcRenderer, utilityProcess } from "electron";
import { gameStore } from "./main/stores/game_store";


// load up ipc APIs
contextBridge.exposeInMainWorld('mainAPI', {
    connectRobot: (name: string): void => ipcRenderer.send('ble-connect', name),
    getIP: (): Promise<string|undefined> => ipcRenderer.invoke('get-ip'),
    listBoards: (): Promise<string[]> => ipcRenderer.invoke('boards:list-boards'),
    loadBoard: (name: string): void => ipcRenderer.send('boards:load-board'),
    loadSerial: (): void => ipcRenderer.send('boards:load-serial')
})

// if we want/need to divide the APIs later
// contextBridge.exposeInMainWorld('bleAPI', {
// })

// expose ipcRenderer tasks for: (note: icpRenderer and ipcMain are existing modules,
//     their functions (or curries of them) need to be exposed in the preloader
// - initiating a Bluetooth connection
// - starting a game
// - sending/selecting board data
// - reading game data