/**
 * UI and Interaction Constants for Dialogue Forge
 * 
 * Centralized constants to eliminate magic numbers and improve maintainability.
 * These values were previously scattered throughout the codebase as hardcoded literals.
 */

/**
 * Graph scale and sizing constants (existing)
 */
export const GRAPH_SCALE_CONSTANTS = {
  /** Default graph scale */
  DEFAULT: 0.85,
  /** Minimum allowed scale */
  MIN: 0.3,
  /** Maximum allowed scale */
  MAX: 2,
} as const;

/**
 * Node dimension constants (existing)
 */
export const NODE_DIMENSIONS = {
  /** Default node width */
  WIDTH: 200,
  /** Default node height */
  HEIGHT: 100,
} as const;

/**
 * Animation and timing constants
 */
export const ANIMATION_CONSTANTS = {
  /** Delay for automatic layout operations */
  AUTO_LAYOUT_DELAY: 50,
  /** Immediate delay for zero-timeout operations */
  IMMEDIATE_DELAY: 0,
  /** Delay for fit-to-view operations */
  FIT_VIEW_DELAY: 100,
} as const;

/**
 * Graph layout algorithm constants
 */
export const LAYOUT_CONSTANTS = {
  /** Maximum iterations for Dagre layout algorithm */
  MAX_ITERATIONS: 50,
  /** Overlap threshold for node collision detection */
  OVERLAP_THRESHOLD: 0.3,
  /** Default margin between nodes in layout */
  DEFAULT_MARGIN: 20,
  /** Connection threshold for edge detection */
  CONNECTION_THRESHOLD: 100,
} as const;

/**
 * UI dimension and sizing constants
 */
export const UI_CONSTANTS = {
  /** Minimum width for context menus */
  CONTEXT_MENU_MIN_WIDTH: '180px',
  /** Connection threshold for interactions */
  CONNECTION_THRESHOLD: 100,
} as const;

// Legacy exports for backward compatibility
export const NODE_WIDTH = NODE_DIMENSIONS.WIDTH;
export const NODE_HEIGHT = NODE_DIMENSIONS.HEIGHT;
export const DEFAULT_GRAPH_SCALE = GRAPH_SCALE_CONSTANTS.DEFAULT;
export const MIN_SCALE = GRAPH_SCALE_CONSTANTS.MIN;
export const MAX_SCALE = GRAPH_SCALE_CONSTANTS.MAX;






