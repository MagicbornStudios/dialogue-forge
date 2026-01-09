export { DialogueGraphEditor } from './components/DialogueGraphEditor';
export { NarrativeGraphEditor } from './components/NarrativeGraphEditor';
export { NarrativeWorkspace } from './components/NarrativeWorkspace';
// Export DialogueForge as the main component (alias for NarrativeWorkspace)
export { NarrativeWorkspace as DialogueForge } from './components/NarrativeWorkspace';
// Legacy scene player (use GamePlayer for new experiences)
// Legacy export for backward compatibility
export { GamePlayer } from './components/GamePlayer';
export { useDialogueRunner } from './hooks/useDialogueRunner';
export { useNarrativeTraversal } from './hooks/useNarrativeTraversal';
export { GuidePanel } from './components/GuidePanel';
export { FlagSelector } from './components/DialogueGraphEditor/components/FlagSelector';
export { FlagManager } from './components/FlagManager';
export { CharacterSelector } from './components/CharacterSelector';
export { ZoomControls } from './components/EditorComponents/ZoomControls';
export { ExampleLoader } from './components/ExampleLoader';

// Export styles
import './styles/scrollbar.css';
import './styles/theme.css';

// Export examples
export { exampleDialogues, demoFlagSchemas, getExampleDialogue, getDemoFlagSchema, listExamples, listDemoFlagSchemas } from './examples';
export { exampleCharacters, getExampleCharacters, getExampleCharacter, listExampleCharacterIds } from './examples';

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
export * from './utils/feature-flags';
export * from './utils/narrative-helpers';
export * from './utils/narrative-converter';
export * from './utils/narrative-client';
export * from './utils/narrative-editor-utils';
