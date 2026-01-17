// DialogueGraphEditor is now ForgeStoryletGraphEditor - use ForgeWorkspace instead
export { ForgeStoryletGraphEditor } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
export { ForgeWorkspace as NarrativeWorkspace } from '@/forge/components/ForgeWorkspace/ForgeWorkspace';
// Export DialogueForge as the main component (alias for NarrativeWorkspace)
export { ForgeWorkspace as DialogueForge } from '@/forge/components/ForgeWorkspace/ForgeWorkspace';
// Legacy scene player (use GamePlayer for new experiences)
// Legacy export for backward compatibility
export { GamePlayer } from '@/forge/components/GamePlayer/components/GamePlayer';
export { GuidePanel } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GuidePanel';
export { FlagSelector } from '@/forge/components/GraphEditors/shared/FlagSelector';
export { ForgeFlagManager as FlagManager } from '@/forge/components/shared/ForgeFlagManagerModal/FlagManager/ForgeFlagManager';
export { CharacterSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/CharacterSelector';

// Export styles
import './styles/scrollbar.css';
import './styles/graph.css';
import './forge/styles/nodes.css';
import './forge/styles/forge-context.css';
import './styles/themes.css';

// Export all types
export * from '@/forge/types/forge-graph';
export * from '@/forge/types/flags';
export * from '@/forge/types/forge-game-state';
export * from '@/forge/types/characters';
export * from '@/forge/types/constants';
export * from '@/video';
export * from '@/forge/runtime/engine';

// Export game state utilities
export { 
  flattenGameState, 
  validateGameState, 
  extractFlagsFromGameState,
  type FlattenConfig,
  type FlattenedState 
} from '@/forge/components/GamePlayer/lib/game-state-flattener';

// Export utilities
export { exportToYarn, importFromYarn } from '@/forge/lib/yarn-converter';
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from '@/forge/components/shared/ForgeFlagManagerModal/FlagManager/utils/flag-manager';
export * from '@/forge/lib/utils/forge-flow-helpers';
export * from '@/forge/lib/data-adapter/media';
// narrative-helpers and narrative-converter removed - use ForgeGraphDoc flow-first paradigm
