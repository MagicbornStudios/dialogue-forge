
export type { ViewMode } from './constants';
export { FORGE_EVENT_TYPE } from './constants';
export type { ForgeEventType } from './constants';
export { CSS_CLASSES, FORGE_NODE_TYPE_LABELS, NODE_TYPE_BORDER_COLORS, NODE_TYPE_BADGE_CLASSES } from './ui-constants';
export type { CSS_CLASSES as CssClassesType } from './ui-constants';
export type {
  ForgeAct,
  ForgeChapter,
  ForgePage,
} from './narrative';


export type { 
  ForgeGraphDoc,
  ForgeChoice as Choice,
  ForgeStoryletCall as StoryletCall,
  ForgeNode,
  ForgeNodeType,
  ForgeGraphKind,
  ForgeEdgeKind,
  ForgeReactFlowNode as ForgeFlowNode,
  ForgeReactFlowEdge as ForgeFlowEdge,
  ForgeReactFlowJson as ForgeFlowJson,
  ForgeConditionalBlock,
  ForgeCondition,
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
