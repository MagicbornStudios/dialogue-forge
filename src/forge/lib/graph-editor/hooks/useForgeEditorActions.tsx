// src/components/GraphEditors/hooks/useForgeEditorActions.ts
import * as React from 'react';
import { createContext, useContext } from 'react';
import type { ForgeCommand } from './forge-commands';
import { FORGE_COMMAND } from './forge-commands';
import type { ForgeNodeType, ForgeNode } from '@/forge/types/forge-graph';
import type { Connection } from 'reactflow';

export interface ForgeEditorActions {
  selectNode: (nodeId: string) => void;
  openNodeEditor: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  patchNode: (nodeId: string, updates: Partial<ForgeNode>) => void;
  createNode: (nodeType: ForgeNodeType, x: number, y: number, autoConnect?: { fromNodeId: string; sourceHandle?: string; fromChoiceIdx?: number; fromBlockIdx?: number }) => void;
  insertNodeOnEdge: (edgeId: string, nodeType: ForgeNodeType, x: number, y: number) => void;
  deleteEdge: (edgeId: string) => void;
  createEdge: (connection: Connection) => void;
}

export function makeForgeEditorActions(dispatch: (cmd: ForgeCommand) => void): ForgeEditorActions {
  return {
    selectNode: (nodeId: string) => dispatch({ type: FORGE_COMMAND.UI.SELECT_NODE, nodeId }),
    openNodeEditor: (nodeId: string) => dispatch({ type: FORGE_COMMAND.UI.OPEN_NODE_EDITOR, nodeId }),
    deleteNode: (nodeId: string) => dispatch({ type: FORGE_COMMAND.GRAPH.NODE_DELETE, nodeId }),
    patchNode: (nodeId: string, updates: Partial<ForgeNode>) => dispatch({ type: FORGE_COMMAND.GRAPH.NODE_PATCH, nodeId, updates }),
    createNode: (nodeType: ForgeNodeType, x: number, y: number, autoConnect?: { fromNodeId: string; sourceHandle?: string; fromChoiceIdx?: number; fromBlockIdx?: number }) =>
      dispatch({ type: FORGE_COMMAND.GRAPH.NODE_CREATE, nodeType, x, y, autoConnect }),
    insertNodeOnEdge: (edgeId: string, nodeType: ForgeNodeType, x: number, y: number) =>
      dispatch({ type: FORGE_COMMAND.GRAPH.NODE_INSERT_ON_EDGE, edgeId, nodeType, x, y }),
    deleteEdge: (edgeId: string) => dispatch({ type: FORGE_COMMAND.GRAPH.EDGE_DELETE, edgeId }),
    createEdge: (connection: Connection) => dispatch({ type: FORGE_COMMAND.GRAPH.EDGE_CREATE, connection }),
  };
}

const ForgeEditorActionsContext = createContext<ForgeEditorActions | null>(null);

export function ForgeEditorActionsProvider({
  actions,
  children,
}: {
  actions: ForgeEditorActions;
  children: React.ReactNode;
}) {
  return (
    <ForgeEditorActionsContext.Provider value={actions}>
      {children}
    </ForgeEditorActionsContext.Provider>
  );
}

export function useForgeEditorActions(): ForgeEditorActions {
  const actions = useContext(ForgeEditorActionsContext);
  if (!actions) {
    throw new Error('useForgeEditorActions must be used within ForgeEditorActionsProvider');
  }
  return actions;
}
