import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import * as path from 'path';
import { networkInterfaces } from 'node:os'
import { existsSync } from 'fs';
import { connectRobot } from './main/bluetooth';
import fork from 'child_process'
import { listBoards, loadFromJson } from './main/game_manager/board_loader';
import * as url from 'node:url'
import type { Board } from './main/game_manager/board';
import { Main2Server, Render2Main, Server2Main } from './main/models/events';
import { GameManager } from './main/game_manager/manager';
import { senderMaker, type Server2MainMessage } from './main/models/connection';

// create the game manager
// this game manager will manage the state of the game through the life of the program
let game = new GameManager(senderMaker<Main2Server>(process))

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

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },

  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

/**
 * register the ICP listeners. This is where calls from the renderer will come in
 */
function registerIPCListeners() {
  ipcMain.on(Render2Main.BLE_CONNECT, (event: Electron.IpcMainEvent, name: string) => {
    connectRobot(name)
  })

  ipcMain.handle(Render2Main.GET_IP, (): string|undefined => {
    return networkInterfaces()['en0']?.filter(el => el.family === 'IPv4')[0].address
  })

  ipcMain.handle(Render2Main.BOARD.LIST_BOARDS, listBoards)

  ipcMain.handle(Render2Main.BOARD.LOAD_BOARD, (_: Electron.IpcMainInvokeEvent, name: string): Promise<Board> => {
    console.log(`loading ${name}`)
    // load the board
    const board = loadFromJson(name)
    // load it into the game manager
    board.then((board: Board) => {
      game.use_board(board)
    })
    // return it to the caller
    return board
  })

  ipcMain.on(Render2Main.BOARD.LOAD_SERIAL, (_: Electron.IpcMainEvent): void => {
    console.log('loading board from serial port')
    console.warn('NOT IMPLEMENTED')
  })

  ipcMain.on(Render2Main.RESET, () => {
    // tell the server to reset
    child.send(Main2Server.RESET)
    // create a new game object
    game = new GameManager(senderMaker<Main2Server>(process))
  })

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
      game.set_program(message.data.name, message.data.program)
      break
    case Server2Main.PROGRAM_SHUTDOWN:
      break
    case Server2Main.ADD_PLAYER:
      break
    case Server2Main.LIST_BOTS:
      break
    case Server2Main.SELECT_BOT:
      break
    case Server2Main.REQUEST_UPGRADE:
      break
    case Server2Main.ADD_UPGRADE:
      break
  }
})

console.log('started')
