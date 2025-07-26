//© 2025 LeeKiJoon all rights reserved
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const WINDOW_API = {
    //Close window
    closeWindow: () => {
        ipcRenderer.send('close-window');
    },

    //Minimize window
    minimizeWindow: () => {
        ipcRenderer.send('minimize-window');
    },

    //Maximize/Restore window
    checkMaximizeStatus: (callback) => {
        ipcRenderer.on('isMaximized', () => {
            callback(false);
        });

        ipcRenderer.on('isRestored', () => {
            callback(true);
        });
    },

    maximizeRestoreWindow: () => {
        ipcRenderer.send('maximize-restore-window');
    },

    connectToServer: (ip, port, nickname) => {
        return ipcRenderer.invoke('connect-to-server', ip, port, nickname);
    },

    changeToStandby: () => {
        ipcRenderer.invoke('change-to-standby');
    },

    sendAnswer: (data) => {
        ipcRenderer.send('submit-answer', data);
    },

    changeToFinish: () =>
    {
        ipcRenderer.invoke('change-to-finish');
    }
}
contextBridge.exposeInMainWorld('api', WINDOW_API);