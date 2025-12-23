import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { importFromYarn } from '../lib/yarn-converter';
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '../types/constants';

/**
 * Example metadata - describes each example file
 */
export interface ExampleMetadata {
  id: string;
  title: string;
  description: string;
  filename: string;
  flagSchemaId: string;
  nodeCount?: number;
  features: string[]; // e.g., ['conditionals', 'variable-operations', 'quest-progression']
}

/**
 * Registry of all available examples
 * This is the single source of truth for example discovery
 */
export const examplesRegistry: ExampleMetadata[] = [
  {
    id: 'basic',
    title: 'Basic Dialogue Example',
    description: 'Simple dialogue with player choices',
    filename: 'basic-dialogue.yarn',
    flagSchemaId: 'basic',
    features: ['basic-choices']
  },
  {
    id: 'conditional',
    title: 'Conditional Dialogue Example',
    description: 'Dialogue with conditional choices based on flags',
    filename: 'conditional-dialogue.yarn',
    flagSchemaId: 'conditional',
    features: ['conditional-choices', 'flag-checks']
  },
  {
    id: 'quest-progression',
    title: 'Quest Progression Example',
    description: 'Quest system with progression and rewards',
    filename: 'quest-progression.yarn',
    flagSchemaId: 'rpg',
    features: ['quest-progression', 'flag-setting']
  },
  {
    id: 'complex-conditional',
    title: 'Complex Conditional Example',
    description: 'Advanced conditional logic with multiple branches',
    filename: 'complex-conditional.yarn',
    flagSchemaId: 'complex_conditional',
    features: ['conditional-nodes', 'multiple-branches', 'complex-conditions']
  },
  {
    id: 'variable-operations',
    title: 'Variable Operations Example',
    description: 'Demonstrates variable operations, interpolation, and numeric calculations',
    filename: 'variable-operations-example.yarn',
    flagSchemaId: 'rpg',
    features: ['variable-operations', 'variable-interpolation', 'numeric-calculations', 'string-variables']
  }
];

/**
 * Flag schemas for examples
 */
export const exampleFlagSchemas: Record<string, FlagSchema> = {
  basic: {
    categories: ['quests', 'items', 'stats'],
    flags: [
      { id: 'quest_intro', name: 'Introduction Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'item_key', name: 'Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    ]
  },
  
  conditional: {
    categories: ['quests', 'items', 'stats'],
    flags: [
      { id: 'quest_main', name: 'Main Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'item_key', name: 'Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    ]
  },
  
  rpg: {
    categories: ['quests', 'achievements', 'items', 'stats', 'titles'],
    flags: [
      { id: 'quest_dragon_slayer', name: 'Dragon Slayer Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_dragon_slayer_complete', name: 'Dragon Slayer Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_find_key', name: 'Find the Key', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'achievement_first_quest', name: 'First Quest', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_dragon_slayer', name: 'Dragon Slayer', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_hero', name: 'Hero', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'item_ancient_key', name: 'Ancient Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_map', name: 'Treasure Map', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_sword', name: 'Legendary Sword', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_potion', name: 'Health Potion', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_charisma', name: 'Charisma', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_strength', name: 'Strength', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_experience', name: 'Experience', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'title_hero', name: 'Hero', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_merchant', name: 'Merchant', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'player_name', name: 'Player Name', type: FLAG_TYPE.GLOBAL, category: 'global', valueType: FLAG_VALUE_TYPE.STRING, defaultValue: 'Traveler' },
      { id: 'location_name', name: 'Location Name', type: FLAG_TYPE.GLOBAL, category: 'global', valueType: FLAG_VALUE_TYPE.STRING, defaultValue: 'Town' },
      { id: 'player_title', name: 'Player Title', type: FLAG_TYPE.TITLE, category: 'titles', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'greeting_count', name: 'Greeting Count', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
    ]
  },
  
  complex_conditional: {
    categories: ['quests', 'achievements', 'items', 'stats', 'titles', 'global', 'dialogue'],
    flags: [
      { id: 'quest_ancient_ruins', name: 'Ancient Ruins Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_ancient_ruins_complete', name: 'Ancient Ruins Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_treasure_hunt', name: 'Treasure Hunt', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'quest_treasure_hunt_complete', name: 'Treasure Hunt Complete', type: FLAG_TYPE.QUEST, category: 'quests' },
      { id: 'quest_dragon_slayer', name: 'Dragon Slayer Quest', type: FLAG_TYPE.QUEST, category: 'quests', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'achievement_explorer', name: 'Explorer', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_rich', name: 'Rich', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_hero', name: 'Hero', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'achievement_diplomat', name: 'Diplomat', type: FLAG_TYPE.ACHIEVEMENT, category: 'achievements' },
      { id: 'item_ancient_key', name: 'Ancient Key', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_treasure_map', name: 'Treasure Map', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_legendary_sword', name: 'Legendary Sword', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'item_gold_coin', name: 'Gold Coin', type: FLAG_TYPE.ITEM, category: 'items' },
      { id: 'stat_gold', name: 'Gold', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_reputation', name: 'Reputation', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 0 },
      { id: 'stat_charisma', name: 'Charisma', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_strength', name: 'Strength', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'stat_wisdom', name: 'Wisdom', type: FLAG_TYPE.STAT, category: 'stats', valueType: FLAG_VALUE_TYPE.NUMBER, defaultValue: 10 },
      { id: 'title_hero', name: 'Hero', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_explorer', name: 'Explorer', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'title_merchant', name: 'Merchant', type: FLAG_TYPE.TITLE, category: 'titles' },
      { id: 'global_game_started', name: 'Game Started', type: FLAG_TYPE.GLOBAL, category: 'global' },
      { id: 'global_first_visit', name: 'First Visit', type: FLAG_TYPE.GLOBAL, category: 'global' },
      { id: 'global_difficulty', name: 'Difficulty', type: FLAG_TYPE.GLOBAL, category: 'global', valueType: FLAG_VALUE_TYPE.STRING },
      { id: 'dialogue_met_guard', name: 'Met Guard', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_hostile', name: 'Hostile Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_friendly', name: 'Friendly Response', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_seeks_knowledge', name: 'Seeks Knowledge', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
      { id: 'dialogue_offered_bribe', name: 'Offered Bribe', type: FLAG_TYPE.DIALOGUE, category: 'dialogue' },
    ]
  }
};

/**
 * Get example metadata by ID
 */
export function getExampleMetadata(id: string): ExampleMetadata | null {
  return examplesRegistry.find(ex => ex.id === id) || null;
}

/**
 * List all available example IDs
 */
export function listExampleIds(): string[] {
  return examplesRegistry.map(ex => ex.id);
}

/**
 * Get flag schema by ID
 */
export function getExampleFlagSchema(id: string): FlagSchema | null {
  return exampleFlagSchemas[id] || null;
}

/**
 * List all available flag schema IDs
 */
export function listFlagSchemaIds(): string[] {
  return Object.keys(exampleFlagSchemas);
}



