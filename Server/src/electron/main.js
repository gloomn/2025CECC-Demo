//© 2025 LeeKiJoon all rights reserved
'use strict';
const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron/main');
const path = require('path');
const { 
  startServer, 
  stopServer, 
  getLocalIp, 
  getStats, 
  getClientsInfoArray, 
  setMainWindow, 
  startContest, 
  finishContest, 
  removeClient, 
  clientStandby, 
  serverDown, 
  sendLogToRenderer,
  clearLogFile
} = require('../js/server/tcpServer');
let window;

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
      serverDown();
      window.close();
      clearLogFile();
    }
  });

  setMainWindow(window);

  ipcMain.handle('start-server', (event, port) => {
    startServer(port);  // 서버 시작
    const ip = getLocalIp();
    window.webContents.send('host-ip', ip);
  });

  ipcMain.handle('stop-server', () => {
    stopServer();  // 서버 종료
  });

  ipcMain.handle('start-contest', () =>
  {
    startContest();
  });

  ipcMain.handle('finish-contest', () =>
  {
    finishContest();
  });

  ipcMain.handle('remove-client', () =>
  {
    removeClient();
  });

  ipcMain.handle('client-standby', () =>
  {
    clientStandby();
  });

  ipcMain.handle('get-clients', () => {
    return getClientsInfoArray(); // 요청 시 클라이언트 목록 반환
  });

  ipcMain.handle('get-stats', () => {
    getStats()
  }
  );
  
  ipcMain.handle('server-log', (message) =>
  {
    sendLogToRenderer(message);
  })

  window.loadFile('src/html/serverIndex.html')
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