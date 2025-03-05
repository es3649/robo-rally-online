import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import * as path from 'path';
import { networkInterfaces } from 'node:os'
import { existsSync } from 'fs';
import fork from 'child_process'
import { listBoards, loadFromJson } from './main/game_manager/board_loader';
import * as url from 'node:url'
import { Board, type BoardData } from './main/game_manager/board';
import { Main2Render, Main2Server, Render2Main, Server2Main } from './main/models/events';
import { PlayerStatusUpdate, senderMaker, type PlayerUpdate, type Server2MainMessage } from './main/models/connection';
import { BluetoothBotInitializer, BluetoothManager } from './main/bluetooth';
import { GameStateManager } from './main/game_manager/game_state';
import { GameInitializer, type BotInitializer } from './main/game_manager/initializers';
import type { PlayerID } from './main/models/player';
import { GamePhase } from './main/models/game_data';

// TODO we might consider moving this functionality to a separate class
const windows = new Map<number, BrowserWindow>()

function sendToAllWindows(channel: Main2Render, ...args: any[]) {
    for (const browser_window of windows.values()) {
        browser_window.webContents.send(channel, ...args)
    }
}

// create the game manager
// this game manager will manage the state of the game through the life of the program
let game: GameStateManager|undefined
let game_initializer = new GameInitializer()
let character_initializer: BotInitializer

// listen and serve
const modulePath = path.join(__dirname, './server.js')
if (!existsSync(modulePath)) {
    throw new Error("Module path doesn't exist")
}

console.log(modulePath)
console.log('starting utility process')

// const child = utilityProcess.fork(modulePath, [], {
  // stdio: 'pipe',
//   serviceName: 'HttpServer'
// })

const child = fork.fork(modulePath, [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = (): BrowserWindow => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
        width: 1024,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        },

    });

    // save this window so we can perform event handling correctly later
    windows.set(mainWindow.id, mainWindow)

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    return mainWindow
};

/**
 * register the ICP listeners. This is where calls from the renderer will come in
 */
function registerIPCListeners() {
    ipcMain.on(Render2Main.BLE_CONNECT, (event: Electron.IpcMainEvent, name: string) => {
        // BluetoothManager.getInstance().connectRobot(name)
    })

    ipcMain.handle(Render2Main.GET_IP, (): string|undefined => {
        return networkInterfaces()['en0']?.filter(el => el.family === 'IPv4')[0].address
    })

    ipcMain.handle(Render2Main.BOARD.LIST_BOARDS, listBoards)

    ipcMain.handle(Render2Main.BOARD.LOAD_BOARD, async (_: Electron.IpcMainInvokeEvent, name: string): Promise<BoardData|undefined> => {
        console.log(`loading ${name}`)
        // load the board
        try {
            const board_data = await loadFromJson(name)
            // load it into the game manager
            
            // create the board
            const board = new Board(board_data)
            game_initializer.board = board
            // return it to the caller
            return board_data
        } catch (error) {
            console.error("Failed to load the requested board", error)
            return 
        }
    })

    ipcMain.handle(Render2Main.GET_READY_STATUS, (): Map<PlayerID, string[]> => {
        return game_initializer.todo()
    })

    ipcMain.on(Render2Main.RESET, () => {
        // tell the server to reset
        child.send(Main2Server.RESET)
        // create a new game object
        game = undefined
        game_initializer = new GameInitializer()
    })

    ipcMain.handle(Render2Main.START_GAME, () => {
        // make sure that we are actually allowed to start the game
        if (!game_initializer.ready()) {
            console.error("Tried to start game when initializer was not ready")
            return false
        }
        // notify the server that we are starting
        child.emit(Main2Server.PHASE_UPDATE, {phase: GamePhase.Setup})

        // create the character initializer and initialize it
        character_initializer = new BluetoothBotInitializer(
            game_initializer.getBoard(),
            Array.from(game_initializer.getPlayers().values())
        )

        const player = character_initializer.nextPlayer()
        if (player === undefined) {
            console.error("failed to get first player")
            return false
        }
        child.emit(Main2Server.REQUEST_POSITION, player)

        return true
    })
    
    // ipcMain.on(Render2Main.BOARD.LOAD_SERIAL, (_: Electron.IpcMainEvent): void => {
    //     console.log('loading board from serial port')
    //     console.warn('NOT IMPLEMENTED')
    // })
    // ipcMain.on(Render2Main.BOARD.ROTATE)
    // ipcMain.handle(Render2Main.BOARD.EXTEND)
    // ipcMain.on(Render2Main.BOARD.READY)
    // ipcMain.on(Render2Main.BOARD.TOGGLE_CHECKPOINT)
    // ipcMain.on(Render2Main.BOARD.TOGGLE_RESPAWN)
    // ipcMain.on(Render2Main.BOARD.ROTATE_RESPAWN)

}

/**
 * define all protocols we want to use. These are the blah:// parts of URLs
 */
function defineProtocols() {
    // from documentation example:
    // https://www.electronjs.org/docs/latest/api/protocol#protocolregisterfileprotocolscheme-handler-completion
    protocol.handle('res', (request: GlobalRequest): Response|Promise<Response> => {
        // slice off the protocol
        const filepath = request.url.slice('res://'.length)
        const modified = url.pathToFileURL(path.join('assets', filepath)).toString()
        console.log('Protocol looking up:', modified)
        return net.fetch(modified)
    })
}

function ready() {
    registerIPCListeners()
    defineProtocols()
    createWindow()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ready);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// initialize game server (incl board)
// begin robot connections
child.on('message', (message: Server2MainMessage<any>) => {
    switch (message.name) {
        case Server2Main.PROGRAM_SET:
            if (game === undefined) {
                console.error("tried to set program before game was ready")
                break
            }
            try {
                game.setProgram(message.data.id, message.data.program)
            } catch (error) {
                console.log(error)
            }
            break
        case Server2Main.PROGRAM_SHUTDOWN:
            if (game === undefined) {
                console.error("tried to set shutdown before game was ready")
                break
            }
            try {
                game.setShutdown(message.data.id)
            } catch (error) {
                console.log(error)
            }
            break
        case Server2Main.ADD_PLAYER:
            console.log("Recv'd add-player command:", message)
            if (message.id === undefined) {
                console.error("Failed to add player when ID was not provided")
                break
            }
            if (game === undefined) {
                try {
                    // add the player to the player initializer
                    const ok = game_initializer.addPlayer(message.data, message.id)
                    if (!ok) {
                        console.error("Failed to add player in main which was added in server!")
                        return
                    }

                    // update the windows with the player
                    sendToAllWindows(Main2Render.UPDATE_PLAYER, {
                        id: message.id,
                        name: message.data,
                        status: PlayerStatusUpdate.ADDED
                    })
                    
                    // send a ready status to the renderer
                    sendToAllWindows(Main2Render.READY_STATUS, game_initializer.todo())
                } catch (error) {
                    console.log(error)
                }
                break
            }
            console.error('tried to add player after game was started')
            break
        case Server2Main.SELECT_BOT:
            if (message.id === undefined) {
                console.error("Failed to select character when ID was not provided")
                break
            }
            console.log()
            if (game === undefined) {
                try {
                    game_initializer.setCharacter(message.id, message.data)
                    sendToAllWindows(Main2Render.UPDATE_PLAYER, {
                        id: message.id,
                        character: message.data
                    } as PlayerUpdate)
                    // send a ready status to the renderer
                    sendToAllWindows(Main2Render.READY_STATUS, game_initializer.todo())
                } catch (error) {
                    console.error(error)
                }
                break
            }
            console.error('tried to select bot after game was started')
            break
        case Server2Main.CONFIRM_POSITION:
            // TODO make sure this is the correct sender
            // the player has confirmed their position
            character_initializer.readPlayerPosition()
            const next = character_initializer.nextPlayer()
            if (next !== undefined) {
                child.emit(Main2Server.REQUEST_POSITION, next)
                return
            }

            // if it's undefined, then we should be ready to start the game
            game = new GameStateManager(game_initializer,
                character_initializer,
                BluetoothManager.getInstance(),
                senderMaker<Main2Server>(child))
            
            // go to the upgrade phase
            child.emit(Main2Server.PHASE_UPDATE, GamePhase.Upgrade)
            // from here, players should be able to advance to programming on their own
            // once all programs are submitted, the game state will fire independently
    }
})

// add a listener to the server's std streams
child.stdout?.setEncoding('utf8')
child.stdout?.on('data', (data: any) => console.log("[server]:", data))
child.stderr?.setEncoding('utf8')
child.stderr?.on('data', (data: any) => console.log("[server]:", data))

console.log('started')
