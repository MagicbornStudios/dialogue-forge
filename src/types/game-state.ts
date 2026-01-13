/**
 * Game State Integration Types
 * 
 * These types define how Dialogue Forge integrates with your game's state system.
 */

import type { ForgeGraphDoc } from './index';
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
  flags: FlagState;
  characters?: Record<string, Character>; // Character definitions
  // Users extend this with their own properties:
  // player?: PlayerState;
  // etc.
}

/**
 * Convenience type for extending game state
 */
export type GameState<T extends Record<string, unknown> = Record<string, never>> =
  BaseGameState & T;

/**
 * Updated flags after dialogue completes
 */
export interface DialogueResult<TGameState extends BaseGameState = BaseGameState> {
  updatedFlags: FlagState;
  dialogueTree: ForgeGraphDoc;
  completedNodeIds: string[]; // Nodes that were visited
  gameState: TGameState;
}

/**
 * Props for running a dialogue (simulation/play mode)
 */
export interface DialogueRunProps<
  TGameState extends BaseGameState = BaseGameState,
> {
  dialogue: ForgeGraphDoc;
  gameState: TGameState; // Any JSON game state (will be flattened)
  startNodeId?: string;
  onComplete?: (result: DialogueResult<TGameState>) => void;
  onFlagUpdate?: (flags: FlagState) => void;
}

/**
 * Props for editing a dialogue
 */
export interface DialogueEditProps {
  dialogue: ForgeGraphDoc | null;
  flagSchema?: FlagSchema;
  onChange: (dialogue: ForgeGraphDoc) => void;
  onExportYarn?: (yarn: string) => void;
  onExportJSON?: (json: string) => void;
  className?: string;
  showTitleEditor?: boolean;
}

