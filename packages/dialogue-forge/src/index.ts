export {
  ForgeStoryletGraphEditor,
  ForgeWorkspace as NarrativeWorkspace,
  ForgeWorkspace as DialogueForge,
  GuidePanel,
  FlagSelector,
  FlagManager,
  CharacterSelector,
  useForgeWorkspaceCompositionCompiler,
  flattenGameState,
  validateGameState,
  extractFlagsFromGameState,
  exportToYarn,
  importFromYarn,
  initializeFlags,
  mergeFlagUpdates,
  validateFlags,
  getFlagValue,
} from '@magicborn/forge';

// Export styles
import '@magicborn/shared/styles/scrollbar.css';
import '@magicborn/shared/styles/graph.css';
import '@magicborn/forge/styles/nodes.css';
import '@magicborn/shared/styles/contexts.css';
import '@magicborn/shared/styles/themes.css';

export * from '@magicborn/forge';
export * from '@magicborn/shared/types/constants';
