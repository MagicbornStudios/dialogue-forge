export { DialogueGraphEditor } from './components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
export { ForgeWorkspace as NarrativeWorkspace } from './components/ForgeWorkspace/ForgeWorkspace';
// Export DialogueForge as the main component (alias for NarrativeWorkspace)
export { ForgeWorkspace as DialogueForge } from './components/ForgeWorkspace/ForgeWorkspace';
// Legacy scene player (use GamePlayer for new experiences)
// Legacy export for backward compatibility
export { GamePlayer } from './components/GamePlayer/components/GamePlayer';
export { GuidePanel } from './components/shared/GuidePanel';
export { FlagSelector } from './components/GraphEditors/shared/FlagSelector';
export { FlagManager } from './components/shared/FlagManager/FlagManager';
export { CharacterSelector } from './components/GraphEditors/ForgeStoryletGraphEditor/components/CharacterSelector';

// Export styles
import './styles/scrollbar.css';
import './styles/theme.css';

// Export all types
export * from './types';
export * from './types/flags';
export * from './types/game-state';
export * from './types/characters';
export * from './types/constants';

// Export game state utilities
export { 
  flattenGameState, 
  validateGameState, 
  extractFlagsFromGameState,
  type FlattenConfig,
  type FlattenedState 
} from './utils/game-state-flattener';

// Export utilities
export { exportToYarn, importFromYarn } from './lib/yarn-converter';
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from './components/shared/FlagManager/utils/flag-manager';
export * from './utils/forge-flow-helpers';
export * from './utils/narrative-helpers';
export * from './utils/narrative-converter';
