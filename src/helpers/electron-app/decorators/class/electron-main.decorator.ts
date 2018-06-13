import { _initAppEvents } from '../method/app-event.decorator';
import { initIPCEvents } from '../method/ipc-event.decorator';

/**
 * This decorator must be placed on all electron main thread classes. Enables the usage of the @AppEvent and the @IPCEvent decorators
 *
 * @param {T} constructor
 * @returns {ElectronMainClass}
 *
 * @example
 *
 * import { ElectronMain } from 'electron-app'
 *
 * @ElectronMain
 * class Main {}
 */
export function ElectronMain<T extends {new(...args:any[]):{}}>(constructor: T) {
  /**
   * This class extends the constructor of any class decorated with the electron main decorator. It is responsible for executing the helper
   * functions that have been turned on with other decorators of the super class
   */
  return class ElectronMainClass extends constructor {
    constructor(...args: any[]) {
      super();

      _initAppEvents.call(this, constructor);
      initIPCEvents.call(this, constructor);
    }

    public toString(): string {
      return (<any>constructor).name || 'UnknownMainClass';
    }
  };
}