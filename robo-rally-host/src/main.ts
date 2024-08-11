import { app, BrowserWindow, ipcMain, MessageChannelMain, utilityProcess } from 'electron';
import * as path from 'path';
import { networkInterfaces } from 'node:os'
import { existsSync } from 'fs';
import { connectRobot } from './main/bluetooth';
import fork from 'child_process'
import { listBoards } from './main/game_server/board_loader';

// import { start } from './server/server'

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
    },

  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // register ipc listeners
  ipcMain.on('ble-connect', (event: Electron.IpcMainEvent, name: string) => {
    connectRobot(name)
  })

  ipcMain.handle('get-ip', (): string|undefined => {
    return networkInterfaces()['en0']?.filter(el => el.family === 'IPv4')[0].address
  })

  ipcMain.handle('boards:list-boards', listBoards)

  ipcMain.on('boards:load-board', (event: Electron.IpcMainEvent, name: string): void => {
    console.log(`loading ${name}`)
  })

  ipcMain.on('boards:load-serial', (event: Electron.IpcMainEvent): void => {
    console.log('loading board from serial port')
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// initialize game server (incl board)
// begin robot connections

// listen and serve
// const proc = utilityProcess.fork(path.join(__dirname, 'server.ts'), [], {})

// const { port1, port2 } = new MessageChannelMain()

const modulePath = path.join(__dirname, './server.js')
if (!existsSync(modulePath)) {
  throw new Error("Module path doesn't exist")
}
console.log(modulePath)
console.log('starting utility process')

// const child = utilityProcess.fork(modulePath, [], {
//   stdio: ['ignore', 'pipe', 'pipe'],
//   serviceName: 'HttpServer'
// })

const child = fork.fork(modulePath, [], {
  stdio: 'pipe'
})

// const child = fork(modulePath, [], {
//   stdio: ['pipe'],
// })
console.log('started')

// child.postMessage({message: 'honlo'}, [port1])

/**
 * 
 */