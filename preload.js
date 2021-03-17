const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
	'api', {
		drag: (start) => {
			ipcRenderer.send('drag', start);
		},
		contextmenu: () => {
			ipcRenderer.invoke('contextmenu');
		},
		fullscreen: () => {
			ipcRenderer.invoke('fullscreen');
		}
	}
);
