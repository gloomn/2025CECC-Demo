//© 2025 LeeKiJoon all rights reserved
'use strict';
const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron/main');
const path = require('path');
let window;
const { connectToServer, setMainWindow, submitAnswer } = require('../js/client/clientConnect');

function createWindow() {
  window = new BrowserWindow
    ({
      width: 1280,
      height: 720,
      autoHideMenuBar: true,
      frame: false,
      webPreferences:
      {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../../assets/icons/win/png/icon.png'),
    });

  //Maximize/Restore window
  ipcMain.on('maximize-restore-window', () => {
    if (window.isMaximized()) {
      window.restore();
      console.log('Window restored');
    }
    else {
      window.maximize();
      console.log('Window maximized');
    }
  });

  //Send maximized status to renderer.js
  window.on('maximize', () => {
    window.webContents.send('isMaximized');
  });

  //Send unmaximized status to renderer.js
  window.on('unmaximize', () => {
    window.webContents.send('isRestored');
  });

  //Minimize window
  ipcMain.on('minimize-window', () => {
    window.minimize();
    console.log('Window minimized');
  });

  //Close window
  ipcMain.on('close-window', () => {
    if (window) {
      window.close();
    }
  });

  setMainWindow(window); // 연결 전에 mainWindow 주입

  ipcMain.handle('connect-to-server', async (event, ip, port, nickname) => {
    return connectToServer(ip, port, nickname); // 반드시 return!
  });

  ipcMain.handle('change-to-standby', (event) => {
    window.loadFile('src/html/standby.html');
  });

  ipcMain.on('submit-answer', (event, data) => {
    submitAnswer(data.problem, data.answer);
  });

  window.loadFile('src/html/clientIndex.html')
}


app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});