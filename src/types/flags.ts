/**
 * Flag System for Dialogue Forge
 * 
 * Flags represent game state that can be checked and modified by dialogues.
 * Different flag types serve different purposes in the game.
 * 
 * @example
 * ```typescript
 * import { FLAG_TYPE, FlagSchema } from '@magicborn/dialogue-forge';
 * 
 * const mySchema: FlagSchema = {
 *   flags: [
 *     {
 *       id: 'quest_main',
 *       name: 'Main Quest',
 *       type: FLAG_TYPE.QUEST,
 *       category: 'quests'
 *     }
 *   ]
 * };
 * ```
 */

import { FLAG_TYPE, FLAG_VALUE_TYPE, FlagValueType } from './constants';

export type FlagType = typeof FLAG_TYPE[keyof typeof FLAG_TYPE];

export interface FlagDefinition {
  id: string;
  name: string;
  description?: string;
  type: FlagType;
  category?: string; // e.g., "main_quest", "side_quest", "items", etc.
  defaultValue?: boolean | number | string;
  valueType?: FlagValueType;
}

export interface FlagSchema {
  flags: FlagDefinition[];
  categories?: string[];
}

/**
 * Flag Reference - used in dialogue nodes
 */
export interface FlagReference {
  flagId: string;
  operator?: 'is_set' | 'is_not_set' | 'equals' | 'greater_than' | 'less_than';
  value?: boolean | number | string;
}

/**
 * Example flag schema for a game
 */
export const exampleFlagSchema: FlagSchema = {
  categories: ['quests', 'achievements', 'items', 'stats', 'titles'],
  flags: [
    // Quest flags
    { id: 'quest_dragon_slayer', name: 'Dragon Slayer Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
    { id: 'quest_dragon_slayer_complete', name: 'Dragon Slayer Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
    
    // Achievement flags
    { id: 'achievement_first_quest', name: 'First Quest', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
    { id: 'achievement_dragon_slayer', name: 'Dragon Slayer', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
    
    // Item flags
    { id: 'item_ancient_key', name: 'Ancient Key', type: FLAG_TYPE.ITEM, category: 'items' },
    { id: 'item_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    
    // Stat flags
    { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    { id: 'stat_charisma', name: 'Charisma', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
    
    // Title flags
    { id: 'title_hero', name: 'Hero', type: FLAG_TYPE.TITLE, category: 'titles' },
    
    // Dialogue flags (temporary, dialogue-scoped)
    { id: 'dialogue_met_stranger', name: 'Met Stranger', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
    { id: 'dialogue_seeks_knowledge', name: 'Seeks Knowledge', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
    { id: 'dialogue_hostile', name: 'Hostile Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
  ]
};

