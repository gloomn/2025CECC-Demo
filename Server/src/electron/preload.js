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

    startServer: (port) => {
        ipcRenderer.invoke('start-server', port);
    },

    stopServer: () => {
        ipcRenderer.invoke('stop-server');
    },

    onHostIP: (callback) => {
        ipcRenderer.on('host-ip', (event, ip) => callback(ip))
    },

    onMemoryUsage: (callback) => {
        ipcRenderer.on('memory-usage',)
    },

    getStats: () => {
        return ipcRenderer.invoke('get-stats')
    },

    getClients: () => {
        return ipcRenderer.invoke('get-clients') // ipcRenderer.invoke는 프로미스를 반환합니다.
            .then(clients => {
                return clients; // 클라이언트 정보를 반환
            })
            .catch(err => {
                console.error('Error fetching clients:', err);
                return []; // 에러 시 빈 배열 반환
            });
    },

    startContest: () => {
        ipcRenderer.invoke('start-contest');
    },

    finishContest: () => {
        ipcRenderer.invoke('finish-contest');
    },

    removeClient: () => {
        ipcRenderer.invoke('remove-client');
    },

    clientStandby: () => {
        ipcRenderer.invoke('client-standby');
    },

    receiveLog: (callback) => {
        ipcRenderer.on('server-log', callback)
    }

}
contextBridge.exposeInMainWorld('api', WINDOW_API);