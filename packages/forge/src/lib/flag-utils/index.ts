import { FLAG_TYPE } from '@magicborn/shared/types/constants';
import type { FlagType } from '@magicborn/forge/types/flags';
import { BookOpen, Trophy, Package, TrendingUp, Crown, Globe, MessageSquare } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Consolidated flag utilities
 * 
 * Centralizes flag-related logic that was previously scattered across:
 * - flag-styles.ts (getFlagColorClass)
 * - FlagSelector.tsx (getFlagColorClasses, getFlagIcon)
 * - Individual node components (flag rendering logic)
 */

// Icon mapping for flag types
export const FLAG_ICONS: Record<FlagType, LucideIcon> = {
  [FLAG_TYPE.DIALOGUE]: MessageSquare,
  [FLAG_TYPE.QUEST]: BookOpen,
  [FLAG_TYPE.ACHIEVEMENT]: Trophy,
  [FLAG_TYPE.ITEM]: Package,
  [FLAG_TYPE.STAT]: TrendingUp,
  [FLAG_TYPE.TITLE]: Crown,
  [FLAG_TYPE.GLOBAL]: Globe,
};

// CSS variable-based classes for graph nodes (consistent with design system)
export const FLAG_COLOR_CLASSES: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'bg-[var(--color-df-flag-dialogue-bg)] text-[var(--color-df-flag-dialogue)] border-[var(--color-df-flag-dialogue)]',
  [FLAG_TYPE.QUEST]: 'bg-[var(--color-df-flag-quest-bg)] text-[var(--color-df-flag-quest)] border-[var(--color-df-flag-quest)]',
  [FLAG_TYPE.ACHIEVEMENT]: 'bg-[var(--color-df-flag-achievement-bg)] text-[var(--color-df-flag-achievement)] border-[var(--color-df-flag-achievement)]',
  [FLAG_TYPE.ITEM]: 'bg-[var(--color-df-flag-item-bg)] text-[var(--color-df-flag-item)] border-[var(--color-df-flag-item)]',
  [FLAG_TYPE.STAT]: 'bg-[var(--color-df-flag-stat-bg)] text-[var(--color-df-flag-stat)] border-[var(--color-df-flag-stat)]',
  [FLAG_TYPE.TITLE]: 'bg-[var(--color-df-flag-title-bg)] text-[var(--color-df-flag-title)] border-[var(--color-df-flag-title)]',
  [FLAG_TYPE.GLOBAL]: 'bg-[var(--color-df-flag-global-bg)] text-[var(--color-df-flag-global)] border-[var(--color-df-flag-global)]',
};

// Tailwind classes for selectors (legacy, but needed for FlagSelector)
export const FLAG_TAILWIND_CLASSES: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'bg-df-control-bg text-df-text-secondary border-df-control-border',
  [FLAG_TYPE.QUEST]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [FLAG_TYPE.ACHIEVEMENT]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [FLAG_TYPE.ITEM]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [FLAG_TYPE.STAT]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [FLAG_TYPE.TITLE]: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  [FLAG_TYPE.GLOBAL]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

/**
 * Get flag color CSS classes for a flag type using CSS variables
 * @param flagType - The flag type (string or FlagType)
 * @returns CSS class string for the flag type
 */
export function getFlagColorClass(flagType: string | FlagType): string {
  // Handle both string and FlagType enum values
  const normalizedType = flagType.toLowerCase() as FlagType;
  return FLAG_COLOR_CLASSES[normalizedType] || FLAG_COLOR_CLASSES[FLAG_TYPE.DIALOGUE];
}

/**
 * Get flag color CSS classes for a flag type using Tailwind classes
 * @param flagType - The flag type (string or FlagType)
 * @returns CSS class string for the flag type
 */
export function getFlagTailwindClass(flagType: string | FlagType): string {
  // Handle both string and FlagType enum values
  const normalizedType = flagType.toLowerCase() as FlagType;
  return FLAG_TAILWIND_CLASSES[normalizedType] || FLAG_TAILWIND_CLASSES[FLAG_TYPE.DIALOGUE];
}

/**
 * Get icon component for a flag type
 * @param flagType - The flag type (string or FlagType)
 * @returns Lucide icon component
 */
export function getFlagIcon(flagType: string | FlagType): LucideIcon {
  // Handle both string and FlagType enum values
  const normalizedType = flagType.toLowerCase() as FlagType;
  return FLAG_ICONS[normalizedType] || FLAG_ICONS[FLAG_TYPE.DIALOGUE];
}

/**
 * Get flag display character (single character for small indicators)
 * @param flagType - The flag type (string or FlagType)
 * @returns Single character representing the flag type
 */
export function getFlagDisplayChar(flagType: string | FlagType): string {
  const normalizedType = flagType.toLowerCase() as FlagType;
  return normalizedType === FLAG_TYPE.DIALOGUE ? 't' : normalizedType[0];
}

/**
 * Get flag indicator props for rendering
 * @param flagId - The flag ID
 * @param flagSchema - The flag schema containing flag definitions
 * @param className - Additional CSS classes
 * @returns Props object for rendering or null if flag not found
 */
export function getFlagIndicatorProps(
  flagId: string,
  flagSchema?: { flags: Array<{ id: string; name: string; type: FlagType }> },
  className: string = 'text-[8px] px-1 py-0.5 rounded-full border'
) {
  const flag = flagSchema?.flags.find(f => f.id === flagId);
  if (!flag) return null;

  const flagType = flag.type || FLAG_TYPE.DIALOGUE;
  const colorClass = getFlagColorClass(flagType);
  const displayChar = getFlagDisplayChar(flagType);

  return {
    key: flagId,
    className: `${className} ${colorClass}`,
    title: flag.name || flagId,
    children: displayChar,
  };
}