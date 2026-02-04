// src/components/GraphEditors/hooks/forge-commands.ts
import type { ForgeNodeType, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { Connection } from 'reactflow';
import type { EdgeDropMenuState } from './useForgeEditorSession';

export const FORGE_COMMAND = {
  UI: {
    SELECT_NODE: 'UI.SELECT_NODE',
    OPEN_NODE_EDITOR: 'UI.OPEN_NODE_EDITOR',
    SET_PANE_CONTEXT_MENU: 'UI.SET_PANE_CONTEXT_MENU',
    CLEAR_PANE_CONTEXT_MENU: 'UI.CLEAR_PANE_CONTEXT_MENU',
    SET_EDGE_DROP_MENU: 'UI.SET_EDGE_DROP_MENU',
    CLEAR_EDGE_DROP_MENU: 'UI.CLEAR_EDGE_DROP_MENU',
  },
  GRAPH: {
    NODE_CREATE: 'GRAPH.NODE_CREATE',
    NODE_PATCH: 'GRAPH.NODE_PATCH',
    NODE_DELETE: 'GRAPH.NODE_DELETE',
    NODE_INSERT_ON_EDGE: 'GRAPH.NODE_INSERT_ON_EDGE',
    EDGE_DELETE: 'GRAPH.EDGE_DELETE',
    EDGE_CREATE: 'GRAPH.EDGE_CREATE',
    SET_START_NODE: 'GRAPH.SET_START_NODE',
  },
  WORKSPACE: {
    RENAME_GRAPH: 'WORKSPACE.RENAME_GRAPH',
    OPEN_COMMAND_BAR: 'WORKSPACE.OPEN_COMMAND_BAR',
  },
} as const;

export type ForgeCommand =
  | { type: typeof FORGE_COMMAND.UI.SELECT_NODE; nodeId: string }
  | { type: typeof FORGE_COMMAND.UI.OPEN_NODE_EDITOR; nodeId: string }
  | { type: typeof FORGE_COMMAND.UI.SET_PANE_CONTEXT_MENU; menu: { screenX: number; screenY: number; flowX: number; flowY: number } }
  | { type: typeof FORGE_COMMAND.UI.CLEAR_PANE_CONTEXT_MENU }
  | { type: typeof FORGE_COMMAND.UI.SET_EDGE_DROP_MENU; menu: EdgeDropMenuState }
  | { type: typeof FORGE_COMMAND.UI.CLEAR_EDGE_DROP_MENU }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_CREATE; nodeType: ForgeNodeType; x: number; y: number; autoConnect?: { fromNodeId: string; sourceHandle?: string; fromChoiceIdx?: number; fromBlockIdx?: number } }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_PATCH; nodeId: string; updates: Partial<ForgeNode> }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_DELETE; nodeId: string }
  | { type: typeof FORGE_COMMAND.GRAPH.NODE_INSERT_ON_EDGE; edgeId: string; nodeType: ForgeNodeType; x: number; y: number }
  | { type: typeof FORGE_COMMAND.GRAPH.EDGE_DELETE; edgeId: string }
  | { type: typeof FORGE_COMMAND.GRAPH.EDGE_CREATE; connection: Connection }
  | { type: typeof FORGE_COMMAND.GRAPH.SET_START_NODE; nodeId: string }
  | { type: typeof FORGE_COMMAND.WORKSPACE.RENAME_GRAPH; graphId: string }
  | { type: typeof FORGE_COMMAND.WORKSPACE.OPEN_COMMAND_BAR };
