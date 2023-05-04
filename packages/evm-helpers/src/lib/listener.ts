import { EventEmitter } from 'events';

export class MigrationListener<T extends Record<string, unknown[]>> {
  private _eventEmitter: EventEmitter = new EventEmitter();

  emit<EventName extends keyof T>(
    eventName: EventName,
    ...eventArg: T[EventName]
  ) {
    this._eventEmitter.emit(eventName.toString(), ...eventArg);
  }

  on<EventName extends keyof T>(
    eventName: EventName,
    handler: (...eventArg: T[EventName]) => void
  ) {
    this._eventEmitter.on(eventName.toString(), handler as any);
  }

  off<EventName extends keyof T>(
    eventName: EventName,
    handler: (...eventArg: T[EventName]) => void
  ) {
    this._eventEmitter.off(eventName.toString(), handler as any);
  }
}
