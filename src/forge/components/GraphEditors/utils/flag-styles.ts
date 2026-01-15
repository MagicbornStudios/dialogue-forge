// src/components/GraphEditors/utils/flag-styles.ts
import { FLAG_TYPE } from '@/forge/types/constants';
import type { FlagType } from '@/forge/types/flags';

/**
 * Flag color CSS classes for graph editor components
 * Uses design system color tokens (df-flag-*)
 */
export const FLAG_COLOR_CLASSES: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'bg-df-flag-dialogue-bg text-df-flag-dialogue border-df-flag-dialogue',
  [FLAG_TYPE.QUEST]: 'bg-df-flag-quest-bg text-df-flag-quest border-df-flag-quest',
  [FLAG_TYPE.ACHIEVEMENT]: 'bg-df-flag-achievement-bg text-df-flag-achievement border-df-flag-achievement',
  [FLAG_TYPE.ITEM]: 'bg-df-flag-item-bg text-df-flag-item border-df-flag-item',
  [FLAG_TYPE.STAT]: 'bg-df-flag-stat-bg text-df-flag-stat border-df-flag-stat',
  [FLAG_TYPE.TITLE]: 'bg-df-flag-title-bg text-df-flag-title border-df-flag-title',
  [FLAG_TYPE.GLOBAL]: 'bg-df-flag-global-bg text-df-flag-global border-df-flag-global',
};

/**
 * Get flag color CSS classes for a flag type
 * @param flagType - The flag type (string or FlagType)
 * @returns CSS class string for the flag type
 */
export function getFlagColorClass(flagType: string | FlagType): string {
  // Handle both string and FlagType enum values
  const normalizedType = flagType.toLowerCase() as FlagType;
  return FLAG_COLOR_CLASSES[normalizedType] || FLAG_COLOR_CLASSES[FLAG_TYPE.DIALOGUE];
}
