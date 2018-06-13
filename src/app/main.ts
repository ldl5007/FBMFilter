import { app, BrowserWindow, dialog } from 'electron';
import { AppEvent, ElectronMain, IPCEvent } from '../helpers/electron-app';

@ElectronMain
class Main {
  public mainWindow: Electron.BrowserWindow;
  public secondWindow: Electron.BrowserWindow;

  /**
   * This function creates a window and loads index.html
   */
  private createWindow() {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({width: 800, height: 600});

    this.mainWindow.setMenuBarVisibility(false);

    let url = require('url').format({
      protocol: 'file',
      slashes : true,
      pathname: require('path').join(__dirname, 'base-window/index.html')
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
  }

  @AppEvent('window-all-closed')
  private onWindowAllClosed() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  @IPCEvent('open-second-window')
  private openSecondWindow() {
    console.log('woo hoo we got the message');

    console.log(dialog.showOpenDialog({properties: ['openFile']}));
  //
  //   if (this.secondWindow) {
  //     this.secondWindow.show();
  //   } else {
  //     // Create the browser window.
  //     this.secondWindow = new BrowserWindow({width: 800, height: 600});
  //
  //     this.secondWindow.setMenuBarVisibility(false);
  //
  //     let url = require('url').format({
  //       protocol: 'file',
  //       slashes : true,
  //       pathname: require('path').join(__dirname, 'second-window/index.html')
  //     });
  //
  //     console.log(`loading file: ${url}`);
  //
  //     // and load the index.html of the app.
  //     this.secondWindow.loadURL(url);
  //
  //     // Open the DevTools.
  //     this.secondWindow.webContents.openDevTools();
  //
  //     // Emitted when the window is closed.
  //     this.secondWindow.on('closed', () => {
  //       // Dereference the window object, usually you would store windows
  //       // in an array if your app supports multi windows, this is the time
  //       // when you should delete the corresponding element.
  //       this.secondWindow = null;
  //     });
  //   }
  }
}

new Main();