/**
 * Character Types
 * 
 * Defines character data structure for dialogue nodes
 */

export interface Character {
  id: string;
  name: string;
  avatar?: string; // URL or path to avatar image
  description?: string;
  // Additional character metadata can be added here
  [key: string]: any; // Allow extensibility
}

export interface CharactersState {
  [characterId: string]: Character;
}

