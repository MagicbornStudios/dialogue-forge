// src/components/forge/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx
/**
 * Forge Storylet Graph Editor - React Flow Implementation (flow-first)
 *
 * New paradigm:
 * - Editor is GRAPH-ONLY (no Yarn/Play/export/import).
 * - Minimal props: graph + onChange + optional context data for rendering.
 * - No event callbacks; use dispatch/actions + adapter/subscriptions outside editor.
 * - Editor instance UI state lives in ForgeEditorSessionStore.
 */

import * as React from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  ConnectionLineType,
  BackgroundVariant,
  type Node,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { ForgeGameFlagState } from '@/forge/types/forge-game-state';
import { useFlowPathHighlighting } from '@/forge/lib/graph-editor/hooks/useFlowPathHighlighting';

import {
  edgeStrokeColor,
  type LayoutDirection,
} from '@/forge/lib/utils/forge-flow-helpers';


import { NodeEditor } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NodeEditor';
import { GraphLeftToolbar } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLayoutControls';
import { GraphMiniMap } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphMiniMap';
import { ForgeStoryletGraphEditorPaneContextMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditorPaneContextMenu';

import { CharacterNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/CharacterNode/CharacterNode';
import { PlayerNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PlayerNode/PlayerNode';
import { ConditionalNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalNode';
import { StoryletNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletNode';
import { ChoiceEdge } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PlayerNode/ChoiceEdge';
import { ForgeEdge } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Edges/ForgeEdge';
import { DetourNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/DetourNode';
import { ForgeGraphBreadcrumbs } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/ForgeGraphBreadcrumbs';
import { Network, Focus, FileText, Play } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { cn } from '@/shared/lib/utils';

// EdgeDropMenu components
import { CharacterEdgeDropMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/CharacterNode/CharacterEdgeDropMenu';
import { PlayerEdgeDropMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PlayerNode/PlayerEdgeDropMenu';
import { ConditionalEdgeDropMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalEdgeDropMenu';
import { StoryletEdgeDropMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletEdgeDropMenu';

import type { FlagSchema } from '@/forge/types/flags';
import type { ForgeCharacter } from '@/forge/types/characters';


import type {
  ForgeGraphDoc,
  ForgeNode,
  ForgeNodeType,
  ForgeReactFlowNode,
} from '@/forge/types/forge-graph';

import {
  useForgeFlowEditorShell,
  type ShellNodeData,
} from '@/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';

import {
  createForgeEditorSessionStore,
  ForgeEditorSessionProvider,
  useForgeEditorSession,
  useForgeEditorSessionStore,
} from '@/forge/lib/graph-editor/hooks/useForgeEditorSession';

import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

import {
  ForgeEditorActionsProvider,
  makeForgeEditorActions,
} from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeGraphEditorActions } from '@/forge/copilotkit';

const nodeTypes = {
  CHARACTER: CharacterNode,
  PLAYER: PlayerNode,
  CONDITIONAL: ConditionalNode,
  STORYLET_REF: StoryletNode,
  DETOUR: DetourNode,
} as const;

const edgeTypes = {
  choice: ChoiceEdge,
  default: ForgeEdge,
} as const;

// Registry map for EdgeDropMenu components by node type
const storyletEdgeDropMenuByNodeType: Record<ForgeNodeType, React.ComponentType<any>> = {
  [FORGE_NODE_TYPE.CHARACTER]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.PLAYER]: PlayerEdgeDropMenu,
  [FORGE_NODE_TYPE.CONDITIONAL]: ConditionalEdgeDropMenu,
  [FORGE_NODE_TYPE.STORYLET]: StoryletEdgeDropMenu,

  // Narrative types (not used here but safe fallbacks)
  [FORGE_NODE_TYPE.ACT]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.CHAPTER]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.PAGE]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.DETOUR]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.JUMP]: CharacterEdgeDropMenu,
  [FORGE_NODE_TYPE.END]: CharacterEdgeDropMenu,
};

export interface ForgeStoryletGraphEditorProps {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  className?: string;

  // Rendering context (read-only)
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  gameState?: import('@/forge/types/forge-game-state').ForgeGameState;
  gameStateFlags?: ForgeGameFlagState; // Legacy prop, use gameState instead
}


function ForgeStoryletGraphEditorInternal(props: ForgeStoryletGraphEditorProps) {
  const {
    graph,
    onChange,
    className = '',
    flagSchema,
    characters = {},
    gameState,
    gameStateFlags,
  } = props;
  
  // Use gameState.flags if available, fallback to gameStateFlags for backward compatibility
  const resolvedGameStateFlags = gameState?.flags || gameStateFlags;
  
  // Modal actions from workspace
  const openYarnModal = useForgeWorkspaceStore((s) => s.actions.openYarnModal);
  const openPlayModal = useForgeWorkspaceStore((s) => s.actions.openPlayModal);

  const reactFlow = useReactFlow();

  // Editor focus tracking - click-only, no hover preview
  const setFocusedEditor = useForgeWorkspaceStore((s) => s.actions.setFocusedEditor);
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  const isFocused = focusedEditor === 'storylet';

  const handleClick = React.useCallback(() => {
    setFocusedEditor('storylet');
  }, [setFocusedEditor]);

  // Session store for this editor instance
  const sessionStore = useForgeEditorSessionStore();

  // Read from session store
  const layoutDirection = useForgeEditorSession((s) => s.layoutDirection);
  const autoOrganize = useForgeEditorSession((s) => s.autoOrganize);
  const showPathHighlight = useForgeEditorSession((s) => s.showPathHighlight);
  const showBackEdges = useForgeEditorSession((s) => s.showBackEdges);
  const showMiniMap = useForgeEditorSession((s) => s.showMiniMap);

  const setLayoutDirection = React.useCallback(
    (dir: LayoutDirection) => sessionStore.setState({ layoutDirection: dir }),
    [sessionStore]
  );

  const setAutoOrganize = React.useCallback(
    (value: boolean) => sessionStore.setState({ autoOrganize: value }),
    [sessionStore]
  );

  const setShowPathHighlight = React.useCallback(
    (value: boolean) => sessionStore.setState({ showPathHighlight: value }),
    [sessionStore]
  );

  const setShowBackEdges = React.useCallback(
    (value: boolean) => sessionStore.setState({ showBackEdges: value }),
    [sessionStore]
  );

  const setShowMiniMap = React.useCallback(
    (value: boolean) => sessionStore.setState({ showMiniMap: value }),
    [sessionStore]
  );

  // Shell is still the only “graph mutation” boundary.
  const shell = useForgeFlowEditorShell({
    graph,
    onChange,
    reactFlow,
    sessionStore,
  });

  const setContextNodeType = useForgeWorkspaceStore((s) => s.actions.setContextNodeType);
  const selectedNodeType = shell.selectedNode?.type ?? null;

  React.useEffect(() => {
    setContextNodeType('storylet', selectedNodeType);
  }, [selectedNodeType, setContextNodeType]);

  React.useEffect(() => {
    return () => setContextNodeType('storylet', null);
  }, [setContextNodeType]);

  // Actions from dispatch (node/edge components consume this)
  const actions = React.useMemo(() => makeForgeEditorActions(shell.dispatch), [shell.dispatch]);

  // Register CopilotKit editor actions
  useForgeGraphEditorActions();

  // Path highlighting - only calculate when enabled
  const { edgesToSelectedNode, nodeDepths } = useFlowPathHighlighting(
    showPathHighlight ? shell.selectedNodeId : null,
    shell.effectiveGraph
  );

  // Consume focus requests from workspace
  const pendingFocus = useForgeWorkspaceStore((s) => s.pendingFocusByScope.storylet);
  const clearFocus = useForgeWorkspaceStore((s) => s.actions.clearFocus);
  
  React.useEffect(() => {
    if (pendingFocus && graph && String(graph.id) === pendingFocus.graphId) {
      if (pendingFocus.nodeId) {
        // Focus on specific node
        const node = shell.effectiveGraph.flow.nodes.find((node: ForgeReactFlowNode) => node.id === pendingFocus.nodeId);
        if (node) {
          reactFlow.fitView({ nodes: [{ id: pendingFocus.nodeId }], duration: 300 });
        }
      } else {
        // Just fit view to show all nodes
        reactFlow.fitView({ duration: 300 });
      }
      clearFocus('storylet');
    }
  }, [pendingFocus, graph, reactFlow, clearFocus, shell.effectiveGraph]);


  // Decorate nodes with UI metadata + read-only context (NO callbacks)
  const nodesWithMeta = React.useMemo(() => {
    const hasSelection = shell.selectedNodeId !== null && showPathHighlight;
    const startId = shell.effectiveGraph.startNodeId;

    return shell.nodes.map((n) => {
      const inPath = showPathHighlight && nodeDepths.has(n.id);
      const isSelected = n.id === shell.selectedNodeId;
      const isDimmed = hasSelection && !inPath && !isSelected;

      const flowNode = shell.effectiveGraph.flow.nodes.find((node: ForgeReactFlowNode) => node.id === n.id);
      const nodeType = (flowNode?.type as ForgeNodeType | undefined) ?? (flowNode?.data as any)?.type;

      const isStartNode = n.id === startId;
      const isEndNode = shell.endNodeIds.has(n.id);

      const baseNodeData = (flowNode?.data ?? {}) as ForgeNode;

      return {
        ...n,
        data: {
          ...(n.data ?? {}),
          node: { ...baseNodeData, id: n.id, type: nodeType },
          layoutDirection,
          ui: {
            isDimmed,
            isInPath: inPath,
            isStartNode,
            isEndNode,
          },

          // Read-only context
          flagSchema,
          characters,
          gameStateFlags: resolvedGameStateFlags,
        } as ShellNodeData & {
          flagSchema?: FlagSchema;
          characters?: Record<string, ForgeCharacter>;
          gameStateFlags?: ForgeGameFlagState;
        },
      };
    });
  }, [
    characters,
    flagSchema,
    resolvedGameStateFlags,
    layoutDirection,
    nodeDepths,
    showPathHighlight,
    shell,
  ]);

  // Create lookup maps for nodes and flow nodes (moved outside to avoid hook-in-hook)
  const nodeById = React.useMemo(
    () => new Map<string, typeof shell.nodes[number]>(shell.nodes.map((n) => [n.id, n])),
    [shell.nodes]
  );
  const flowById = React.useMemo(
    () => new Map<string, ForgeReactFlowNode>(shell.effectiveGraph.flow.nodes.map((n: ForgeReactFlowNode) => [n.id, n])),
    [shell.effectiveGraph.flow.nodes]
  );

  // Decorate edges with UI metadata (NO callbacks)
  const edgesWithMeta = React.useMemo(() => {
    const hasSelection = showPathHighlight && shell.selectedNodeId !== null;

    return shell.edges.map((e) => {
      const sourceRF = nodeById.get(e.source);
      const targetRF = nodeById.get(e.target);
      const sourceFlow = flowById.get(e.source);

      const sourceType = (sourceFlow?.type as string | undefined) ?? ((sourceFlow as ForgeReactFlowNode)?.data as ForgeNode)?.type;

      const isBackEdge =
        !!showBackEdges &&
        !!sourceRF &&
        !!targetRF &&
        (layoutDirection === 'TB'
          ? targetRF.position.y < sourceRF.position.y
          : targetRF.position.x < sourceRF.position.x);

      const isInPath = edgesToSelectedNode.has(e.id);
      const isDimmed = hasSelection && !isInPath;

      const stroke = edgeStrokeColor(e as any, sourceType);

      const insertElementTypes =
        e.type === 'choice'
          ? [
              { type: FORGE_NODE_TYPE.CHARACTER, label: 'Character Node' },
              { type: FORGE_NODE_TYPE.CONDITIONAL, label: 'Conditional Node' },
            ]
          : [
              { type: FORGE_NODE_TYPE.CHARACTER, label: 'Character Node' },
              { type: FORGE_NODE_TYPE.PLAYER, label: 'Player Node' },
              { type: FORGE_NODE_TYPE.CONDITIONAL, label: 'Conditional Node' },
            ];

      const sourceFlowNode = sourceFlow as ForgeReactFlowNode | undefined;

      return {
        ...e,
        style: {
          ...(e.style ?? {}),
          ...(stroke ? { stroke } : {}),
          strokeWidth: isInPath ? 4 : 3,
          opacity: isDimmed ? 0.4 : isInPath ? 1 : 0.9,
          strokeDasharray: isBackEdge ? '8 4' : undefined,
        },
        data: {
          ...(e.data ?? {}),
          sourceType,
          isInPathToSelected: isInPath,
          isBackEdge,
          isDimmed,
          insertElementTypes,
          sourceNode: sourceFlowNode,
        },
      } as any;
    });
  }, [edgesToSelectedNode, layoutDirection, showBackEdges, showPathHighlight, shell, nodeById, flowById]);

  return (
    <ForgeEditorActionsProvider actions={actions}>
      <div 
        className={cn(
          "dialogue-graph-editor w-full h-full flex flex-col",
          className
        )}
        onClick={handleClick}
      >
        {/* Toolbar with breadcrumbs and view toggles */}
        <div className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 border-t-1 bg-df-editor-bg flex-shrink-0 transition-colors",
          isFocused ? "border-t-[var(--color-df-edge-choice-1)]" : "border-t-df-control-border"
        )}>
          <div className="flex items-center gap-2">
            <ForgeGraphBreadcrumbs scope="storylet" />
            {isFocused && (
              <Focus size={14} style={{ color: 'var(--color-df-edge-choice-1)' }} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openYarnModal}
              className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-1.5 text-xs text-df-text-secondary hover:text-df-text-primary transition"
              title="View Yarn"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={openPlayModal}
              className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-1.5 text-xs text-df-text-secondary hover:text-df-text-primary transition"
              title="Play"
            >
              <Play className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Graph editor */}
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative w-full h-full" ref={shell.reactFlowWrapperRef} style={{ minHeight: 0 }}>
            <ReactFlow
              nodes={nodesWithMeta}
              edges={edgesWithMeta}
              nodeTypes={nodeTypes as any}
              edgeTypes={edgeTypes as any}
              onNodesChange={shell.onNodesChange}
              onEdgesChange={shell.onEdgesChange}
              onNodesDelete={shell.onNodesDelete}
              onEdgesDelete={shell.onEdgesDelete}
              onNodeDragStop={shell.onNodeDragStop}
              onConnect={shell.onConnect}
              onConnectStart={shell.onConnectStart}
              onConnectEnd={shell.onConnectEnd}
              onNodeClick={shell.onNodeClick}
              onNodeDoubleClick={shell.onNodeDoubleClick}
              onPaneContextMenu={shell.onPaneContextMenu}
              onPaneClick={shell.onPaneClick}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const nodeType = event.dataTransfer.getData('application/reactflow') as ForgeNodeType;
                
                // Validate node type is allowed for storylet graphs
                const allowedTypes: ForgeNodeType[] = [
                  FORGE_NODE_TYPE.CHARACTER,
                  FORGE_NODE_TYPE.PLAYER,
                  FORGE_NODE_TYPE.CONDITIONAL,
                  FORGE_NODE_TYPE.STORYLET,
                  FORGE_NODE_TYPE.DETOUR,
                ];
                
                if (!nodeType || !allowedTypes.includes(nodeType)) {
                  return;
                }
                
                const position = reactFlow.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                
                actions.createNode(nodeType, position.x, position.y);
              }}
              fitView
              className="bg-df-canvas-bg"
              style={{
                background:
                  'radial-gradient(circle, var(--color-df-canvas-grid) 1px, var(--color-df-canvas-bg) 1px)',
                backgroundSize: '20px 20px',
              }}
              defaultEdgeOptions={{ type: 'default' }}
              connectionLineType={ConnectionLineType.SmoothStep}
              snapToGrid={false}
              nodesConnectable
              elementsSelectable
              selectionOnDrag
              panOnDrag
              panOnScroll
              zoomOnScroll
              zoomOnPinch
              preventScrolling={false}
              zoomOnDoubleClick={false}
              minZoom={0.1}
              maxZoom={3}
              deleteKeyCode={['Delete', 'Backspace']}
              tabIndex={0}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a2e" />

              <GraphMiniMap showMiniMap={showMiniMap} />

              <GraphLeftToolbar
                layoutStrategy="dagre"
                showMiniMap={showMiniMap}
                onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
              />

              <GraphLayoutControls
                autoOrganize={autoOrganize}
                onToggleAutoOrganize={() => {
                  const next = !autoOrganize;
                  setAutoOrganize(next);
                  if (next) shell.handleAutoLayout();
                }}
                layoutDirection={layoutDirection}
                onLayoutDirectionChange={(dir) => {
                  setLayoutDirection(dir);
                  shell.handleAutoLayout(dir);
                }}
                onApplyLayout={shell.handleAutoLayout}
                showPathHighlight={showPathHighlight}
                onTogglePathHighlight={() => setShowPathHighlight(!showPathHighlight)}
                showBackEdges={showBackEdges}
                onToggleBackEdges={() => setShowBackEdges(!showBackEdges)}
                onGoToStart={() => {
                  if (!shell.effectiveGraph.startNodeId) return;
                  shell.setSelectedNodeId(shell.effectiveGraph.startNodeId);
                  const start = shell.nodes.find((n) => n.id === shell.effectiveGraph.startNodeId);
                  if (start && reactFlow) {
                    reactFlow.setCenter(start.position.x + 110, start.position.y + 60, {
                      zoom: 1,
                      duration: 500,
                    });
                  }
                }}
                onGoToEnd={() => {
                  const arr = Array.from(shell.endNodeIds);
                  if (!arr.length) return;
                  const curIdx = shell.selectedNodeId ? arr.indexOf(shell.selectedNodeId) : -1;
                  const nextId = arr[(curIdx + 1) % arr.length];
                  shell.setSelectedNodeId(nextId);
                  const end = shell.nodes.find((n) => n.id === nextId);
                  if (end && reactFlow) {
                    reactFlow.setCenter(end.position.x + 110, end.position.y + 60, {
                      zoom: 1,
                      duration: 500,
                    });
                  }
                }}
                endNodeCount={shell.endNodeIds.size}
              />

              {shell.paneContextMenu && (
                <ForgeStoryletGraphEditorPaneContextMenu
                  x={shell.paneContextMenu.screenX}
                  y={shell.paneContextMenu.screenY}
                  graphX={shell.paneContextMenu.flowX}
                  graphY={shell.paneContextMenu.flowY}
                  onAddNode={(type, x, y) => actions.createNode(type as ForgeNodeType, x, y)}
                  onClose={() => shell.setPaneContextMenu(null)}
                />
              )}

              {shell.edgeDropMenu &&
                (() => {
                  const sourceNode = shell.effectiveGraph.flow.nodes.find(
                    (n) => n.id === shell.edgeDropMenu!.fromNodeId
                  );
                  
                  // Try multiple ways to get node type
                  let sourceNodeType: ForgeNodeType = FORGE_NODE_TYPE.CHARACTER;
                  if (sourceNode) {
                    sourceNodeType = (sourceNode.type as ForgeNodeType) ?? 
                                    ((sourceNode.data as any)?.type as ForgeNodeType) ?? 
                                    FORGE_NODE_TYPE.CHARACTER;
                  }

                  // Debug logging (temporary)
                  console.log('[EdgeDrop] Rendering menu', {
                    fromNodeId: shell.edgeDropMenu.fromNodeId,
                    sourceNode: sourceNode ? { id: sourceNode.id, type: sourceNode.type } : null,
                    sourceNodeType,
                    hasMenuComponent: !!storyletEdgeDropMenuByNodeType[sourceNodeType],
                    availableTypes: Object.keys(storyletEdgeDropMenuByNodeType),
                  });

                  const MenuComponent = storyletEdgeDropMenuByNodeType[sourceNodeType];

                  if (!MenuComponent) {
                    console.warn('[EdgeDrop] No menu component found for node type:', sourceNodeType);
                    return null;
                  }

                  return (
                    <MenuComponent
                      screenX={shell.edgeDropMenu.screenX}
                      screenY={shell.edgeDropMenu.screenY}
                      flowX={shell.edgeDropMenu.flowX}
                      flowY={shell.edgeDropMenu.flowY}
                      fromNodeId={shell.edgeDropMenu.fromNodeId}
                      fromChoiceIdx={shell.edgeDropMenu.fromChoiceIdx}
                      fromBlockIdx={shell.edgeDropMenu.fromBlockIdx}
                      sourceHandle={shell.edgeDropMenu.sourceHandle}
                      edgeId={shell.edgeDropMenu.edgeId}
                      onClose={() => {
                        shell.setEdgeDropMenu(null);
                        shell.connectingRef.current = null;
                      }}
                    />
                  );
                })()}
            </ReactFlow>
          </div>

          {/* NodeEditor should use actions internally (no callback soup). */}
          {shell.selectedNode && (
            <NodeEditor
              node={shell.selectedNode}
              graph={shell.effectiveGraph as ForgeGraphDoc}
              characters={characters}
              flagSchema={flagSchema}
              onClose={() => shell.setSelectedNodeId(null)}
              onUpdate={(updates) => {
                if (shell.selectedNode?.id) {
                  actions.patchNode(shell.selectedNode.id, updates);
                }
              }}
              onDelete={() => {
                if (shell.selectedNode?.id) {
                  actions.deleteNode(shell.selectedNode.id);
                }
              }}
            />
          )}
        </div>
      </div>
    </ForgeEditorActionsProvider>
  );
}

export function ForgeStoryletGraphEditor(props: ForgeStoryletGraphEditorProps) {
  // Session store is per editor instance and owns editor UI state.
  const sessionStoreRef = React.useRef(
    createForgeEditorSessionStore({
      layoutDirection: 'TB',
      autoOrganize: false,
      showPathHighlight: true,
      showBackEdges: true,
      showMiniMap: true,
    })
  );

  return (
    <ReactFlowProvider>
      <ForgeEditorSessionProvider store={sessionStoreRef.current}>
        <ForgeStoryletGraphEditorInternal {...props} />
      </ForgeEditorSessionProvider>
    </ReactFlowProvider>
  );
}
