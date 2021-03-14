const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
	'api', {
		contextmenu: () => {
			ipcRenderer.invoke('contextmenu');
		},
		fullscreen: () => {
			ipcRenderer.invoke('fullscreen');
		}
	}
);
