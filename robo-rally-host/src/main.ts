import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import * as path from 'path';
import { networkInterfaces } from 'node:os'
import { existsSync } from 'fs';
import fork from 'child_process'
import { listBoards, loadFromJson } from './main/game_manager/board_loader';
import * as url from 'node:url'
import { Board, type BoardData } from './main/game_manager/board';
import { Main2Render, Main2Server, Render2Main, Server2Main } from './main/models/events';
import { PlayerStatusUpdate, senderMaker, type BotAvailabilityUpdate, type Main2ServerMessage, type PlayerUpdate, type Sender, type Server2MainMessage } from './main/models/connection';
import { BluetoothBotInitializer, BluetoothManager } from './main/bluetooth';
import { GameStateManager, type Notifier } from './main/game_manager/game_state';
import { GameInitializer, type BotInitializer } from './main/game_manager/initializers';
import { PlayerState, type PlayerID } from './main/models/player';
import { GamePhase, ProgrammingCard, type GameAction, type Program } from './main/models/game_data';

// TODO we might consider moving this functionality to a separate class
const windows = new Map<number, BrowserWindow>()

function sendToAllWindows<T>(channel: Main2Render, data: T) {
    for (const browser_window of windows.values()) {
        browser_window.webContents.send(channel, data)
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

const M2SSender = senderMaker<Main2Server>(process)

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
        M2SSender<never>({name: Main2Server.RESET})
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

class ServerRenderNotifier implements Notifier {
    private m2s_sender: Sender<Main2Server>
    private render_sender: <T>(channel: Main2Render, data: T) => void

    constructor(m2s_sender: Sender<Main2Server>, render_sender: <T>(channel: Main2Render, data: T) => void) {
        this.m2s_sender = m2s_sender
        this.render_sender = render_sender
    }

    gameAction(action: GameAction): void {
        // tell the server to send the game action notification
        this.m2s_sender<GameAction>({
            name: Main2Server.GAME_ACTION,
            data: action
        })
        // send to the render as well
        this.render_sender<GameAction>(Main2Render.GAME_ACTION, action)
    }

    getInput(player: PlayerID, request: ProgrammingCard.ActionChoiceData): void {
        // send the full request to the server to be forwarded to the player
        this.m2s_sender<ProgrammingCard.ActionChoiceData>({
            name: Main2Server.GET_INPUT,
            id: player,
            data: request
        })

        // send a short notification to the renderer that input is required
        this.render_sender<PlayerID>(Main2Render.GET_INFO_NOTIFICATION, player)
    }
}

// initialize game server (incl board)
// begin robot connections
child.on('message', (message: Server2MainMessage<any>) => {
    switch (message.name) {
        case Server2Main.PROGRAM_SET:
            const program_set_msg = message.data as Server2MainMessage<Program>
            if (game === undefined) {
                console.error("tried to set program before game was ready")
                break
            } else if (program_set_msg.id === undefined || program_set_msg.data === undefined) {
                console.error("malformed program, missing ID or program")
                break
            }
            try {
                // set shutdown first, as setting program may trigger activation
                if (program_set_msg.data.shutdown) {
                    game.setShutdown(program_set_msg.id)
                }
                game.setProgram(program_set_msg.id, program_set_msg.data.registers)
            } catch (error) {
                console.log(error)
            }
            break
        case Server2Main.ADD_PLAYER:
            console.log("Recv'd add-player command:", message)
            const add_player_msg = message as Server2MainMessage<string>
            if (add_player_msg.id === undefined) {
                console.error("Failed to add player when ID was not provided")
                break
            } else if (add_player_msg.data === undefined) {
                console.error("Failed to add player with empty name")
                break
            }
            if (game === undefined) {
                try {
                    // add the player to the player initializer
                    const ok = game_initializer.addPlayer(add_player_msg.data, add_player_msg.id)
                    if (!ok) {
                        console.error("Failed to add player in main which was added in server!")
                        return
                    }

                    // update the windows with the player
                    sendToAllWindows<PlayerUpdate>(Main2Render.UPDATE_PLAYER, {
                        id: add_player_msg.id,
                        name: add_player_msg.data,
                        status: PlayerStatusUpdate.ADDED
                    })
                    
                    // send a ready status to the renderer
                    sendToAllWindows<Map<PlayerID, string[]>>(Main2Render.READY_STATUS, game_initializer.todo())
                } catch (error) {
                    console.log(error)
                }
                break
            }
            console.error('tried to add player after game was started')
            break
        case Server2Main.SELECT_BOT:
            const select_bot_msg = message as Server2MainMessage<string>
            if (select_bot_msg.id === undefined) {
                console.error("Failed to select character when ID was not provided")
                break
            } else if (select_bot_msg.data === undefined) {
                console.error("Bot select notification is missing availability update")
                break
            }
            console.log()
            if (game === undefined) {
                try {
                    game_initializer.setCharacter(select_bot_msg.id, select_bot_msg.data)
                    sendToAllWindows<PlayerUpdate>(Main2Render.UPDATE_PLAYER, {
                        id: select_bot_msg.id,
                        character: select_bot_msg.data
                    })
                    // send a ready status to the renderer
                    sendToAllWindows<Map<PlayerID,string[]>>(Main2Render.READY_STATUS, game_initializer.todo())
                } catch (error) {
                    console.error(error)
                }
                break
            }
            console.error('tried to select bot after game was started')
            break
        case Server2Main.CONFIRM_POSITION:
            // const confirm_position_msg = message as Server2MainMessage<never>
            // TODO make sure this is the correct sender
            // the player has confirmed their position
            character_initializer.readPlayerPosition()
            const next = character_initializer.nextPlayer()
            if (next !== undefined) {
                M2SSender<PlayerID>({
                    name: Main2Server.REQUEST_POSITION,
                    data: next
                })
                return
            }

            // if it's undefined, then we should be ready to start the game
            game = new GameStateManager(game_initializer,
                character_initializer,
                BluetoothManager.getInstance(),
                new ServerRenderNotifier(M2SSender, sendToAllWindows))
            
            // go to the upgrade phase
            M2SSender<GamePhase>({
                name: Main2Server.PHASE_UPDATE,
                data: GamePhase.Upgrade
            })
            // from here, players should be able to advance to programming on their own
            // once all programs are submitted, the game state will fire independently

            // send over initial player data to the server
            M2SSender<Map<PlayerID, PlayerState>>({
                name: Main2Server.UPDATE_PLAYER_STATES,
                data: game.getPlayerStates()
            })
            break
    }
})

// add a listener to the server's std streams
child.stdout?.setEncoding('utf8')
child.stdout?.on('data', (data: any) => console.log("[server]:", data))
child.stderr?.setEncoding('utf8')
child.stderr?.on('data', (data: any) => console.log("[server]:", data))

console.log('started')
