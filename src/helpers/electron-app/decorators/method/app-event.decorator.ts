import { app } from 'electron';
import 'reflect-metadata';

/**
 * This is a list of valid events that can be sent by the app object
 */
type _TYPE_AppEvent = 'ready' | 'window-all-closed' | 'activate';

/**
 * This is the format of the metadata stored on the constructor. This metadata is used by other functions later on to perform the proper
 * run execution.
 */
interface _METADATA_AppEvent {
  /**
   * This is the event name that the decorator should be applied to
   */
  eventName: _TYPE_AppEvent,

  /**
   * This is the name of the class function that should be called when the app sends the event
   */
  fcnToCall: string
}

/**
 * The key of the metadata for AppEvents on the constructor
 * @type {string}
 */
const _KEY_AppEvent = '_AppEvents';

/**
 * This decorator is used to bind a class method to an app.on(event, classMethod) function. This requires the class to be marked
 * as an @ElectronMain class.
 *
 * @param {_TYPE_AppEvent} eventName The name of the app event to bind the method to
 * @returns {(target: any, propertyKey: string, descriptor: PropertyDescriptor) => any}
 *
 * @example
 *
 * import { AppEvent, ElectronMain } from 'electron-app'
 *
 * @ElectronMain
 * class Main {
 *   //... code
 *
 *   @AppEvent('ready')
 *   onAppReady(){
 *     // Code to execute in app.on('ready') callback
 *   }
 *
 *   //... code
 * }
 */
export function AppEvent(eventName: _TYPE_AppEvent) {
  return function AppEventDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Get any event store information currently on the constructor.
    let eventKeys: _METADATA_AppEvent[] = Reflect.getMetadata(_KEY_AppEvent, target.constructor) || [];

    if (typeof descriptor.value !== 'function') {
      throw new Error('AppEvent decorator not applied to a function');
    } else {
      // Add the new method to the key
      eventKeys.push({
        eventName: eventName,
        fcnToCall: propertyKey
      });
      Reflect.defineMetadata(_KEY_AppEvent, eventKeys, target.constructor);
    }
  };
}

/**
 * This function should not be used by any external libraries as it is done automatically by the @ElectronMain decorator. This function's
 * purpose is to actually perform the bindings of each decorated method to the corresponding app event. This is done with the help of
 * typescript metadata.
 *
 * @param {T} constructor The original constructor of the class since that is where the metadata is stored. Remember that the current
 *                        constructor is part of a subclass of the original class where metadata is stored.
 *
 * @private
 */
export function _initAppEvents<T extends {new(...args:any[]):{}}>(constructor: T) {
  const appListeners: _METADATA_AppEvent[] = Reflect.getMetadata(_KEY_AppEvent, constructor) || [];

  console.log(`Initializing AppEvent handlers on class ${this}`);

  // Turn each class method on
  for (let x of appListeners) {
    console.log(`Initializing the ${x.eventName} method of a class`);
    app.on(x.eventName as any, () => {
      this[x.fcnToCall]()
    })
  }
}