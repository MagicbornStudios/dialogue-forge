import { GameFlagState } from '../types/game-state';
import { FlagSchema, FlagDefinition } from '../types/flags';
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '../types/constants';

/**
 * Initialize game flags from schema with default values
 */
export function initializeFlags(schema: FlagSchema): GameFlagState {
  const flags: GameFlagState = {};
  
  schema.flags.forEach(flag => {
    if (flag.defaultValue !== undefined) {
      flags[flag.id] = flag.defaultValue;
    } else if (flag.valueType === 'number') {
      flags[flag.id] = 0;
    } else if (flag.valueType === 'string') {
      flags[flag.id] = '';
    } else {
      flags[flag.id] = false;
    }
  });
  
  return flags;
}

/**
 * Merge current flags with updates from dialogue
 */
export function mergeFlagUpdates(
  currentFlags: GameFlagState,
  updates: string[],
  schema?: FlagSchema
): GameFlagState {
  const newFlags = { ...currentFlags };
  
  updates.forEach(flagId => {
    const flagDef = schema?.flags.find(f => f.id === flagId);
    
    if (flagDef) {
      // Use default value or increment if number
      if (flagDef.valueType === 'number' && typeof newFlags[flagId] === 'number') {
        newFlags[flagId] = (newFlags[flagId] as number) + 1;
      } else if (flagDef.valueType === FLAG_VALUE_TYPE.STRING) {
        // For string flags, use smart defaults based on type
        if (flagDef.type === FLAG_TYPE.QUEST) {
          // Quest flags: if not set, mark as "started", otherwise keep current value
          newFlags[flagId] = newFlags[flagId] || 'started';
        } else {
          // Other string flags: use default or empty string
          newFlags[flagId] = flagDef.defaultValue !== undefined ? flagDef.defaultValue : '';
        }
      } else if (flagDef.defaultValue !== undefined) {
        newFlags[flagId] = flagDef.defaultValue;
      } else {
        newFlags[flagId] = true;
      }
    } else {
      // Default to true if not in schema
      newFlags[flagId] = true;
    }
  });
  
  return newFlags;
}

/**
 * Validate flags against schema
 */
export function validateFlags(flags: GameFlagState, schema: FlagSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  Object.keys(flags).forEach(flagId => {
    const flagDef = schema.flags.find(f => f.id === flagId);
    if (!flagDef) {
      errors.push(`Unknown flag: ${flagId}`);
    } else if (flagDef.valueType) {
      const value = flags[flagId];
      if (flagDef.valueType === FLAG_VALUE_TYPE.NUMBER && typeof value !== 'number') {
        errors.push(`Flag ${flagId} should be a number, got ${typeof value}`);
      } else if (flagDef.valueType === FLAG_VALUE_TYPE.STRING && typeof value !== 'string') {
        errors.push(`Flag ${flagId} should be a string, got ${typeof value}`);
      } else if (flagDef.valueType === FLAG_VALUE_TYPE.BOOLEAN && typeof value !== 'boolean') {
        errors.push(`Flag ${flagId} should be a boolean, got ${typeof value}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get flag value with type safety
 */
export function getFlagValue(
  flags: GameFlagState,
  flagId: string,
  defaultValue?: boolean | number | string
): boolean | number | string {
  return flags[flagId] ?? defaultValue ?? false;
}

