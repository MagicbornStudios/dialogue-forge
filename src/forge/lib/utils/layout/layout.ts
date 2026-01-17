/**
 * Layout Module
 * 
 * Provides automatic graph layout algorithms for dialogue trees.
 * Uses the Strategy pattern to allow swappable layout algorithms.
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { layoutRegistry, applyLayout } from './layout';
 * 
 * // Apply default layout (dagre)
 * const result = applyLayout(dialogue);
 * 
 * // Apply specific layout
 * const result = applyLayout(dialogue, 'force');
 * 
 * // With options
 * const result = applyLayout(dialogue, 'dagre', { direction: 'LR' });
 * 
 * // List available layouts
 * console.log(layoutRegistry.list());
 * ```
 * 
 * ## Adding Custom Layouts
 * 
 * See LAYOUT_STRATEGIES.md for documentation on creating custom layouts.
 * 
 * @module layout
 */

import { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { layoutRegistry } from './registry';
import { LayoutOptions, LayoutResult, LayoutDirection } from './types';
import { DagreLayoutStrategy, ForceLayoutStrategy, GridLayoutStrategy } from './strategies';

// ============================================================================
// Register Built-in Strategies
// ============================================================================

// Register all built-in strategies
layoutRegistry.register(new DagreLayoutStrategy(), true); // Default
layoutRegistry.register(new ForceLayoutStrategy());
layoutRegistry.register(new GridLayoutStrategy());

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Apply a layout algorithm to a graph
 * 
 * @param graph - The graph to layout
 * @param strategyId - Optional strategy ID (defaults to 'dagre')
 * @param options - Optional layout configuration
 * @returns Layout result with updated graph and metadata
 * 
 * @example
 * ```typescript
 * // Default dagre layout
 * const result = applyLayout(graph);
 * 
 * // Horizontal dagre layout
 * const result = applyLayout(graph, 'dagre', { direction: 'LR' });
 * 
 * // Force-directed layout
 * const result = applyLayout(graph, 'force');
 * 
 * // Grid layout
 * const result = applyLayout(graph, 'grid');
 * ```
 */
export function applyLayout(
  graph: ForgeGraphDoc,
  strategyId?: string,
  options?: LayoutOptions
): LayoutResult {
  return layoutRegistry.apply(strategyId, graph, options);
}

/**
 * Get the list of available layout strategies
 */
export function listLayouts(): Array<{ id: string; name: string; description: string; isDefault: boolean }> {
  return layoutRegistry.list();
}

// ============================================================================
// Backward Compatibility
// ============================================================================

/**
 * Apply dagre layout (backward compatible function)
 * @deprecated Use applyLayout(graph, 'dagre', options) instead
 */
export function applyDagreLayout(
  graph: ForgeGraphDoc,
  direction: LayoutDirection = 'TB'
): ForgeGraphDoc {
  const result = applyLayout(graph, 'dagre', { direction });
  return result.graph;
}

/**
 * Apply hierarchical layout (backward compatible alias)
 * @deprecated Use applyLayout(dialogue, 'dagre', options) instead
 */
export const applyHierarchicalLayout = applyDagreLayout;

/**
 * Resolve node collisions (kept for backward compatibility)
 */
export { resolveNodeCollisions } from './collision';

// ============================================================================
// Exports
// ============================================================================

// Types
export type { LayoutStrategy, LayoutOptions, LayoutResult, LayoutDirection } from './types';

// Registry
export { layoutRegistry } from './registry';

// Strategies (for direct use or extension)
export { DagreLayoutStrategy, ForceLayoutStrategy, GridLayoutStrategy } from './strategies';