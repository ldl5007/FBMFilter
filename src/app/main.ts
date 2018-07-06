import * as path from "path";
import * as childProcess from "child_process";
import * as fancyLog from "fancy-log";
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { ThreadMessage, IOperationData, OperationData } from "../app/interfaces/thread-message.interface";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let parserThread;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})
  mainWindow.setMenuBarVisibility(false);

  let url = path.join(__dirname, 'base-window', 'index.html');
  // and load the index.html of the app.
  mainWindow.loadFile(url)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  parserThread = childProcess.fork(`${__dirname}//parser.js`);
  parserThread.on('message', parserThreadMessageHandler);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('browse-button', (event) => {
  const selectedFile: string[] = dialog.showOpenDialog({ properties: ['openFile'] });
  if (selectedFile) {
    log(`Selected File: ${path.basename(selectedFile[0])}`);
    event.sender.send('set-seleted-file', selectedFile[0]);
  }
});

ipcMain.on('filter-button', (event, filterData) => {
  console.log(filterData);
  const operationData: IOperationData = new OperationData();

  // check selectedFile
  if (filterData.selectedFile === "") {
    dialog.showMessageBox({message:"Orginal message file is missing"});
    return;
  } else {
    operationData.fullPath = filterData.selectedFile;
  }

  if (filterData.filterCalls === "" && filterData.messageSummary === "") {
    dialog.showMessageBox({message:"Please select an operation"});
    return;
  }

  if (filterData.filterCalls === "on") {
    log(`Performing call filter for ${filterData.selectedFile}`);
    operationData.callFilter = true;
  }

  if (filterData.messagesSummary === "on") {
    log(`Performing message summary for ${filterData.selectedFile}`);
    operationData.messagesSummary = true;
    operationData.summaryType = filterData.summaryType;
  }

  fancyLog(JSON.stringify(operationData));

  parserThread.send(operationData);
});

ipcMain.on('open-folder', (event, data: string) => {
  let folderPath = data.replace(path.basename(data), "");

  fancyLog(`open folder: ${folderPath}`);
  childProcess.exec(`start "" "${folderPath}"`);
});

function log(message) {
  fancyLog(message);
  mainWindow.webContents.send('log-message', message);
}

function setProgress(val?, max?) {
  let progressData: {[k: string]: any} = {};
  if (val) {
    progressData.val = val;
  }
  if (max) {
    progressData.max = max;
  }

  mainWindow.webContents.send('set-progress', progressData);
}

function parserThreadMessageHandler(threadMessage: ThreadMessage) {
  fancyLog(JSON.stringify(threadMessage));
  switch(threadMessage.type) {
    case "message":
      log(threadMessage.message);
      break;
    case "progress":
      setProgress(threadMessage.val, threadMessage.max);
      break;
    case "completed":
      log(threadMessage.message);
      mainWindow.webContents.send('operation-completed');
      break;
  }
}