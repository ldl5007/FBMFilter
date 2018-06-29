import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { AppEvent, ElectronMain, IPCEvent } from '../helpers/electron-app';
import { ThreadMessage, IOperationData, OperationData } from "../app/interfaces/thread-message.interface";

let parserThread;

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

@ElectronMain
class Main {
  public mainWindow: Electron.BrowserWindow;
  public ipcMain = ipcMain;

  /**
   * This function creates a window and loads index.html
   */
  private createWindow() {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({ width: 800, height: 600 });

    this.mainWindow.setMenuBarVisibility(false);

    let url = require('url').format({
      protocol: 'file',
      slashes: true,
      pathname: require('path').join(__dirname, 'base-window', 'index.html')
    });

    console.log(`loading file: ${url}`);

    // and load the index.html of the app.
    this.mainWindow.loadURL(url);

    // Open the DevTools.
    // this.mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    this.mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.mainWindow = null;
    });
  }

  @AppEvent('activate')
  private onActivate() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (this.mainWindow === null) {
      this.createWindow();
    }
  }

  /**
   * This method will be called when Electron has finished initialization and is ready to create browser windows.
   * Some APIs can only be used after this event occurs.
   */
  @AppEvent('ready')
  private onReady() {
    this.createWindow();

    parserThread = childProcess.fork(`${__dirname}//parser.js`);
    parserThread.on('message', parserThreadMessageHandler);
  }

  @AppEvent('window-all-closed')
  private onWindowAllClosed() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  @IPCEvent('browse-button')
  private onBrowseButton(event) {
    console.log('woo hoo we got the message');

    const selectedFile: string[] = dialog.showOpenDialog({ properties: ['openFile'] });
    if (selectedFile) {
      log(`Selected File: ${path.basename(selectedFile[0])}`);
      event.sender.send('set-seleted-file', selectedFile[0]);
    }
  }

  @IPCEvent('filter-button')
  private onFilterButton(event, filterData) {
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

    console.log(JSON.stringify(operationData));

    parserThread.send(operationData);
  }

}

function log(message) {
  console.log(message);
  main.mainWindow.webContents.send('log-message', message);
}

function setProgress(val?, max?) {
  let progressData: {[k: string]: any} = {};
  if (val) {
    progressData.val = val;
  }
  if (max) {
    progressData.max = max;
  }

  main.mainWindow.webContents.send('set-progress', progressData);
}

function parserThreadMessageHandler(threadMessage: ThreadMessage) {
  console.log(JSON.stringify(threadMessage));
  switch(threadMessage.type) {
    case "message":
      log(threadMessage.message);
      break;
    case "progress":
      setProgress(threadMessage.val, threadMessage.max);
      break;
  }
}


const main = new Main();