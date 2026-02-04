// src/components/GraphEditors/utils/flag-styles.ts
import { FLAG_TYPE } from '@magicborn/forge/types/constants';
import type { FlagType } from '@magicborn/forge/types/flags';

/**
 * Flag color CSS classes for graph editor components
 * Uses design system color tokens (df-flag-*)
 */
export const FLAG_COLOR_CLASSES: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'bg-[var(--color-df-flag-dialogue-bg)] text-[var(--color-df-flag-dialogue)] border-[var(--color-df-flag-dialogue)]',
  [FLAG_TYPE.QUEST]: 'bg-[var(--color-df-flag-quest-bg)] text-[var(--color-df-flag-quest)] border-[var(--color-df-flag-quest)]',
  [FLAG_TYPE.ACHIEVEMENT]: 'bg-[var(--color-df-flag-achievement-bg)] text-[var(--color-df-flag-achievement)] border-[var(--color-df-flag-achievement)]',
  [FLAG_TYPE.ITEM]: 'bg-[var(--color-df-flag-item-bg)] text-[var(--color-df-flag-item)] border-[var(--color-df-flag-item)]',
  [FLAG_TYPE.STAT]: 'bg-[var(--color-df-flag-stat-bg)] text-[var(--color-df-flag-stat)] border-[var(--color-df-flag-stat)]',
  [FLAG_TYPE.TITLE]: 'bg-[var(--color-df-flag-title-bg)] text-[var(--color-df-flag-title)] border-[var(--color-df-flag-title)]',
  [FLAG_TYPE.GLOBAL]: 'bg-[var(--color-df-flag-global-bg)] text-[var(--color-df-flag-global)] border-[var(--color-df-flag-global)]',
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
