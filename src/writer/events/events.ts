import type { WriterEvent, WriterEventType } from './writer-events';

export function createEvent(
  type: WriterEventType,
  payload: unknown,
  reason: string = 'USER_ACTION'
): WriterEvent {
  return {
    type,
    payload,
    reason,
  };
}
