const { app, BrowserWindow, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 🌟 데이터를 저장할 저장소(Store) 생성
const store = new Store();

let tray = null;
let window = null;
let settingsWindow = null;

app.dock.hide();

app.whenReady().then(() => {
  // 1. 고화질 이미지를 16x16으로 압축 (해상도 깨짐 방지 & 템플릿 적용)
  const iconPath = path.join(__dirname, 'iconTemplate.png');
  const crispIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  crispIcon.setTemplateImage(true);

  tray = new Tray(crispIcon);

  // 2. 메인 투두 창 생성
  window = new BrowserWindow({
    width: 300,
    height: 400,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  window.loadFile('index.html');

  window.on('blur', () => {
    window.hide();
  });

  tray.on('click', (event, bounds) => {
    const { x, y } = bounds;
    const { width, height } = window.getBounds();

    if (window.isVisible()) {
      window.hide();
    } else {
      window.setBounds({
        x: Math.round(x - width / 2),
        y: Math.round(y + bounds.height),
        width,
        height
      });
      window.show();
    }
  });
});

// --- 🌟 설정창 및 자동 실행 IPC 통신 ---
ipcMain.on('open-settings', () => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 320,
    height: 220,
    title: '환경 설정',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  settingsWindow.loadFile('settings.html');
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
});

ipcMain.on('toggle-auto-launch', (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true
  });
});

ipcMain.on('get-auto-launch-status', (event) => {
  const settings = app.getLoginItemSettings();
  event.reply('auto-launch-status', settings.openAtLogin);
});

// --- 🌟 데이터 저장소(Store) IPC 통신 ---

// 할 일(Todo) 저장 & 불러오기
ipcMain.on('get-todos', (event) => {
  event.returnValue = store.get('todos', []); // 저장된 게 없으면 빈 배열([]) 반환
});
ipcMain.on('save-todos', (event, todos) => {
  store.set('todos', todos);
});

// 테마(다크모드/라이트모드) 저장 & 불러오기
ipcMain.on('get-theme', (event) => {
  event.returnValue = store.get('theme', 'light'); // 기본값은 'light'
});
ipcMain.on('save-theme', (event, theme) => {
  store.set('theme', theme);
});