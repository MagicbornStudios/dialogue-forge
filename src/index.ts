export { DialogueEditorV2 } from './components/DialogueEditorV2';

// GamePlayer - Unified player component
export { GamePlayer, WorldPane, ReadingPane } from './components/GamePlayer';
export type { 
  GamePlayerProps, 
  WorldPaneProps, 
  ReadingPaneProps, 
  PlayerMode,
  MessageRenderProps,
  ChoiceRenderProps,
} from './components/GamePlayer';

// Legacy exports for backward compatibility
export { ScenePlayer } from './components/ScenePlayer';
export type { ScenePlayerProps } from './components/ScenePlayer';
export { ScenePlayer as DialogueSimulator } from './components/ScenePlayer';

export { GuidePanel } from './components/GuidePanel';
export { FlagSelector } from './components/FlagSelector';
export { FlagManager } from './components/FlagManager';
export { CharacterSelector } from './components/CharacterSelector';
export { ZoomControls } from './components/ZoomControls';
export { ExampleLoader } from './components/ExampleLoader';

// Narrative Thread Components
export { NarrativeEditor } from './components/NarrativeEditor';
export { NarrativeGraphView } from './components/NarrativeGraphView';
export { NarrativeBreadcrumb } from './components/NarrativeBreadcrumb';
/** @deprecated Use GamePlayer instead */
export { NarrativePlayer } from './components/NarrativePlayer';
export { StoryletLibrary } from './components/StoryletLibrary';
export { ActNodeV2 } from './components/ActNodeV2';
export { ChapterNodeV2 } from './components/ChapterNodeV2';
export { PageNodeV2 } from './components/PageNodeV2';
export { StoryletNodeV2 } from './components/StoryletNodeV2';
export { StartNodeV2, EndNodeV2 } from './components/StartEndNodeV2';

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
export * from './types/narrative';

// Export game state utilities
export { 
  flattenGameState, 
  validateGameState, 
  extractFlagsFromGameState,
  type FlattenConfig,
  type FlattenedState 
} from './utils/game-state-flattener';

// Export hooks
export { useDialogueRunner } from './hooks/useDialogueRunner';
export type { 
  HistoryEntry, 
  DialogueStackEntry, 
  DialogueRunnerConfig, 
  DialogueRunnerState, 
  DialogueRunnerActions 
} from './hooks/useDialogueRunner';

// Export utilities
export { exportToYarn, importFromYarn } from './lib/yarn-converter';
export { initializeFlags, mergeFlagUpdates, validateFlags, getFlagValue } from './lib/flag-manager';
export * from './utils/node-helpers';
export * from './utils/feature-flags';

// Export narrative utilities
export * from './utils/narrative-helpers';
export {
  convertNarrativeThreadToReactFlow,
  updateNarrativeThreadFromReactFlow,
  getStoryletsForPage,
  NARRATIVE_EDGE_COLORS,
} from './utils/narrative-converter';
