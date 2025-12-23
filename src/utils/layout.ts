/**
 * Layout Utilities - Re-export from modular layout system
 * 
 * This file provides backward compatibility.
 * For new code, import directly from './layout/index.ts'
 * 
 * @see LAYOUT_STRATEGIES.md for documentation
 */

export {
  // Main functions
  applyLayout,
  listLayouts,
  
  // Backward compatibility
  applyDagreLayout,
  applyHierarchicalLayout,
  resolveNodeCollisions,
  
  // Types
  type LayoutStrategy,
  type LayoutOptions,
  type LayoutResult,
  type LayoutDirection,
  
  // Registry
  layoutRegistry,
  
  // Strategies (for extension)
  DagreLayoutStrategy,
  ForceLayoutStrategy,
  GridLayoutStrategy,
} from './layout/index';
