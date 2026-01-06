import { ReactNode } from 'react';
import { DialogueTree, DialogueNode, Choice } from '../../types';
import { BaseGameState, DialogueResult, FlagState } from '../../types/game-state';
import { NarrativeThread, Storylet } from '../../types/narrative';
import { FlattenConfig } from '../../utils/game-state-flattener';

export type PlayerMode = 'reading' | 'world';

export interface MessageRenderProps {
  nodeId: string;
  type: 'npc' | 'player' | 'system';
  speaker?: string;
  content: string;
  isLatest: boolean;
}

export interface ChoiceRenderProps {
  choice: Choice;
  index: number;
  onSelect: () => void;
  isDisabled: boolean;
}

export interface GamePlayerProps<T extends BaseGameState> {
  thread?: NarrativeThread;
  dialogue?: DialogueTree;

  gameState: T;
  onGameStateChange?: (state: T) => void;

  startNodeId?: string;
  initialMode?: PlayerMode;
  flattenConfig?: FlattenConfig;
  className?: string;

  onClose: () => void;
  onComplete?: (result: DialogueResult) => void;

  onNodeEnter?: (nodeId: string, node: DialogueNode) => void;
  onNodeExit?: (nodeId: string, node: DialogueNode) => void;
  onChoiceSelect?: (nodeId: string, choice: Choice) => void;
  onDialogueStart?: () => void;
  onDialogueEnd?: () => void;
  onModeChange?: (mode: PlayerMode) => void;

  renderMessage?: (props: MessageRenderProps) => ReactNode;
  renderChoice?: (props: ChoiceRenderProps) => ReactNode;
}

export interface WorldPaneProps<T extends BaseGameState> {
  dialogue: DialogueTree;
  gameState: T;
  onGameStateChange?: (state: T) => void;
  storylets?: Record<string, Storylet>;
  startNodeId?: string;
  onComplete: (result: DialogueResult) => void;
  onBackToReading?: () => void;
  showBackButton?: boolean;
  pageTitle?: string;
  className?: string;

  onNodeEnter?: (nodeId: string, node: DialogueNode) => void;
  onNodeExit?: (nodeId: string, node: DialogueNode) => void;
  onChoiceSelect?: (nodeId: string, choice: Choice) => void;
  onDialogueStart?: () => void;
  onDialogueEnd?: () => void;

  renderMessage?: (props: MessageRenderProps) => ReactNode;
  renderChoice?: (props: ChoiceRenderProps) => ReactNode;
}

export interface ReadingPaneProps {
  thread: NarrativeThread;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPlayWorld: (pageId: string, dialogueTreeId: string | null) => void;
  className?: string;
}

export interface StoryletSidebarProps {
  storylets: Storylet[];
  onSelectStorylet: (storyletId: string) => void;
  className?: string;
}
