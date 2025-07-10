const { contextBridge, ipcRenderer } = require('electron');

// 通过contextBridge安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  notify: (title, body) => {
    ipcRenderer.send('notify', { title, body });
  },
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  }
});
