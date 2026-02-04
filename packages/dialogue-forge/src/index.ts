// DialogueGraphEditor is now ForgeStoryletGraphEditor - use ForgeWorkspace instead
export { ForgeStoryletGraphEditor } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
export { ForgeWorkspace as NarrativeWorkspace } from '@magicborn/forge/components/ForgeWorkspace/ForgeWorkspace';
// Export DialogueForge as the main component (alias for NarrativeWorkspace)
export { ForgeWorkspace as DialogueForge } from '@magicborn/forge/components/ForgeWorkspace/ForgeWorkspace';
// Legacy scene player (use GamePlayer for new experiences)
// Legacy export for backward compatibility
export { GamePlayer } from '@magicborn/forge/components/ForgeWorkspace/components/GamePlayer/GamePlayer';
export { GuidePanel } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/GuidePanel';
export { FlagSelector } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/FlagSelector';
export { ForgeFlagManager as FlagManager } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeFlagManagerModal/ForgeFlagManager';
export { CharacterSelector } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/CharacterSelector';

// Export styles
import '@magicborn/shared/styles/scrollbar.css';
import '@magicborn/shared/styles/graph.css';
import '@magicborn/forge/styles/nodes.css';
import '@magicborn/shared/styles/contexts.css';
import '@magicborn/shared/styles/themes.css';

// Export all types
export * from '@magicborn/forge/types/forge-graph';
export * from '@magicborn/forge/types/flags';
export * from '@magicborn/shared/types/forge-game-state';
export * from '@magicborn/forge/types/characters';
export * from '@magicborn/shared/types/constants';
export * from '@magicborn/video';
export * from '@magicborn/runtime/engine';
export { useForgeWorkspaceCompositionCompiler } from '@magicborn/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceCompositionCompiler';

// Export game state utilities
export { 
  flattenGameState, 
  validateGameState, 
  extractFlagsFromGameState,
  type FlattenConfig,
  type FlattenedState 
} from '@magicborn/forge/lib/game-player/game-state-flattener';

// Export utilities
export { exportToYarn, importFromYarn } from '@magicborn/forge/lib/yarn-converter';
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from '@magicborn/forge/lib/flag-manager/utils/flag-manager';
export * from '@magicborn/forge/lib/utils/forge-flow-helpers';
export * from '@magicborn/forge/lib/data-adapter/media';
// narrative-helpers and narrative-converter removed - use ForgeGraphDoc flow-first paradigm
