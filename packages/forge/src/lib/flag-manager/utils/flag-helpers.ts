import type { FlagSchema, FlagDefinition } from '@magicborn/forge/types/flags';
import { FLAG_TYPE } from '@magicborn/forge/types/constants';
import { flagTypeLabels } from './flag-constants';

/**
 * Group flags by type
 */
export function groupFlagsByType(flags: FlagDefinition[]): Record<string, FlagDefinition[]> {
  const grouped: Record<string, FlagDefinition[]> = {
    all: flags,
  };
  
  Object.keys(flagTypeLabels).forEach(type => {
    grouped[type] = flags.filter(f => f.type === type);
  });
  
  return grouped;
}

/**
 * Get section counts for navigation
 */
export function getSectionCounts(
  flags: FlagDefinition[],
  flagsByType: Record<string, FlagDefinition[]>
): Record<string, number> {
  const counts: Record<string, number> = { all: flags.length };
  Object.keys(flagTypeLabels).forEach(type => {
    counts[type] = flagsByType[type].length;
  });
  return counts;
}

/**
 * Check if a flag is a dialogue flag (temporary)
 */
export function isDialogueFlag(flag: FlagDefinition): boolean {
  return flag.type === FLAG_TYPE.DIALOGUE;
}
