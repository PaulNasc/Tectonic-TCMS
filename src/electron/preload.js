const { contextBridge, ipcRenderer } = require('electron');

// Expõe funções protegidas para a janela do navegador
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
}); 