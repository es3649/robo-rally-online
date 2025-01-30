// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// setup IPC (inter-process communication)
// use the BridgeContext API to make some data from the main process visible in the renderer
// https://www.electronjs.org/docs/latest/tutorial/process-model
import { contextBridge, ipcRenderer, utilityProcess } from "electron";
import { Board } from "./main/game_manager/board";


// load up ipc APIs
contextBridge.exposeInMainWorld('mainAPI', {
    connectRobot: (name: string): void => ipcRenderer.send('render:ble-connect', name),
    getIP: (): Promise<string|undefined> => ipcRenderer.invoke('render:get-ip'),
    listBoards: (): Promise<string[]> => ipcRenderer.invoke('render:boards:list-boards'),
    loadBoard: (name: string): Promise<Board> => ipcRenderer.invoke('render:boards:load-board', name),
    loadSerial: (): void => ipcRenderer.send('render:boards:load-serial'),

    // TODO: finish signatures
    // in the beginning, these values will be pre-determined by a hard copy board
    // rotateBoard: (id:number, direction:RotationDirection): void => ipcRenderer.send('render:boards:rotate', id, direction),
    // extendBoard: (board_name:string): Promise<Board> => ipcRenderer.invoke('render:boards:extend', board_name),
    readyBoard: (): void => ipcRenderer.send('render:boards:ready'),
    // toggleCheckpoint: (pos:BoardPosition): void => ipcRenderer.send('render:boards:toggle-checkpoint'),
    // toggleRespawn: (pos:BoardPosition): void => ipcRenderer.send('render:boards:toggle-respawn'),
    // rotateRespawn: (pos:BoardPosition): void => ipcRenderer.send('render:boards:rotate-checkpoint')
})

contextBridge.exposeInIsolatedWorld(0, 'rendererAPI', {

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