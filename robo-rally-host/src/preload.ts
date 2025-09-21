// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// setup IPC (inter-process communication)
// use the BridgeContext API to make some data from the main process visible in the renderer
// https://www.electronjs.org/docs/latest/tutorial/process-model
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type { BoardData } from "./main/game_manager/board";
import { Main2Render, Render2Main } from "./shared/models/events";
import type { CharacterID, Player, PlayerID, PlayerStateData } from "./shared/models/player";
import type { PlayerUpdate } from "./shared/models/connection";
import { BoardElement, type GameAction, type GamePhase } from "./shared/models/game_data";

// load up ipc APIs
contextBridge.exposeInMainWorld('mainAPI', {
    connectRobot: (id: CharacterID): Promise<boolean> => ipcRenderer.invoke(Render2Main.BLE_CONNECT, name),
    getBotStatuses: (): Promise<Map<CharacterID, boolean>> => ipcRenderer.invoke(Render2Main.GET_BOT_STATUS),
    getIP: (): Promise<string|undefined> => ipcRenderer.invoke(Render2Main.GET_IP),
    listBoards: (): Promise<string[]> => ipcRenderer.invoke(Render2Main.BOARD.LIST_BOARDS),
    loadBoard: (name: string): Promise<BoardData|undefined> => ipcRenderer.invoke(Render2Main.BOARD.LOAD_BOARD, name),
    startGame: (): Promise<boolean> => ipcRenderer.invoke(Render2Main.START_GAME),
    getToDos: (): Promise<Map<PlayerID, string[]>> => ipcRenderer.invoke(Render2Main.GET_READY_STATUS),
    // loadSerial: (): void => ipcRenderer.send('render:boards:load-serial'),
    removePlayer: (player_id: PlayerID): Promise<boolean> => ipcRenderer.invoke(Render2Main.REMOVE_PLAYER, player_id),

    reset: (): void => ipcRenderer.send(Render2Main.RESET),

    // TODO: finish signatures
    // in the beginning, these values will be pre-determined by a hard copy board
    // rotateBoard: (id:number, direction:RotationDirection): void => ipcRenderer.send('render:boards:rotate', id, direction),
    // extendBoard: (board_name:string): Promise<Board> => ipcRenderer.invoke('render:boards:extend', board_name),
    // readyBoard: (): void => ipcRenderer.send('render:boards:ready'),
    // toggleCheckpoint: (pos:BoardPosition): void => ipcRenderer.send('render:boards:toggle-checkpoint'),
    // toggleRespawn: (pos:BoardPosition): void => ipcRenderer.send('render:boards:toggle-respawn'),
    // rotateRespawn: (pos:BoardPosition): void => ipcRenderer.send('render:boards:rotate-checkpoint')
})

contextBridge.exposeInMainWorld('mainEventHandlerAPI', {
    onPlayerUpdate: (callback: (update: PlayerUpdate) => void) => {
        ipcRenderer.on(Main2Render.UPDATE_PLAYER, (_event:IpcRendererEvent, update: PlayerUpdate) => {
            callback(update)
        })
    },
    onToDo: (callback: (to_dos: Map<PlayerID, string[]>) => void) => {
        ipcRenderer.on(Main2Render.READY_STATUS, (_event: IpcRendererEvent, to_dos: Map<PlayerID, string[]>) => {
            callback(to_dos)
        })
    },
    onPlayerDataUpdated: (callback: (id: PlayerID, update: PlayerStateData) => void) => {
        ipcRenderer.on(Main2Render.UPDATE_PLAYER_STATES, (_event: IpcRendererEvent, id: PlayerID, update: PlayerStateData) => {
            callback(id, update)
        })
    },
    onGameAction: (callback: (action: GameAction) => void) => {
        ipcRenderer.on(Main2Render.GAME_ACTION, (_event: IpcRendererEvent, action: GameAction) => {
            callback(action)
        })
    },
    onGetInputNotification: (callback: (player: PlayerID, timeout?: number) => void) => {
        ipcRenderer.on(Main2Render.GET_INFO_NOTIFICATION, (_event: IpcRendererEvent, id: PlayerID, timeout?: number) => {
            callback(id, timeout)
        })
    },
    onUpdateGamePhase: (callback: (phase: GamePhase) => void) => {
        ipcRenderer.on(Main2Render.UPDATE_PHASE, (_event: IpcRendererEvent, phase: GamePhase) => {
            callback(phase)
        })
    },
    onUpdateRegister: (callback: (register: number) => void) => {
        ipcRenderer.on(Main2Render.UPDATE_REGISTER, (_event: IpcRendererEvent, register: number) => {
            callback(register)
        })
    },
    onUpdateBoardElement: (callback: (element: BoardElement) => void) => {
        ipcRenderer.on(Main2Render.UPDATE_BOARD_ELEMENT, (_event: IpcRendererEvent, element: BoardElement) => {
            callback(element)
        })
    },
    onGameOverNotification: (callback: (winner: Player) => void) => {
        ipcRenderer.on(Main2Render.GAME_OVER, (_event: IpcRendererEvent, winner: Player) => {
            callback(winner)
        })
    }
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