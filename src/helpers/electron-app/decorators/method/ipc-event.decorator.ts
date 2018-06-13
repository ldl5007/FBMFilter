import { ipcMain } from 'electron';
import 'reflect-metadata';

/**
 * This is the format of the metadata stored by the decorator
 */
interface _METADATA_IpcEvent {
  /**
   * This is the event name to listen for in the ipcMain function
   */
  eventName: string;

  /**
   * This is the class function use as the callback
   */
  fcnToCall: string;

  /**
   * If true then the fcnToCall is bound to ipcMain.once, otherwise it is bound to ipcMain.on
   */
  isOnlyOnce: boolean;
}

/**
 * This is the key where the metadata is stored on the constructor
 * @type {string}
 * @private
 */
const _KEY_IpcEvent = '_ipcMainEvents';

/**
 * This decorator is used to bind a class method to an ipcMain event listener. This requires the class to be marked with the @ElectronMain
 * decorator.
 *
 * @param {string} eventName The name of the ipcMain event to bind the class function to
 * @param {boolean} [isOnlyOnce = false] If true, the function will only be called once.
 * @returns {(target: any, propertyKey: string, descriptor: PropertyDescriptor) => any}
 *
 * @example
 *
 * import { ElectronMain, IPCEvent } from 'electron-app'
 *
 * @ElectronMain
 * class Main {
 *   //... code
 *
 *   @IPCEvent('send-event')
 *   onSendEvent(){
 *     // Code to execute in ipcMain.on('send-event') callback
 *   }
 *
 *   @IPCEvent('send-event-once', true')
 *   onSendEventOnce(){
 *     // Code to execute in ipcMain.once('send-event-once') callback
 *   }
 *
 *   //... code
 * }
 */
export function IPCEvent(eventName: string, isOnlyOnce = false) {
  return function IPCEventDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let eventKeys: _METADATA_IpcEvent[] = Reflect.getMetadata(_KEY_IpcEvent, target.constructor) || [];

    if (typeof descriptor.value !== 'function') {
      throw new Error('AppEvent decorator not applied to a function');
    } else {
      eventKeys.push({
        eventName : eventName,
        fcnToCall : propertyKey,
        isOnlyOnce: isOnlyOnce
      });

      Reflect.defineMetadata(_KEY_IpcEvent, eventKeys, target.constructor);
    }
  };
}

/**
 * /**
 * This function should not be used by any external libraries as it is done automatically by the @ElectronMain decorator. This function's
 * purpose is to actually perform the bindings of each decorated method to the corresponding ipc event. This is done with the help of
 * typescript metadata.
 *
 * @param {T} constructor The original constructor of the class since that is where the metadata is stored. Remember that the current
 *                        constructor is part of a subclass of the original class where metadata is stored.
 *
 * @private
 */
export function initIPCEvents<T extends { new(...args: any[]): {} }>(constructor: T) {
  const ipcListeners: _METADATA_IpcEvent[] = Reflect.getMetadata(_KEY_IpcEvent, constructor) || [];

  console.log(`Initializing IPCEvent handlers on class ${this}`);

  //Initialize each IPC Event On Startup
  for (let x of ipcListeners) {
    console.log(`Initializing the ${x.fcnToCall} event to ipcMain.${x.isOnlyOnce ? 'once' : 'on'}(${x.eventName}, ${x.fcnToCall})`);
    if (x.isOnlyOnce) {
      ipcMain.once(x.eventName, this[x.fcnToCall]);
    } else {
      ipcMain.on(x.eventName, this[x.fcnToCall]);
    }
  }
}