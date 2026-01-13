import { NodeType } from './constants';
export type { ViewMode } from './constants';
export { DIALOGUE_FORGE_EVENT_TYPE, DIALOGUE_PANEL_TAB, DIALOGUE_OPEN_REASON } from './constants';
export type { DialogueForgeEventType, DialoguePanelTab, DialogueOpenReason } from './constants';
export { NODE_TYPE_LABELS, AVAILABLE_NODE_TYPES, CSS_CLASSES, FORGE_NODE_TYPE_LABELS, NODE_TYPE_BORDER_COLORS, NODE_TYPE_BADGE_CLASSES } from './ui-constants';
export type { NODE_TYPE_LABELS as NodeTypeLabelsType, AVAILABLE_NODE_TYPES as AvailableNodeTypesType, CSS_CLASSES as CssClassesType } from './ui-constants';
export type {
  ForgeAct as NarrativeAct,
  ForgeChapter as NarrativeChapter,
  NarrativeElement,
  ForgePage as NarrativePage,
  ForgeNarrativeGraph as NarrativeGraph,
} from './narrative';
export { NARRATIVE_ELEMENT } from './narrative';
import type { 
  ForgeGraphDoc,
  ForgeNode,
} from './forge/forge-graph';

export type { 
  ForgeGraphDoc,
  ForgeChoice as Choice,
  ForgeStoryletCall as StoryletCall,
  ForgeNode,
  ForgeNodeType,
  ForgeGraphKind,
  ForgeEdgeKind,
  ForgeFlowNode,
  ForgeFlowEdge,
  ForgeFlowJson,
  ForgeConditionalBlock,
  ForgeCondition as Condition,
  ForgeConditionalBlockType,
  ForgeStoryletCallMode,
  NarrativeForgeNodeType,
} from './forge/forge-graph';
export { 
  FORGE_CONDITIONAL_BLOCK_TYPE,
  FORGE_NODE_TYPE,
  FORGE_GRAPH_KIND,
  FORGE_EDGE_KIND,
  FORGE_STORYLET_CALL_MODE,
  NARRATIVE_FORGE_NODE_TYPE,
} from './forge/forge-graph';


import { FlagSchema, type FlagSchema as FlagSchemaType } from './flags';

export type { FlagSchemaType as FlagSchema };



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
