/**
 * DOM event type constants
 */
export const DOM_EVENT_TYPE = {
    DBL_CLICK: 'dblclick',
    MOUSE_DOWN: 'mousedown',
    MOUSE_MOVE: 'mousemove',
    TOUCH_MOVE: 'touchmove',
    MOUSE_UP: 'mouseup',
    CLICK: 'click',
    KEY_DOWN: 'keydown',
    KEY_UP: 'keyup',
    BLUR: 'blur',
    FOCUS: 'focus',
    SELECT: 'select',
    CHANGE: 'change',
  } as const;
  
  export type DomEventType = typeof DOM_EVENT_TYPE[keyof typeof DOM_EVENT_TYPE];
  
  /**
   * Keyboard key constants
   */
  export const KEYBOARD_KEY = {
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    TAB: 'Tab',
    ARROW_DOWN: 'ArrowDown',
    ARROW_UP: 'ArrowUp',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
  } as const;
  
export type KeyboardKey = typeof KEYBOARD_KEY[keyof typeof KEYBOARD_KEY];

export * from './bindings';
export * from './export-registry';
export * from './constants';
export * from './forge-graph';
export * from './forge-game-state';
export * from './characters';
export * from './draft';
export * from './narrative';
export * from './page-contract-v2';
export * from './composition';
export * from './runtime';
