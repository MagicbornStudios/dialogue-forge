/**
 * Flag value types - must be Yarn Spinner-compatible
 */
export type ForgeFlagValue = boolean | number | string;

/**
 * Current game state - flags and their values (flat, Yarn-compatible)
 */
export interface ForgeFlagState {
  [flagId: string]: ForgeFlagValue;
}

/**
 * Legacy alias for backward compatibility
 */
export type ForgeGameFlagState = ForgeFlagState;

import type { ForgeCharacter } from './characters';

/**
 * Base game state structure that users can extend
 * Must have a 'flags' property, but can have any other structure
 */
export interface ForgeGameState {
  flags: ForgeFlagState;
  characters?: Record<string, ForgeCharacter>; // Character definitions
  // Users extend this with their own properties:
  // player?: PlayerState;
  // etc.
}

/**
 * Result returned when a dialogue completes
 */
export interface DialogueResult {
  updatedFlags?: ForgeFlagState;
  // Users can extend this with additional result data
}