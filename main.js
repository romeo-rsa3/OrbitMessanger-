const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, 'icon.ico'), // ✅ Add this line
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // ✅ Fixed path to index.html in root folder
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.loadFile(path.resolve(__dirname, 'index.html'));

  ipcMain.on("refresh-ui", () => {
    mainWindow.webContents.invalidate(); // Forces repaint
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
