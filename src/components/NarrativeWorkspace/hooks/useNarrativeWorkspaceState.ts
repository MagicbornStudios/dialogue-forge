import { useEffect, useState } from 'react';
import type { DialogueTree, ViewMode } from '../../../types';
import type { BaseGameState } from '../../../types/game-state';
import type { FlagSchema } from '../../../types/flags';
import type { StoryThread } from '../../../types/narrative';
import { VIEW_MODE } from '../../../types/constants';

interface UseNarrativeWorkspaceStateProps {
  initialThread: StoryThread | undefined;
  initialDialogue: DialogueTree | undefined;
  flagSchema?: FlagSchema;
  gameState?: BaseGameState;
}

const createEmptyThread = (): StoryThread => ({
  id: 'empty-thread',
  title: 'Empty Thread',
  acts: [],
});

const createEmptyDialogue = (): DialogueTree => ({
  id: 'empty-dialogue',
  title: 'Empty Dialogue',
  startNodeId: '',
  nodes: {},
});

export function useNarrativeWorkspaceState({
  initialThread,
  initialDialogue,
  flagSchema,
  gameState,
}: UseNarrativeWorkspaceStateProps) {
  const [thread, setThread] = useState<StoryThread>(initialThread || createEmptyThread());
  const [dialogueTree, setDialogueTree] = useState<DialogueTree>(initialDialogue || createEmptyDialogue());
  const [activeFlagSchema, setActiveFlagSchema] = useState<FlagSchema | undefined>(flagSchema);
  const [activeGameState, setActiveGameState] = useState<BaseGameState>(() => gameState ?? { flags: {} });
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showFlagManager, setShowFlagManager] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [narrativeViewMode, setNarrativeViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
  const [dialogueViewMode, setDialogueViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
  const [showNarrativeMiniMap, setShowNarrativeMiniMap] = useState(true);
  const [showDialogueMiniMap, setShowDialogueMiniMap] = useState(true);
  const [dialogueScope, setDialogueScope] = useState<'page' | 'storylet'>('page');
  const [storyletFocusId, setStoryletFocusId] = useState<string | null>(null);
  const [gameStateDraft, setGameStateDraft] = useState(() => JSON.stringify(gameState ?? { flags: {} }, null, 2));
  const [gameStateError, setGameStateError] = useState<string | null>(null);

  useEffect(() => {
    setActiveFlagSchema(flagSchema);
  }, [flagSchema]);

  useEffect(() => {
    setActiveGameState(gameState ?? { flags: {} });
  }, [gameState]);

  useEffect(() => {
    setGameStateDraft(JSON.stringify(activeGameState, null, 2));
  }, [activeGameState]);

  return {
    // State
    thread,
    dialogueTree,
    activeFlagSchema,
    activeGameState,
    showPlayModal,
    showFlagManager,
    showGuide,
    narrativeViewMode,
    dialogueViewMode,
    showNarrativeMiniMap,
    showDialogueMiniMap,
    dialogueScope,
    storyletFocusId,
    gameStateDraft,
    gameStateError,
    // Setters
    setThread,
    setDialogueTree,
    setActiveFlagSchema,
    setActiveGameState,
    setShowPlayModal,
    setShowFlagManager,
    setShowGuide,
    setNarrativeViewMode,
    setDialogueViewMode,
    setShowNarrativeMiniMap,
    setShowDialogueMiniMap,
    setDialogueScope,
    setStoryletFocusId,
    setGameStateDraft,
    setGameStateError,
  };
}
