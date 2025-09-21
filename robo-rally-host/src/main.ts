import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import * as path from 'path';
import { networkInterfaces } from 'node:os'
import { existsSync } from 'fs';
import fork from 'child_process'
import { listBoards, loadFromJson } from './main/game_manager/board_loader';
import * as url from 'node:url'
import { Board, type BoardData } from './main/game_manager/board';
import { Main2Render, Main2Server, Render2Main, Server2Main } from './shared/models/events';
import { PlayerStatusUpdate, senderMaker, type Main2ServerMessage, type PlayerUpdate, type ProgrammingData, type S2MAddPlayerMessage, type S2MProgramSetMessage, type S2MSelectBotMessage, type Sender, type Server2MainMessage } from './shared/models/connection';
import { BluetoothBotInitializer, BluetoothManager } from './main/bluetooth';
import { GameStateManager, type Notifier } from './main/game_manager/game_state';
import { GameInitializer, type BotInitializer } from './main/game_manager/initializers';
import type { PlayerID, Player, CharacterID } from './shared/models/player';
import { BoardElement, GamePhase, newRegisterArray, ProgrammingCard, type GameAction } from './shared/models/game_data';
import { BOTS_MAP } from './shared/data/robots';

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

const child = fork.fork(modulePath, [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
})

const M2SSend = senderMaker<Main2ServerMessage>(child)

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
            webSecurity: false, // TODO: turn off in production
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
    ipcMain.handle(Render2Main.BLE_CONNECT, async (_: Electron.IpcMainInvokeEvent, id: CharacterID): Promise<boolean> => {
        // BluetoothManager.getInstance().connectRobot(name)
        console.log(`plz connect the robot called ${name}`)

        const character = BOTS_MAP.get(id)
        
        if (character !== undefined) {
            return await BluetoothManager.getInstance().connectRobot(character)
        }
        return false
    })

    ipcMain.on(Render2Main.GET_BOT_STATUS, (_: Electron.IpcMainEvent) => {
        console.log("Figure out how to get bluetooth connection statuses")
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
        M2SSend({name: Main2Server.RESET})
        // create a new game object
        game = undefined
        game_initializer = new GameInitializer()
    })

    ipcMain.handle(Render2Main.START_GAME, async () => {
        // make sure that we are actually allowed to start the game
        if (!game_initializer.ready()) {
            console.error("Tried to start game when initializer was not ready")
            return false
        }

        // notify the server that we are starting
        M2SSend({
            name: Main2Server.UPDATE_PHASE,
            data: GamePhase.Setup
        })

        // create the character initializer and initialize it
        character_initializer = new BluetoothBotInitializer(
            game_initializer.getBoard(),
            Array.from(game_initializer.getPlayers().values())
        )

        await character_initializer.setup()

        const player = character_initializer.nextPlayer()
        if (player === undefined) {
            console.error("failed to get first player")
            return false
        }
        M2SSend({
            name: Main2Server.REQUEST_POSITION,
            id: player
        })
        sendToAllWindows(Main2Render.GET_INFO_NOTIFICATION, player)

        return true
    })

    ipcMain.handle(Render2Main.GET_BOT_STATUS, () => {
        return BluetoothManager.getInstance().getConnectionStatuses()
    })

    ipcMain.handle(Render2Main.REMOVE_PLAYER, (_: Electron.IpcMainInvokeEvent, player_id: PlayerID): boolean => {
        try {
            console.log(`requested to remove player: ${player_id}`)
            game_initializer.removePlayer(player_id)
            M2SSend({
                name: Main2Server.REMOVE_PLAYER,
                id: player_id
            })
        } catch (err) {
            console.error("failed to remove player", err)
            return false
        }
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
    private m2s_sender: Sender<Main2ServerMessage>
    private render_sender: <T>(channel: Main2Render, data: T) => void

    constructor(m2s_sender: Sender<Main2ServerMessage>, render_sender: <T>(channel: Main2Render, data: T) => void) {
        this.m2s_sender = m2s_sender
        this.render_sender = render_sender
    }

    gameAction(action: GameAction): void {
        // tell the server to send the game action notification
        this.m2s_sender({
            name: Main2Server.GAME_ACTION,
            data: action
        })
        // send to the render as well
        this.render_sender<GameAction>(Main2Render.GAME_ACTION, action)
    }

    getInput(player: PlayerID, request: ProgrammingCard.ActionChoiceData): void {
        // send the full request to the server to be forwarded to the player
        this.m2s_sender({
            name: Main2Server.GET_INPUT,
            id: player,
            data: request
        })

        // send a short notification to the renderer that input is required
        this.render_sender<PlayerID>(Main2Render.GET_INFO_NOTIFICATION, player)
    }

    beginActivation(): void {
        // notify the players and the renderer that activation is beginning
        this.render_sender(Main2Render.UPDATE_PHASE, GamePhase.Activation)
        this.m2s_sender({
            name: Main2Server.UPDATE_PHASE,
            data: GamePhase.Activation
        })
    }

    updateRegister(register: number) {
        this.m2s_sender({
            name: Main2Server.UPDATE_REGISTER,
            data: register
        })
        this.render_sender<number>(Main2Render.UPDATE_REGISTER, register)
    }

    updateBoardElement(element: BoardElement) {
        this.m2s_sender({
            name: Main2Server.UPDATE_BOARD_ELEMENT,
            data: element
        })
        this.render_sender(Main2Render.UPDATE_BOARD_ELEMENT, element)
    }
}

/**
 * perform all the updates related to starting a new round
 */
function startNewRound() {
    if (game === undefined) {
        console.error("starting round when game is undefined")
        return
    }
    const states = game.getPlayerStates()
    // get the player data and broadcast it
    M2SSend({
        name: Main2Server.UPDATE_PLAYER_STATES,
        data: states
    })
    
    // go to the upgrade phase
    M2SSend({
        name: Main2Server.UPDATE_PHASE,
        data: GamePhase.Upgrade
    })
    sendToAllWindows<GamePhase>(Main2Render.UPDATE_PHASE, GamePhase.Upgrade)
    // from here, players should be able to advance to programming on their own
    // once all programs are submitted, the game state will fire independently

    // send them their new hands so that everything is ready
    const next_registers = game.resetPrograms()
    const next_hands = game.getNextHands()

    // zip the hands and registers
    const programming_data = new Map<PlayerID, ProgrammingData>()
    for (const [player_id, next_hand] of next_hands.entries()) {
        const next_register = next_registers.get(player_id)

        programming_data.set(player_id, {
            hand: next_hand,
            new_registers: next_register === undefined ? newRegisterArray() : next_register
        })
    }

    M2SSend({
        name: Main2Server.PROGRAMMING_DATA,
        data: programming_data
    })
}

// initialize game server (incl board)
// begin robot connections
child.on('message', (message: Server2MainMessage) => {
    switch (message.name) {
        case Server2Main.PROGRAM_SET:
            const program_set_msg = message as S2MProgramSetMessage
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
                const did_run = game.setProgram(program_set_msg.id, program_set_msg.data.registers)

                if (did_run) {
                    // check the end condition
                    const winner = game.gameOver()
                    if (winner != undefined) {
                        // then the game is over and a winner has been declared
                        // notify the clients
                        M2SSend({
                            name: Main2Server.GAME_OVER,
                            data: winner
                        })
                        // notify the console
                        sendToAllWindows<Player>(Main2Render.GAME_OVER,  winner)
                    } else {
                        // the game goes on: invoke another round
                        startNewRound()
                    }
                }
            } catch (error) {
                console.log(error)
            }
            break
        case Server2Main.ADD_PLAYER:
            console.log("Recv'd add-player command:", message)
            const add_player_msg = message as S2MAddPlayerMessage
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
            const select_bot_msg = message as S2MSelectBotMessage
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
                M2SSend({
                    name: Main2Server.REQUEST_POSITION,
                    id: next
                })
                sendToAllWindows(Main2Render.GET_INFO_NOTIFICATION, next)
                return
            }

            // all characters are ready, tell the initializer we're done
            character_initializer.finished().catch((reason) => console.warn(reason))

            // if it's undefined, then we should be ready to start the game
            game = new GameStateManager(game_initializer,
                character_initializer,
                BluetoothManager.getInstance(),
                new ServerRenderNotifier(M2SSend, sendToAllWindows)
            )

            // TODO issue 3 upgrade cards to each player
            
            startNewRound()
            break
    }
})

// add a listener to the server's std streams
child.stdout?.setEncoding('utf8')
child.stdout?.on('data', (data: any) => console.log("[server]:", data))
child.stderr?.setEncoding('utf8')
child.stderr?.on('data', (data: any) => console.log("[server]:", data))

console.log('started')
