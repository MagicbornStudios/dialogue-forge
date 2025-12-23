export { DialogueEditorV2 } from './components/DialogueEditorV2';
export { ScenePlayer } from './components/ScenePlayer';
export type { ScenePlayerProps } from './components/ScenePlayer';
// Legacy export for backward compatibility
export { ScenePlayer as DialogueSimulator } from './components/ScenePlayer';
export { GuidePanel } from './components/GuidePanel';
export { FlagSelector } from './components/FlagSelector';
export { FlagManager } from './components/FlagManager';
export { ZoomControls } from './components/ZoomControls';
export { ExampleLoader } from './components/ExampleLoader';

// Export styles
import './styles/scrollbar.css';

// Export examples
export { exampleDialogues, demoFlagSchemas, getExampleDialogue, getDemoFlagSchema, listExamples, listDemoFlagSchemas } from './examples';

// Export all types
export * from './types';
export * from './types/flags';
export * from './types/game-state';
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
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from './lib/flag-manager';
export * from './utils/node-helpers';
export * from './utils/feature-flags';

