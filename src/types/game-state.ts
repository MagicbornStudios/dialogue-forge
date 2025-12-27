/**
 * Game State Integration Types
 * 
 * These types define how Dialogue Forge integrates with your game's state system.
 */

import type { DialogueTree } from './index';
import type { FlagSchema } from './flags';

/**
 * Flag value types - must be Yarn Spinner-compatible
 */
export type FlagValue = boolean | number | string;

/**
 * Current game state - flags and their values (flat, Yarn-compatible)
 */
export interface FlagState {
  [flagId: string]: FlagValue;
}

/**
 * Legacy alias for backward compatibility
 */
export type GameFlagState = FlagState;

import type { Character } from './characters';

/**
 * Base game state structure that users can extend
 * Must have a 'flags' property, but can have any other structure
 */
export interface BaseGameState {
  flags?: FlagState;
  characters?: Record<string, Character>; // Character definitions
  // Users extend this with their own properties:
  // player?: PlayerState;
  // etc.
}

/**
 * Convenience type for extending game state
 */
export type GameState<T extends Record<string, any> = {}> = BaseGameState & T;

/**
 * Updated flags after dialogue completes
 */
export interface DialogueResult {
  updatedFlags: FlagState;
  dialogueTree: DialogueTree;
  completedNodeIds: string[]; // Nodes that were visited
}

/**
 * Props for running a dialogue (simulation/play mode)
 */
export interface DialogueRunProps {
  dialogue: DialogueTree;
  gameState: Record<string, any>; // Any JSON game state (will be flattened)
  startNodeId?: string;
  onComplete?: (result: DialogueResult) => void;
  onFlagUpdate?: (flags: FlagState) => void;
}

/**
 * Props for editing a dialogue
 */
export interface DialogueEditProps {
  dialogue: DialogueTree | null;
  flagSchema?: FlagSchema;
  onChange: (dialogue: DialogueTree) => void;
  onExportYarn?: (yarn: string) => void;
  onExportJSON?: (json: string) => void;
  className?: string;
  showTitleEditor?: boolean;
}

