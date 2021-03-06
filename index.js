const { app, protocol, ipcMain, Menu, BrowserWindow } = require('electron');
const Store = require('electron-store');
const command_exists = require('command-exists').sync;
const child_process = require('child_process');
const path = require('path');
const url = require('url');

const config = new Store({
	channel: { type: 'string' },
	bounds: {
		x: { type: 'integer' },
		y: { type: 'integer' },
		width: { type: 'integer' },
		height: { type: 'integer' },
	}
});

const ffmpegPath = command_exists('ffmpeg') ? 'ffmpeg' : require('ffmpeg-static');

protocol.registerSchemesAsPrivileged([{ scheme: 'tv', privileges: { bypassCSP: true, supportFetchAPI: true } }]);
app.on('ready', () => {
	protocol.registerFileProtocol('asset', (request, callback) => {
		callback({path: path.join(__dirname, url.parse(request.url).path)});
	});

	protocol.registerStreamProtocol('tv', (request, callback) => {
		const ffmpeg = child_process.spawn(
			ffmpegPath,
			[
				'-i', 'http://10.1.10.211:8888' + url.parse(request.url).path,
				'-preset', 'faster',
				'-tune', 'zerolatency',
				'-codec:v', 'h264',
				'-codec:a', 'aac',
				'-vf', 'bwdif',
				'-flags', '+cgop+low_delay',
				'-movflags', 'empty_moov+omit_tfhd_offset+frag_keyframe+default_base_moof+isml',
				'-threads', 0,
				'-f', 'mp4',
				'pipe:1'
			],
			{
				detached: false
			}
		);
		
		ffmpeg.stderr.on('data', (data) => {
			console.log(data.toString());
		});

		ffmpeg.on('exit', (code, signal) => {
			console.log('exit', code, signal);
		});

		callback({ data: ffmpeg.stdout });
	});

	let mainWindow = new BrowserWindow({
		width: 1024,
		height: 576,
		frame: false,
		alwaysOnTop: true,
		transparent: true,
		vibrancy: 'menu',
		visualEffectState: 'active',
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mainWindow.on('close', () => {
		config.set('bounds', mainWindow.getBounds());
	});

	if (config.has('bounds')) {
		mainWindow.setBounds(config.get('bounds'));
	}

	mainWindow.setVisibleOnAllWorkspaces(true, {
		visibleOnFullScreen: true
	});
	mainWindow.setAspectRatio(16/9);
	mainWindow.loadURL("asset:///index.html#" + config.get('channel', ''));

	const menu_st = [
		{
			id: '19',
			label: '???????????????????????????',
		},
		{
			id: '21',
			label: '??????????????????????????????',
		},
		{
			id: '20',
			label: '???????????????',
		},
		{
			id: '22',
			label: '??????????????????',
		},
		{
			id: '23',
			label: 'HAB',
		},
	];

	const menu_bs = [
		{
			id: '101',
			label: 'NHK BS1',
		},
		{
			id: '103',
			label: 'NHK BS???????????????',
		},
	];

	menu_st.forEach((item) => item.click = function() {
		console.log(item);
		mainWindow.webContents.loadURL('asset:///index.html#' + item.id).then(() => {
			config.set('channel', item.id);
			console.log('loaded');
		}).catch((error) => {
			console.log(error);
		});;
	});

	menu_bs.forEach((item) => item.click = function() {
		console.log(item);
		mainWindow.webContents.loadURL('asset:///index.html#' + item.id).then(() => {
			console.log('loaded');
		}).catch((error) => {
			console.log(error);
		});;
	});

	const menu = Menu.buildFromTemplate([
		{
			label: '??????????????????',
			submenu: menu_st
		},
		{
			label: '???????????? (BS)',
			submenu: menu_bs
		},
		{
			label: '???????????? (CS)',
			submenu: [
			]
		},
		{
			type: 'separator'
		},
		{
			label: '??????(&X)',
			accelerator: 'Cmd+Q',
			click: () => {
				mainWindow.close();
			}
		}
	]);

	ipcMain.handle('contextmenu', (event) => {
		console.log('contextmenu');
		menu.popup({ window: mainWindow });
	});
	ipcMain.handle('fullscreen', (event) => {
		console.log('fullscreen');
		mainWindow.setFullScreen(!mainWindow.isFullScreen());
	});
});
