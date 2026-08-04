const { app, BrowserWindow } = require('electron');
const path = require('path');

const DEV_URL = 'http://localhost:8081';
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: '하루로그',
    backgroundColor: '#FFFFFF',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    loadWithRetry(win, DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// expo web 개발 서버가 아직 뜨지 않았을 수 있으므로 잠시 후 재시도
function loadWithRetry(win, url, attempt = 0) {
  win.loadURL(url).catch(() => {
    if (attempt >= 20) return;
    setTimeout(() => loadWithRetry(win, url, attempt + 1), 1000);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
