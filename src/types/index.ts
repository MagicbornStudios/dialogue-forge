import { NodeType } from './constants';
import type { Condition, ConditionalBlock } from './conditionals';
import type { StoryletPool } from './narrative';
export type { ViewMode } from './constants';
export { DIALOGUE_FORGE_EVENT_TYPE, DIALOGUE_PANEL_TAB, DIALOGUE_OPEN_REASON } from './constants';
export type { DialogueForgeEventType, DialoguePanelTab, DialogueOpenReason } from './constants';
export { NODE_TYPE_LABELS, AVAILABLE_NODE_TYPES, CSS_CLASSES } from './ui-constants';
export type { NODE_TYPE_LABELS as NodeTypeLabelsType, AVAILABLE_NODE_TYPES as AvailableNodeTypesType, CSS_CLASSES as CssClassesType } from './ui-constants';
export type { Condition, ConditionalBlock } from './conditionals';
export type {
  NarrativeAct,
  NarrativeChapter,
  NarrativeElement,
  NarrativePage,
  NarrativeThread,
  StoryThread,
  StoryletPoolMember,
  StoryletTemplate,
  StoryletPool,
  StoryletSelectionMode,
} from './narrative';

export interface Choice {
  id: string;
  text: string;
  nextNodeId?: string; // Optional - choice can end the dialogue
  conditions?: Condition[];
  setFlags?: string[];
}

export interface StoryletCall {
  templateId?: string;
  entryPolicy?: string;
  entryNodeId?: string;
  returnPolicy?: string;
  returnNodeId?: string;
}

export interface DialogueNode {
  id: string;
  type: NodeType;
  speaker?: string; // Legacy: text speaker name (deprecated, use characterId)
  characterId?: string; // Character ID from game state
  content: string;
  choices?: Choice[]; // For player nodes
  nextNodeId?: string;
  setFlags?: string[];
  conditionalBlocks?: ConditionalBlock[]; // For conditional nodes (if/elseif/else/endif)
  storyletPoolId?: string; // For storylet nodes
  storyletId?: string; // For storylet nodes targeting a specific storylet
  storyletPool?: StoryletPool; // Inline pool data for storylet pool nodes
  storyletCall?: StoryletCall;
  x: number;
  y: number;
}

export interface DialogueTree {
  id: string;
  title: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
}

import { FlagSchema, type FlagSchema as FlagSchemaType } from './flags';

export type { FlagSchemaType as FlagSchema };

export interface DialogueEditorProps {
  dialogue: DialogueTree | null;
  onChange: (dialogue: DialogueTree) => void;
  onExportYarn?: (yarn: string) => void;
  onExportJSON?: (json: string) => void;
  flagSchema?: FlagSchema;
  className?: string;
  showTitleEditor?: boolean;
  // Event hooks
  onNodeAdd?: (node: DialogueNode) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<DialogueNode>) => void;
  onConnect?: (sourceId: string, targetId: string, sourceHandle?: string) => void;
  onDisconnect?: (edgeId: string, sourceId: string, targetId: string) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

export interface ContextMenu {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
}

export interface EdgeDropMenu extends ContextMenu {
  fromNodeId: string;
  fromChoiceIdx?: number;
}

export interface DraggingEdge {
  fromNodeId: string;
  fromChoiceIdx?: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
