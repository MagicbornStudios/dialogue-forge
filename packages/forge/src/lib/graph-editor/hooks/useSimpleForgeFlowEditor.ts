// src/forge/lib/graph-editor/hooks/useSimpleForgeFlowEditor.ts
/**
 * Simplified Forge Flow Editor Hook
 * 
 * No draft system - direct graph updates with auto-save.
 * Parent controls debouncing via onChange/onChangeImmediate callbacks.
 * 
 * Replaces useForgeFlowEditorShell for simpler workflows.
 */

import * as React from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
} from 'reactflow';
import { useStore } from 'zustand';

import type { ForgeGraphDoc, ForgeNode, ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_GRAPH_KIND } from '@magicborn/forge/types/forge-graph';
import {
  applyConnection,
  createFlowNode,
  deleteFlowNode,
  insertNodeBetweenEdge,
  removeEdgeAndSemanticLink,
  type LayoutDirection,
} from '@magicborn/forge/lib/utils/forge-flow-helpers';
import { createEmptyForgeGraphDoc } from '@magicborn/shared/utils/forge-graph-helpers';
import { applyLayout, resolveNodeCollisions } from '@magicborn/forge/lib/utils/layout/layout';
import { LAYOUT_CONSTANTS } from '@magicborn/forge/lib/utils/constants';
import type { ForgeEditorSessionStore, EdgeDropMenuState } from './useForgeEditorSession';
import type { ForgeCommand } from './forge-commands';
import { FORGE_COMMAND } from './forge-commands';
import { useEdgeDropBehavior } from './useEdgeDropBehavior';
import { DOM_EVENT_TYPE } from '@magicborn/shared/types';

export type ShellNodeData = {
  node: ForgeNode;
  layoutDirection?: LayoutDirection;

  // highlight/meta
  ui: {
    isDimmed?: boolean;
    isInPath?: boolean;
    isStartNode?: boolean;
    isEndNode?: boolean;
  };
};

function toReactFlowNodes(flowNodes: ForgeGraphDoc['flow']['nodes'], layoutDirection: LayoutDirection): Node<ShellNodeData>[] {
  return flowNodes.map((n) => {
    const d = (n.data ?? {}) as ForgeNode;
    return {
      ...n,
      type: n.type as string,
      data: {
        node: { ...d, id: n.id, type: (n.type as ForgeNodeType) ?? d.type },
        layoutDirection,
      },
      selected: false,
    } as Node<ShellNodeData>;
  });
}

function toReactFlowEdges(flowEdges: ForgeGraphDoc['flow']['edges']): Edge[] {
  return flowEdges.map((e) => ({
    ...e,
    type: (e.type as string) ?? 'default',
  }));
}

export type UseSimpleForgeFlowEditorArgs = {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  /** optional immediate save hook for critical operations */
  onChangeImmediate?: (graph: ForgeGraphDoc) => void;
  reactFlow: ReactFlowInstance;
  sessionStore: ForgeEditorSessionStore;

  /** optional event hooks */
  onNodeAdd?: (node: any) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<ForgeNode>) => void;
  onConnectHook?: (source: string, target: string, sourceHandle?: string) => void;
  onDisconnectHook?: (edgeId: string, source: string, target: string) => void;
};

export function useSimpleForgeFlowEditor(args: UseSimpleForgeFlowEditorArgs) {
  const {
    graph,
    onChange,
    onChangeImmediate,
    reactFlow,
    sessionStore,
    onNodeAdd,
    onNodeDelete,
    onNodeUpdate,
    onConnectHook,
    onDisconnectHook,
  } = args;
  const saveImmediate = onChangeImmediate ?? onChange;

  // Read from session store
  const layoutDirection = useStore(sessionStore, (s) => s.layoutDirection);
  const autoOrganize = useStore(sessionStore, (s) => s.autoOrganize);
  const selectedNodeId = useStore(sessionStore, (s) => s.selectedNodeId);
  const paneContextMenu = useStore(sessionStore, (s) => s.paneContextMenu);
  const edgeDropMenu = useStore(sessionStore, (s) => s.edgeDropMenu);

  // Session store setters for layout
  const setLayoutDirection = React.useCallback(
    (dir: LayoutDirection) => sessionStore.setState({ layoutDirection: dir }),
    [sessionStore]
  );

  // Session store setters
  const setSelectedNodeId = React.useCallback((nodeId: string | null) => {
    sessionStore.getState().selectedNodeId !== nodeId && sessionStore.setState({ selectedNodeId: nodeId });
  }, [sessionStore]);

  const setPaneContextMenu = React.useCallback((menu: { screenX: number; screenY: number; flowX: number; flowY: number } | null) => {
    sessionStore.getState().paneContextMenu !== menu && sessionStore.setState({ paneContextMenu: menu });
  }, [sessionStore]);

  const setEdgeDropMenu = React.useCallback((menu: EdgeDropMenuState) => {
    sessionStore.getState().edgeDropMenu !== menu && sessionStore.setState({ edgeDropMenu: menu });
  }, [sessionStore]);

  const fallbackGraph = React.useMemo(() => {
    return createEmptyForgeGraphDoc({
      projectId: graph?.project ?? 0,
      kind: graph?.kind ?? FORGE_GRAPH_KIND.NARRATIVE,
      title: graph?.title ?? 'New Graph',
      graphId: graph?.id ?? undefined,
    });
  }, [graph]);

  const effectiveGraph: ForgeGraphDoc = graph ?? fallbackGraph;

  // local RF state (from flow)
  const [nodes, setNodes] = React.useState<Node<ShellNodeData>[]>(() =>
    toReactFlowNodes(effectiveGraph.flow.nodes, layoutDirection)
  );
  const [edges, setEdges] = React.useState<Edge[]>(() => toReactFlowEdges(effectiveGraph.flow.edges));

  // For connect-start/end behavior
  const connectingRef = React.useRef<{
    fromNodeId: string;
    sourceHandle?: string;
    fromChoiceIdx?: number;
    fromBlockIdx?: number;
  } | null>(null);

  // Track last mouse position as fallback for onConnectEnd
  const lastMousePositionRef = React.useRef<{ x: number; y: number } | null>(null);

  // React Flow wrapper ref for behaviors
  const reactFlowWrapperRef = React.useRef<HTMLDivElement>(null);
  const lastWheelClickRef = React.useRef<number>(0);

  // Avoid full re-init when we do a direct node data update in ReactFlow
  const directUpdateRef = React.useRef<string | null>(null);
  const [nodeDraftsById, setNodeDraftsById] = React.useState<Record<string, Partial<ForgeNode>>>({});

  // Re-sync local RF state if graph changes externally
  React.useEffect(() => {
    if (directUpdateRef.current) {
      directUpdateRef.current = null;
      return;
    }
    setNodes(toReactFlowNodes(effectiveGraph.flow.nodes, layoutDirection));
    setEdges(toReactFlowEdges(effectiveGraph.flow.edges));
    setNodeDraftsById({});
  }, [effectiveGraph, layoutDirection]);

  // End nodes (semantic no outgoing links)
  const endNodeIds = React.useMemo(() => {
    const ends = new Set<string>();
    for (const n of effectiveGraph.flow.nodes) {
      const d = (n.data ?? {}) as ForgeNode;
      const hasNext = !!d.defaultNextNodeId;
      const hasChoices = d.choices?.some((c) => !!c.nextNodeId) ?? false;
      const hasBlocks = d.conditionalBlocks?.some((b) => !!b.nextNodeId) ?? false;
      if (!hasNext && !hasChoices && !hasBlocks) ends.add(n.id);
    }
    return ends;
  }, [effectiveGraph]);

  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId) return null;
    const n = effectiveGraph.flow.nodes.find((x) => x.id === selectedNodeId);
    if (!n) return null;
    const d = (n.data ?? {}) as ForgeNode;
    const baseNode = {
      ...d,
      id: n.id,
      type: (n.type as ForgeNodeType) ?? d.type,
      choices: d.choices ? d.choices.map((c) => ({ ...c })) : undefined,
      setFlags: d.setFlags ? [...d.setFlags] : undefined,
      conditionalBlocks: d.conditionalBlocks
        ? d.conditionalBlocks.map((b) => ({ ...b, condition: b.condition ? [...b.condition] : undefined }))
        : undefined,
    } as ForgeNode;
    const draft = nodeDraftsById[selectedNodeId];
    if (!draft) return baseNode;
    return {
      ...baseNode,
      ...draft,
      choices: draft.choices ?? baseNode.choices,
      setFlags: draft.setFlags ?? baseNode.setFlags,
      conditionalBlocks: draft.conditionalBlocks ?? baseNode.conditionalBlocks,
    };
  }, [selectedNodeId, effectiveGraph, nodeDraftsById]);

  const handleUpdateNode = React.useCallback(
    (nodeId: string, updates: Partial<ForgeNode>) => {
      const exists = effectiveGraph.flow.nodes.some((n) => n.id === nodeId);
      if (!exists) return;

      // Direct RF node data update for common field edits
      const isSimpleUpdate = Object.keys(updates).every((k) =>
        ['speaker', 'content', 'characterId', 'setFlags', 'storyletCall', 'label', 'actId', 'chapterId', 'pageId', 'choices', 'conditionalBlocks'].includes(k)
      );

      if (isSimpleUpdate && reactFlow) {
        const all = reactFlow.getNodes() as Node<ShellNodeData>[];
        const found = all.find((n) => n.id === nodeId);
        if (found) {
          directUpdateRef.current = nodeId;
          const nextNodeData: ForgeNode = { ...(found.data?.node ?? ({} as ForgeNode)), ...updates, id: nodeId };
          const updated = all.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data ?? {}), node: nextNodeData } } : n));
          reactFlow.setNodes(updated);
          setNodes(updated);
        }
      }
      setNodeDraftsById((prev) => ({
        ...prev,
        [nodeId]: { ...(prev[nodeId] ?? {}), ...updates },
      }));

      const nextGraph: ForgeGraphDoc = {
        ...effectiveGraph,
        flow: {
          ...effectiveGraph.flow,
          nodes: effectiveGraph.flow.nodes.map((n) => {
            if (n.id !== nodeId) return n;
            const d = (n.data ?? {}) as ForgeNode;
            return { ...n, data: { ...d, ...updates, id: nodeId } };
          }),
        },
      };

      onChange(nextGraph);
      onNodeUpdate?.(nodeId, updates);
    },
    [effectiveGraph, onChange, onNodeUpdate, reactFlow]
  );

  const handleDeleteNode = React.useCallback(
    (nodeId: string) => {
      try {
        const next = deleteFlowNode(effectiveGraph, nodeId);
        saveImmediate(next);
        onNodeDelete?.(nodeId);
        setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
        setNodeDraftsById((prev) => {
          if (!prev[nodeId]) return prev;
          const { [nodeId]: _removed, ...rest } = prev;
          return rest;
        });
      } catch (e: any) {
        alert(e?.message ?? 'Failed to delete node.');
      }
    },
    [effectiveGraph, saveImmediate, onNodeDelete, selectedNodeId, setSelectedNodeId]
  );

  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      setNodes((prev) => {
        const nextNodes = applyNodeChanges(changes, prev) as Node<ShellNodeData>[];

        const moved = changes.some((c) => c.type === 'position' && !!(c as any).position);
        if (moved) {
          const nextGraph: ForgeGraphDoc = {
            ...effectiveGraph,
            flow: {
              ...effectiveGraph.flow,
              nodes: effectiveGraph.flow.nodes.map((fn) => {
                const rfNode = nextNodes.find((n) => n.id === fn.id);
                if (rfNode?.position) {
                  return { ...fn, position: { x: rfNode.position.x, y: rfNode.position.y } };
                }
                return fn;
              }),
            },
          };
          onChange(nextGraph);
        }

        return nextNodes;
      });
    },
    [effectiveGraph, onChange]
  );

  const onNodesDelete = React.useCallback(
    (deleted: Node[]) => {
      let next = effectiveGraph;
      for (const n of deleted) {
        if (n.id === next.startNodeId) continue;
        next = deleteFlowNode(next, n.id);
        onNodeDelete?.(n.id);
        if (selectedNodeId === n.id) {
          setSelectedNodeId(null);
        }
      }
      setNodeDraftsById((prev) => {
        if (!deleted.length) return prev;
        const nextDrafts = { ...prev };
        deleted.forEach((n) => {
          delete nextDrafts[n.id];
        });
        return nextDrafts;
      });
      saveImmediate(next);
    },
    [effectiveGraph, saveImmediate, onNodeDelete, selectedNodeId, setSelectedNodeId]
  );

  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => {
      setEdges((prev) => applyEdgeChanges(changes, prev));

      // semantic cleanup for removed edges
      const removals = changes.filter((c) => c.type === 'remove');
      if (!removals.length) return;

      let next = effectiveGraph;
      for (const r of removals) {
        const edgeId = (r as any).id as string;
        const edge = effectiveGraph.flow.edges.find((e) => e.id === edgeId);
        if (edge) onDisconnectHook?.(edge.id, edge.source, edge.target);
        next = removeEdgeAndSemanticLink(next, edgeId);
      }
      saveImmediate(next);
    },
    [effectiveGraph, saveImmediate, onDisconnectHook]
  );

  const onEdgesDelete = React.useCallback(
    (deletedEdges: Edge[]) => {
      let next = effectiveGraph;
      for (const e of deletedEdges) {
        onDisconnectHook?.(e.id, e.source, e.target);
        next = removeEdgeAndSemanticLink(next, e.id);
      }
      saveImmediate(next);
    },
    [effectiveGraph, saveImmediate, onDisconnectHook]
  );

  // Track mouse position for edge drop menu fallback
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        lastMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener(DOM_EVENT_TYPE.MOUSE_MOVE, handleMouseMove);
    window.addEventListener(DOM_EVENT_TYPE.TOUCH_MOVE, handleTouchMove);

    return () => {
      window.removeEventListener(DOM_EVENT_TYPE.MOUSE_MOVE, handleMouseMove);
      window.removeEventListener(DOM_EVENT_TYPE.TOUCH_MOVE, handleTouchMove as any);
    };
  }, []);

  // React Flow behaviors: double-click and middle-click to fit view
  React.useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) {
        return;
      }

      if (reactFlow) {
        reactFlow.fitView({ padding: 0.2, duration: 500 });
      }
    };

    const container = reactFlowWrapperRef.current;
    if (container) {
      container.addEventListener(DOM_EVENT_TYPE.DBL_CLICK, handleDoubleClick);
      return () => {
        container.removeEventListener(DOM_EVENT_TYPE.DBL_CLICK, handleDoubleClick);
      };
    }
  }, [reactFlow]);

  // Track mouse wheel clicks for double-click detection
  React.useEffect(() => {
    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.button === 1) {
        // Middle mouse button (wheel)
        const now = Date.now();
        if (now - lastWheelClickRef.current < 300) {
          mouseEvent.preventDefault();
          if (reactFlow) {
            reactFlow.fitView({ padding: 0.2, duration: 500 });
          }
          lastWheelClickRef.current = 0;
        } else {
          lastWheelClickRef.current = now;
        }
      }
    };

    const container = document.querySelector('.react-flow');
    if (container) {
      container.addEventListener(DOM_EVENT_TYPE.MOUSE_DOWN, handleMouseDown);
      return () => {
        container.removeEventListener(DOM_EVENT_TYPE.MOUSE_DOWN, handleMouseDown);
      };
    }
  }, [reactFlow]);


  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((prev) => addEdge(connection, prev));
      const nextGraph = applyConnection(effectiveGraph, connection);
      saveImmediate(nextGraph);
      setEdges(toReactFlowEdges(nextGraph.flow.edges));
      onConnectHook?.(connection.source, connection.target, connection.sourceHandle ?? undefined);
      setEdgeDropMenu(null);
      edgeDropConnectingRef.current = null;
    },
    [effectiveGraph, saveImmediate, onConnectHook, setEdgeDropMenu]
  );
  
  const { onConnectStart, onConnectEnd, connectingRef: edgeDropConnectingRef } = useEdgeDropBehavior({ reactFlow, nodes, onAutoConnect: onConnect });

  const onPaneContextMenu = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const point = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setPaneContextMenu({ screenX: event.clientX, screenY: event.clientY, flowX: point.x, flowY: point.y });
    },
    [reactFlow, setPaneContextMenu]
  );

  const onPaneClick = React.useCallback(() => {
    setSelectedNodeId(null);
    setPaneContextMenu(null);
    setEdgeDropMenu(null);
  }, [setSelectedNodeId, setPaneContextMenu, setEdgeDropMenu]);

  const handleAddNode = React.useCallback(
    (
      type: ForgeNodeType,
      x: number,
      y: number,
      autoConnect?: { fromNodeId: string; sourceHandle?: string; fromChoiceIdx?: number; fromBlockIdx?: number }
    ) => {
      const newId = `${type}_${Date.now()}`;
      const newFlowNode = createFlowNode(type, newId, x, y);

      const isFirstNode = effectiveGraph.flow.nodes.length === 0;
      
      let next: ForgeGraphDoc = {
        ...effectiveGraph,
        // Auto-set first node as start node if graph is empty
        startNodeId: isFirstNode ? newId : (effectiveGraph.startNodeId || newId),
        // Auto-set first node as end node if graph is empty
        endNodeIds: isFirstNode ? [{ nodeId: newId }] : effectiveGraph.endNodeIds,
        flow: { ...effectiveGraph.flow, nodes: [...effectiveGraph.flow.nodes, newFlowNode] },
      };

      if (autoConnect) {
        const connection: Connection = {
          source: autoConnect.fromNodeId,
          target: newId,
          sourceHandle: autoConnect.sourceHandle ?? 'next',
          targetHandle: null,
        };
        next = applyConnection(next, connection);
      }

      saveImmediate(next);
      onNodeAdd?.(newFlowNode);
      setSelectedNodeId(newId);
      setPaneContextMenu(null);
      setEdgeDropMenu(null);
    },
    [effectiveGraph, saveImmediate, onNodeAdd, setPaneContextMenu, setEdgeDropMenu, setSelectedNodeId]
  );

  const handleInsertNode = React.useCallback(
    (type: ForgeNodeType, edgeId: string, x: number, y: number) => {
      const newId = `${type}_${Date.now()}`;
      const next = insertNodeBetweenEdge(effectiveGraph, edgeId, type, newId, x, y);
      saveImmediate(next);
      setSelectedNodeId(newId);
    },
    [effectiveGraph, saveImmediate, setSelectedNodeId]
  );

  // Command dispatcher
  const dispatch = React.useCallback(
    (cmd: ForgeCommand) => {
      switch (cmd.type) {
        case FORGE_COMMAND.UI.SELECT_NODE:
          setSelectedNodeId(cmd.nodeId);
          break;
        case FORGE_COMMAND.UI.OPEN_NODE_EDITOR:
          setSelectedNodeId(cmd.nodeId);
          break;
        case FORGE_COMMAND.UI.SET_PANE_CONTEXT_MENU:
          setPaneContextMenu(cmd.menu);
          break;
        case FORGE_COMMAND.UI.CLEAR_PANE_CONTEXT_MENU:
          setPaneContextMenu(null);
          break;
        case FORGE_COMMAND.UI.SET_EDGE_DROP_MENU:
          setEdgeDropMenu(cmd.menu);
          break;
        case FORGE_COMMAND.UI.CLEAR_EDGE_DROP_MENU:
          setEdgeDropMenu(null);
          break;
        case FORGE_COMMAND.GRAPH.NODE_CREATE:
          handleAddNode(cmd.nodeType, cmd.x, cmd.y, cmd.autoConnect);
          break;
        case FORGE_COMMAND.GRAPH.NODE_PATCH:
          handleUpdateNode(cmd.nodeId, cmd.updates);
          break;
        case FORGE_COMMAND.GRAPH.NODE_DELETE:
          handleDeleteNode(cmd.nodeId);
          break;
        case FORGE_COMMAND.GRAPH.NODE_INSERT_ON_EDGE:
          handleInsertNode(cmd.nodeType, cmd.edgeId, cmd.x, cmd.y);
          break;
        case FORGE_COMMAND.GRAPH.EDGE_DELETE: {
          const next = removeEdgeAndSemanticLink(effectiveGraph, cmd.edgeId);
          saveImmediate(next);
          break;
        }
        case FORGE_COMMAND.GRAPH.EDGE_CREATE:
          onConnect(cmd.connection);
          break;
        case FORGE_COMMAND.GRAPH.SET_START_NODE: {
          const next = {
            ...effectiveGraph,
            startNodeId: cmd.nodeId,
          };
          saveImmediate(next);
          break;
        }
      }
    },
    [
      effectiveGraph,
      saveImmediate,
      setSelectedNodeId,
      setPaneContextMenu,
      setEdgeDropMenu,
      handleAddNode,
      handleUpdateNode,
      handleDeleteNode,
      handleInsertNode,
      onConnect,
    ]
  );

  // Auto layout handler
  const handleAutoLayout = React.useCallback(
    (direction?: LayoutDirection) => {
      const dir = direction || layoutDirection;
      if (direction) setLayoutDirection(direction);

      const result = applyLayout(effectiveGraph, 'dagre', { direction: dir });
      saveImmediate(result.graph);

      setTimeout(() => reactFlow?.fitView({ padding: 0.2, duration: 500 }), 100);
    },
    [layoutDirection, saveImmediate, reactFlow, effectiveGraph, setLayoutDirection]
  );

  // Node interaction handlers
  const onNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onNodeDoubleClick = React.useCallback(
    (_event: React.MouseEvent, node: Node) => {
      reactFlow?.setCenter(node.position.x + 110, node.position.y + 60, {
        zoom: 1.5,
        duration: 500,
      });
    },
    [reactFlow]
  );

  const onNodeDragStop = React.useCallback(
    (_event: React.MouseEvent, _node: Node) => {
      if (autoOrganize) return;

      const collisionResolved = resolveNodeCollisions(effectiveGraph, {
        maxIterations: LAYOUT_CONSTANTS.MAX_ITERATIONS,
        overlapThreshold: LAYOUT_CONSTANTS.OVERLAP_THRESHOLD,
        margin: LAYOUT_CONSTANTS.DEFAULT_MARGIN,
      });

      const changed = (collisionResolved.flow?.nodes ?? []).some((n: any) => {
        const orig = effectiveGraph.flow.nodes.find((x) => x.id === n.id);
        return orig && (orig.position?.x !== n.position?.x || orig.position?.y !== n.position?.y);
      });

      if (changed) onChange(collisionResolved);
    },
    [autoOrganize, onChange, effectiveGraph]
  );

  return {
    effectiveGraph,

    nodes,
    setNodes,
    edges,
    setEdges,

    selectedNodeId,
    setSelectedNodeId,
    selectedNode,

    endNodeIds,

    paneContextMenu,
    setPaneContextMenu,

    edgeDropMenu,
    setEdgeDropMenu,

    connectingRef,
    reactFlowWrapperRef,

    handleUpdateNode,
    handleDeleteNode,

    onNodesChange,
    onNodesDelete,
    onEdgesChange,
    onEdgesDelete,

    onConnect,
    onConnectStart,
    onConnectEnd,

    onPaneContextMenu,
    onPaneClick,

    handleAddNode,
    handleInsertNode,

    handleAutoLayout,
    onNodeClick,
    onNodeDoubleClick,
    onNodeDragStop,

    dispatch,
  };
}
