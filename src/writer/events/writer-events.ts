export const WRITER_EVENT_TYPE = {
  CONTENT_CHANGE: 'contentChange',
  AI_EDIT: 'aiEdit',
  NAVIGATION: 'navigation',
  SAVE: 'save',
} as const;

export type WriterEventType =
  (typeof WRITER_EVENT_TYPE)[keyof typeof WRITER_EVENT_TYPE];

export type WriterEvent = {
  type: WriterEventType;
  payload: unknown;
  reason: string;
};

export interface EventSink {
  emit(event: WriterEvent): void;
}
