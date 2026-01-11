export { DialogueGraphEditor } from './components/GraphEditors/DialogueGraphEditor/DialogueGraphEditor';
export { NarrativeGraphEditor } from './components/GraphEditors/NarrativeGraphEditor/NarrativeGraphEditor';
export { NarrativeWorkspace } from './components/NarrativeWorkspace/NarrativeWorkspace';
// Export DialogueForge as the main component (alias for NarrativeWorkspace)
export { NarrativeWorkspace as DialogueForge } from './components/NarrativeWorkspace/NarrativeWorkspace';
export { useDialogueRunner } from './components/GamePlayer/hooks/useDialogueRunner';
// Legacy scene player (use GamePlayer for new experiences)
// Legacy export for backward compatibility
export { GamePlayer } from './components/GamePlayer/components/GamePlayer';
export { useNarrativeTraversal } from './components/GamePlayer/hooks/useNarrativeTraversal';
export { GuidePanel } from './components/GamePlayer/components/GuidePanel';
export { FlagSelector } from './components/GraphEditors/shared/FlagSelector';
export { FlagManager } from './components/GamePlayer/components/Manager/FlagManager';
export { CharacterSelector } from './components/GraphEditors/DialogueGraphEditor/components/CharacterSelector';

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
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from './components/GamePlayer/utils/flag-manager';
export * from './utils/node-helpers';
export * from './utils/narrative-helpers';
export * from './utils/narrative-converter';
