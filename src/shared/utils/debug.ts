/**
 * Debug logging utility for development
 * 
 * Usage:
 *   debugLog('Component rendered', { component: 'MyComponent' });
 *   debugLog('Store mutation', { action: 'setValue' }, 'warn');
 *   debugLog('ReactFlow', 'nodeTypes created', { nodeTypes });
 * 
 * Environment variable: NEXT_PUBLIC_DEBUG
 *   - false or not set: no logging
 *   - true: log everything
 *   - comma-separated list (e.g., 'forge,reactflow'): only log matching modules
 */

type LogLevel = 'debug' | 'warn' | 'error';

interface DebugLogOptions {
  module?: string;
  level?: LogLevel;
}

/**
 * Check if debug logging is enabled for the given module
 */
function isDebugEnabled(module?: string): boolean {
  const debugEnv = process.env.NEXT_PUBLIC_DEBUG;
  
  if (!debugEnv || debugEnv === 'false') {
    return false;
  }
  
  if (debugEnv === 'true') {
    return true;
  }
  
  // Comma-separated list of modules
  if (module) {
    const enabledModules = debugEnv.split(',').map(m => m.trim().toLowerCase());
    return enabledModules.includes(module.toLowerCase());
  }
  
  return false;
}

/**
 * Debug logging function
 * 
 * @param module - Optional module name for filtering (e.g., 'forge', 'reactflow')
 * @param message - Log message
 * @param data - Optional data to log
 * @param level - Log level (default: 'debug')
 */
export function debugLog(
  moduleOrMessage: string,
  messageOrData?: string | Record<string, any>,
  dataOrLevel?: Record<string, any> | LogLevel,
  level?: LogLevel
): void {
  // Determine which overload was used
  let module: string | undefined;
  let message: string;
  let data: Record<string, any> | undefined;
  let logLevel: LogLevel = 'debug';
  
  if (typeof messageOrData === 'string') {
    // debugLog(module, message, data?, level?)
    module = moduleOrMessage;
    message = messageOrData;
    if (dataOrLevel && typeof dataOrLevel === 'object') {
      data = dataOrLevel;
      logLevel = level || 'debug';
    } else if (dataOrLevel && typeof dataOrLevel === 'string') {
      logLevel = dataOrLevel as LogLevel;
    }
  } else {
    // debugLog(message, data?, level?)
    message = moduleOrMessage;
    if (messageOrData && typeof messageOrData === 'object') {
      data = messageOrData;
      if (dataOrLevel && typeof dataOrLevel === 'string') {
        logLevel = dataOrLevel as LogLevel;
      }
    } else if (messageOrData && typeof messageOrData === 'string') {
      logLevel = messageOrData as LogLevel;
    }
  }
  
  if (!isDebugEnabled(module)) {
    return;
  }
  
  const prefix = module ? `[${module}]` : '[DEBUG]';
  const logMessage = `${prefix} ${message}`;
  
  switch (logLevel) {
    case 'warn':
      if (data) {
        console.warn(logMessage, data);
      } else {
        console.warn(logMessage);
      }
      break;
    case 'error':
      if (data) {
        console.error(logMessage, data);
      } else {
        console.error(logMessage);
      }
      break;
    case 'debug':
    default:
      if (data) {
        console.debug(logMessage, data);
      } else {
        console.debug(logMessage);
      }
      break;
  }
}

/**
 * Log component render with performance tracking
 */
export function debugRender(
  componentName: string,
  props?: Record<string, any>
): void {
  if (!isDebugEnabled('components')) {
    return;
  }
  
  debugLog('components', `${componentName} rendered`, props || {});
}

/**
 * Log store mutation
 */
export function debugStoreMutation(
  slice: string,
  action: string,
  payload?: Record<string, any>
): void {
  if (!isDebugEnabled('store')) {
    return;
  }
  
  debugLog('store', `${slice}.${action}`, payload || {}, 'warn');
}
