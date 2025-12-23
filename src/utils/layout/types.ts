/**
 * Layout Strategy Types
 * 
 * Defines the interface and types for layout algorithms.
 * Implements the Strategy pattern to allow swappable layout algorithms.
 */

import { DialogueTree } from '../../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Layout direction for hierarchical layouts
 * - TB: Top to Bottom (vertical flow)
 * - LR: Left to Right (horizontal flow)
 */
export type LayoutDirection = 'TB' | 'LR';

/**
 * Configuration options for layout algorithms
 */
export interface LayoutOptions {
  /** Direction of flow for hierarchical layouts */
  direction?: LayoutDirection;
  /** Horizontal spacing between nodes */
  nodeSpacingX?: number;
  /** Vertical spacing between nodes */
  nodeSpacingY?: number;
  /** Margin around the entire layout */
  margin?: number;
  /** Whether to animate the transition */
  animate?: boolean;
}

/**
 * Result of a layout operation
 */
export interface LayoutResult {
  /** The dialogue tree with updated node positions */
  dialogue: DialogueTree;
  /** Metadata about the layout operation */
  metadata: {
    /** Time taken to compute layout in milliseconds */
    computeTimeMs: number;
    /** Number of nodes processed */
    nodeCount: number;
    /** Bounding box of the layout */
    bounds: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      width: number;
      height: number;
    };
  };
}

/**
 * Layout Strategy Interface
 * 
 * All layout algorithms must implement this interface.
 * This enables the Strategy pattern - algorithms can be swapped at runtime.
 * 
 * @example
 * ```typescript
 * class MyCustomLayout implements LayoutStrategy {
 *   readonly id = 'my-custom';
 *   readonly name = 'My Custom Layout';
 *   readonly description = 'A custom layout algorithm';
 *   
 *   apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult {
 *     // Your layout logic here
 *   }
 * }
 * ```
 */
export interface LayoutStrategy {
  /** Unique identifier for the strategy */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description of what this layout does */
  readonly description: string;
  
  /** Default options for this strategy */
  readonly defaultOptions?: Partial<LayoutOptions>;
  
  /**
   * Apply the layout algorithm to a dialogue tree
   * @param dialogue - The dialogue tree to layout
   * @param options - Optional configuration
   * @returns The layout result with updated positions
   */
  apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult;
  
  /**
   * Check if this strategy supports the given dialogue
   * Some strategies may not work well with certain graph structures
   */
  supports?(dialogue: DialogueTree): boolean;
}

/**
 * Registry entry for a layout strategy
 */
export interface LayoutStrategyEntry {
  strategy: LayoutStrategy;
  /** Whether this is the default strategy */
  isDefault?: boolean;
}



