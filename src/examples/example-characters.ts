/**
 * Example Characters
 * 
 * Sample character data for use in examples and demos
 */

import type { Character } from '../types/characters';

export const exampleCharacters: Record<string, Character> = {
  'stranger': {
    id: 'stranger',
    name: 'Mysterious Stranger',
    avatar: '👤',
    description: 'A cloaked figure who appears at crossroads',
  },
  'bartender': {
    id: 'bartender',
    name: 'Bartender',
    avatar: '🍺',
    description: 'The friendly tavern keeper',
  },
  'merchant': {
    id: 'merchant',
    name: 'Merchant',
    avatar: '💰',
    description: 'A traveling trader',
  },
  'guard': {
    id: 'guard',
    name: 'City Guard',
    avatar: '🛡️',
    description: 'A vigilant city guard',
  },
  'wizard': {
    id: 'wizard',
    name: 'Wizard',
    avatar: '🧙',
    description: 'An ancient mage',
  },
  'player': {
    id: 'player',
    name: 'Player',
    avatar: '🎮',
    description: 'The player character',
  },
  'narrator': {
    id: 'narrator',
    name: 'Narrator',
    avatar: '📖',
    description: 'The story narrator',
  },
};

/**
 * Get all example characters
 */
export function getExampleCharacters(): Record<string, Character> {
  return exampleCharacters;
}

/**
 * Get a character by ID
 */
export function getExampleCharacter(id: string): Character | undefined {
  return exampleCharacters[id];
}

/**
 * List all character IDs
 */
export function listExampleCharacterIds(): string[] {
  return Object.keys(exampleCharacters);
}

