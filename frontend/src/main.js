const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  let win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    icon: isDev 
      ? path.join(__dirname, '../public/favicon.ico')
      : path.join(process.resourcesPath, 'app/public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false, // 延迟显示，避免白屏
    titleBarStyle: 'default'
  });

  // 加载应用
  if (!isDev) {
    // 开发环境
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
    // 生产环境 - 修复路径
    console.log('App is packaged:', app.isPackaged);
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);
    console.log('app.getAppPath():', app.getAppPath());
    
    // 使用 asar 时，build_output 目录在 app.asar 内部
    const indexPath = path.join(__dirname, '..', 'build_output', 'index.html');
    
    console.log('Final index path:', indexPath);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      console.log('Index file exists, loading...');
      win.loadFile(indexPath);
    } else {
      console.error('Index file not found at:', indexPath);
      console.log('Listing app path contents:');
      try {
        const appPath = path.dirname(__dirname);
        console.log('App path:', appPath);
        const contents = fs.readdirSync(appPath);
        console.log('Contents:', contents);
        
        // 检查是否有 build_output 目录
        if (contents.includes('build_output')) {
          const distContents = fs.readdirSync(path.join(appPath, 'build_output'));
          console.log('Build_output contents:', distContents);
        }
      } catch (e) {
        console.error('Error listing contents:', e);
      }
      
      // 显示错误页面
      win.loadURL('data:text/html,<h1>Error: Cannot find index.html</h1><p>Path: ' + indexPath + '</p>');
    }
    
    // 添加调试信息
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });
    
    win.webContents.on('dom-ready', () => {
      console.log('DOM ready');
    });
    
    // 在生产环境中也打开开发者工具用于调试
    // win.webContents.openDevTools();
  }

  // 窗口准备好后显示
  win.once('ready-to-show', () => {
    win.show();
  });

  // 优化窗口关闭行为
  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 系统通知功能
ipcMain.on('notify', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// 获取应用版本信息
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 安全：防止新窗口打开
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});
