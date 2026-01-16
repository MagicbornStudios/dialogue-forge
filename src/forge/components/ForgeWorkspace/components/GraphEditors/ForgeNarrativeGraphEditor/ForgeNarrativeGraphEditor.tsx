// src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx
/**
 * Forge Narrative Graph Editor - React Flow Implementation (flow-first)
 *
 * Source of truth: ForgeGraphDoc.flow (nodes[] + edges[])
 * No NARRATIVE_ELEMENT usage in editor logic.
 */

import * as React from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  ConnectionLineType,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowPathHighlighting } from '@/forge/lib/graph-editor/hooks/useFlowPathHighlighting';
import { type LayoutDirection } from '@/forge/lib/utils/forge-flow-helpers';

import { applyLayout } from '@/forge/lib/utils/layout/layout';
import { GraphMiniMap } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphMiniMap';

import { ActNode } from '../shared/Nodes/components/ActNode/ActNode';
import { ChapterNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ChapterNode/ChapterNode';
import { PageNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PageNode/PageNode';
import { DetourNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/DetourNode';
import { StoryletNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletNode';
import { ForgeEdge } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Edges/ForgeEdge';
import { FileText, Focus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import type { ForgeGraphDoc, ForgeNode, ForgeNodeType, ForgeReactFlowNode } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

import { useForgeFlowEditorShell, type ShellNodeData } from '@/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';
import { createForgeEditorSessionStore, ForgeEditorSessionProvider, useForgeEditorSession, useForgeEditorSessionStore } from '@/forge/lib/graph-editor/hooks/useForgeEditorSession';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeEditorActionsProvider, makeForgeEditorActions, useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeGraphEditorActions } from '@/forge/copilotkit';
import { NarrativeGraphEditorPaneContextMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeNarrativeGraphEditor/NarrativeGraphEditorPaneContextMenu';
import { NARRATIVE_FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { ForgeGraphBreadcrumbs } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/ForgeGraphBreadcrumbs';
import { ConditionalNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalNode';
import { GraphLeftToolbar } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLayoutControls';
import { GraphEditorToolbar } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphEditorToolbar';
import { useShallow } from 'zustand/shallow';
import type { FlagSchema } from '@/forge/types/flags';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { ForgeGameFlagState, ForgeGameState } from '@/forge/types/forge-game-state';

const nodeTypes = {
  [FORGE_NODE_TYPE.ACT]: ActNode,
  [FORGE_NODE_TYPE.CHAPTER]: ChapterNode,
  [FORGE_NODE_TYPE.PAGE]: PageNode,
  [FORGE_NODE_TYPE.CONDITIONAL]: ConditionalNode,
  [FORGE_NODE_TYPE.DETOUR]: DetourNode,
  [FORGE_NODE_TYPE.STORYLET]: StoryletNode,
  START: ActNode,
} as const;

const edgeTypes = {
  default: ForgeEdge,
} as const;

export interface ForgeNarrativeGraphEditorProps {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  className?: string;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  gameState?: ForgeGameState;
  gameStateFlags?: ForgeGameFlagState;
}


function ForgeNarrativeGraphEditorInternal(props: ForgeNarrativeGraphEditorProps) {
  const {
    graph,
    onChange,
    className = '',
    flagSchema,
    characters = {},
    gameState,
    gameStateFlags,
  } = props;

  const resolvedGameStateFlags = gameState?.flags || gameStateFlags;
  
  const {
    openYarnModal,
    openCopilotChat,  
    focusedEditor,
    setFocusedEditor,
    pendingFocus,
    clearFocus,
    setContextNodeType,
  } = useForgeWorkspaceStore(
    useShallow((s) => ({
      openYarnModal: s.actions.openYarnModal,
      openCopilotChat: s.actions.openCopilotChat,
      focusedEditor: s.focusedEditor,
      setFocusedEditor: s.actions.setFocusedEditor,
      pendingFocus: s.pendingFocusByScope.narrative,
      clearFocus: s.actions.clearFocus,
      setContextNodeType: s.actions.setContextNodeType,
    }))
  );

  const reactFlow = useReactFlow();

  // Editor focus tracking - click-only, no hover preview
  const isFocused = focusedEditor === 'narrative';

  const handleClick = React.useCallback(() => {
    setFocusedEditor('narrative');
  }, [setFocusedEditor]);

  // Get session store instance
  const sessionStore = useForgeEditorSessionStore();

  // Read from session store
  const layoutDirection = useForgeEditorSession((s) => s.layoutDirection);
  const autoOrganize = useForgeEditorSession((s) => s.autoOrganize);
  const showPathHighlight = useForgeEditorSession((s) => s.showPathHighlight);
  const showBackEdges = useForgeEditorSession((s) => s.showBackEdges);
  const showMiniMap = useForgeEditorSession((s) => s.showMiniMap);

  const setLayoutDirection = React.useCallback((dir: LayoutDirection) => {
    sessionStore.setState({ layoutDirection: dir });
  }, [sessionStore]);

  const setAutoOrganize = React.useCallback((value: boolean) => {
    sessionStore.setState({ autoOrganize: value });
  }, [sessionStore]);

  const setShowPathHighlight = React.useCallback((value: boolean) => {
    sessionStore.setState({ showPathHighlight: value });
  }, [sessionStore]);

  const setShowBackEdges = React.useCallback((value: boolean) => {
    sessionStore.setState({ showBackEdges: value });
  }, [sessionStore]);

  const setShowMiniMap = React.useCallback((value: boolean) => {
    sessionStore.setState({ showMiniMap: value });
  }, [sessionStore]);

  // Create a default empty graph if none exists, with correct kind for narrative
  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
  const effectiveGraph = React.useMemo(() => {
    if (graph) return graph;
    const { createEmptyForgeGraphDoc } = require('@/forge/lib/utils/forge-flow-helpers');
    const { FORGE_GRAPH_KIND } = require('@/forge/types/forge-graph');
    return createEmptyForgeGraphDoc({
      projectId: selectedProjectId || 0,
      kind: FORGE_GRAPH_KIND.NARRATIVE,
      title: 'Untitled Narrative',
    });
  }, [graph, selectedProjectId]);

  const shell = useForgeFlowEditorShell({
    graph: effectiveGraph,
    onChange,
    reactFlow,
    sessionStore,
  });

  const selectedNodeType = shell.selectedNode?.type ?? null;

  React.useEffect(() => {
    setContextNodeType('narrative', selectedNodeType);
  }, [selectedNodeType, setContextNodeType]);

  React.useEffect(() => {
    return () => setContextNodeType('narrative', null);
  }, [setContextNodeType]);

  // Create actions from dispatch and provide to children
  const actions = React.useMemo(() => makeForgeEditorActions(shell.dispatch), [shell.dispatch]);

  // Path highlighting - only calculate when enabled
  const { edgesToSelectedNode, nodeDepths } = useFlowPathHighlighting(
    showPathHighlight ? shell.selectedNodeId : null,
    shell.effectiveGraph
  );

  // Consume focus requests from workspace
  React.useEffect(() => {
    if (pendingFocus && graph && String(graph.id) === pendingFocus.graphId) {
      if (pendingFocus.nodeId) {
        // Focus on specific node
        const node = shell.effectiveGraph.flow.nodes.find(n => n.id === pendingFocus.nodeId);
        if (node) {
          reactFlow.fitView({ nodes: [{ id: pendingFocus.nodeId }], duration: 300 });
        }
      } else {
        // Just fit view to show all nodes
        reactFlow.fitView({ duration: 300 });
      }
      clearFocus('narrative');
    }
  }, [pendingFocus, graph, reactFlow, clearFocus, shell.effectiveGraph]);

  const handleAutoLayout = React.useCallback(
    (direction?: LayoutDirection) => {
      const dir = direction || layoutDirection;
      if (direction) setLayoutDirection(direction);

      const result = applyLayout(shell.effectiveGraph, 'dagre', { direction: dir });
      onChange(result.graph);
      setTimeout(() => reactFlow?.fitView({ padding: 0.2, duration: 500 }), 100);
    },
    [layoutDirection, onChange, reactFlow, shell.effectiveGraph, setLayoutDirection]
  );

  const flowById = React.useMemo(
    () => new Map<string, ForgeReactFlowNode>(shell.effectiveGraph.flow.nodes.map((node) => [node.id, node])),
    [shell.effectiveGraph.flow.nodes]
  );

  const nodesWithMeta = React.useMemo(() => {
    const hasSelection = shell.selectedNodeId !== null && showPathHighlight;
    const startId = shell.effectiveGraph.startNodeId;

    return shell.nodes.map((node) => {
      const isInPath = showPathHighlight && nodeDepths.has(node.id);
      const isSelected = node.id === shell.selectedNodeId;
      const isDimmed = hasSelection && !isInPath && !isSelected;
      const flowNode = flowById.get(node.id);
      const nodeType = (flowNode?.type as ForgeNodeType | undefined) ?? (flowNode?.data as ForgeNode | undefined)?.type;
      const isStartNode = node.id === startId;
      const isEndNode = shell.effectiveGraph.endNodeIds.some((e) => e.nodeId === node.id);
      const nodeData = (flowNode?.data ?? {}) as ForgeNode;

      return {
        ...node,
        data: {
          ...(node.data ?? {}),
          node: { ...nodeData, id: node.id, type: nodeType },
          layoutDirection,
          ui: {
            isDimmed,
            isInPath,
            isStartNode,
            isEndNode,
          },
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
    shell.effectiveGraph.endNodeIds,
    shell.effectiveGraph.startNodeId,
    shell.nodes,
    shell.selectedNodeId,
    flowById,
  ]);

  const nodeById = React.useMemo(
    () => new Map<string, typeof shell.nodes[number]>(shell.nodes.map((node) => [node.id, node])),
    [shell.nodes]
  );

  const edgesWithMeta = React.useMemo(() => {
    const hasSelection = showPathHighlight && shell.selectedNodeId !== null;

    return shell.edges.map((edge) => {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);
      const sourceFlowNode = flowById.get(edge.source);

      const isBackEdge =
        !!showBackEdges &&
        !!sourceNode &&
        !!targetNode &&
        (layoutDirection === 'TB'
          ? targetNode.position.y < sourceNode.position.y
          : targetNode.position.x < sourceNode.position.x);

      const isInPath = edgesToSelectedNode.has(edge.id);
      const isDimmed = hasSelection && !isInPath;

      return {
        ...edge,
        data: {
          ...(edge.data ?? {}),
          isInPathToSelected: isInPath,
          isBackEdge,
          isDimmed,
          sourceNode: sourceFlowNode,
        },
      };
    });
  }, [
    edgesToSelectedNode,
    flowById,
    layoutDirection,
    nodeById,
    showBackEdges,
    showPathHighlight,
    shell.edges,
    shell.selectedNodeId,
  ]);

  return (
    <ForgeEditorActionsProvider actions={actions}>
      <ForgeNarrativeGraphEditorContent
        openCopilotChat={openCopilotChat}
        graph={graph}
        shell={shell}
        reactFlow={reactFlow}
        nodesWithMeta={nodesWithMeta}
        edgesWithMeta={edgesWithMeta}
        layoutDirection={layoutDirection}
        showPathHighlight={showPathHighlight}
        showBackEdges={showBackEdges}
        showMiniMap={showMiniMap}
        autoOrganize={autoOrganize}
        isFocused={isFocused}
        openYarnModal={openYarnModal}
        handleClick={handleClick}
        handleAutoLayout={handleAutoLayout}
        setLayoutDirection={setLayoutDirection}
        setAutoOrganize={setAutoOrganize}
        setShowPathHighlight={setShowPathHighlight}
        setShowBackEdges={setShowBackEdges}
        setShowMiniMap={setShowMiniMap}
        className={className}
      />
    </ForgeEditorActionsProvider>
  );
}

// Content component that uses the editor actions hook (must be inside provider)
function ForgeNarrativeGraphEditorContent({
  graph,
  shell,
  reactFlow,
  nodesWithMeta,
  edgesWithMeta,
  layoutDirection,
  showPathHighlight,
  showBackEdges,
  showMiniMap,
  autoOrganize,
  isFocused,
  openYarnModal,
  openCopilotChat,
  handleClick,
  handleAutoLayout,
  setLayoutDirection,
  setAutoOrganize,
  setShowPathHighlight,
  setShowBackEdges,
  setShowMiniMap,
  className,
}: {
  graph: ForgeGraphDoc | null;
  shell: ReturnType<typeof useForgeFlowEditorShell>;
  reactFlow: ReturnType<typeof useReactFlow>;
  nodesWithMeta: any[];
  edgesWithMeta: any[];
  layoutDirection: LayoutDirection;
  showPathHighlight: boolean;
  showBackEdges: boolean;
  showMiniMap: boolean;
  autoOrganize: boolean;
  isFocused: boolean;
  openYarnModal: () => void;
  openCopilotChat: () => void;
  handleClick: () => void;
  handleAutoLayout: (direction?: LayoutDirection) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  setAutoOrganize: (value: boolean) => void;
  setShowPathHighlight: (value: boolean) => void;
  setShowBackEdges: (value: boolean) => void;
  setShowMiniMap: (value: boolean) => void;
  className: string;
}) {
  // Register CopilotKit editor actions (must be inside provider)
  useForgeGraphEditorActions();
  
  const actions = useForgeEditorActions();

  return (
    <div 
      className={cn(
        "dialogue-graph-editor h-full w-full flex flex-col bg-[#0b0b14]",
        className
      )}
      onClick={handleClick}
    >
        {/* Toolbar with breadcrumbs and view toggles */}
        <div className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 border-t-1 bg-df-editor-bg flex-shrink-0 transition-colors",
          isFocused ? "border-t-[var(--color-df-info)]" : "border-t-df-control-border"
        )}>
          <div className="flex items-center gap-2">
            <ForgeGraphBreadcrumbs scope="narrative" />
            {isFocused && (
              <Focus size={14} style={{ color: 'var(--color-df-info)' }} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <GraphEditorToolbar 
              scope="narrative" 
              onCreateNew={async () => {
                const dataAdapter = useForgeWorkspaceStore((s) => s.dataAdapter);
                const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);
                const openGraphInScope = useForgeWorkspaceStore((s) => s.actions.openGraphInScope);
                if (!dataAdapter || !selectedProjectId) return;
                
                const { createGraphWithStartEnd } = await import('@/forge/lib/utils/forge-flow-helpers');
                const { FORGE_GRAPH_KIND } = await import('@/forge/types/forge-graph');
                const { flow, startNodeId, endNodeIds } = createGraphWithStartEnd({
                  projectId: selectedProjectId,
                  kind: FORGE_GRAPH_KIND.NARRATIVE,
                  title: 'New Narrative'
                });
                
                const createdGraph = await dataAdapter.createGraph({
                  projectId: selectedProjectId,
                  kind: FORGE_GRAPH_KIND.NARRATIVE,
                  title: 'New Narrative',
                  flow,
                  startNodeId,
                  endNodeIds,
                });
                
                openGraphInScope('narrative', String(createdGraph.id));
              }}
            />
            <button
              onClick={openYarnModal}
              className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-1.5 text-xs text-df-text-secondary hover:text-df-text-primary transition"
              title="View Yarn"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Graph editor */}
        <div className="flex-1 min-h-0" ref={shell.reactFlowWrapperRef}>
            <ReactFlow
              nodes={nodesWithMeta}
              edges={edgesWithMeta}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="bg-df-canvas-bg"
              minZoom={0.1}
              maxZoom={1.5}
              connectionLineType={ConnectionLineType.SmoothStep}
              onNodesChange={shell.onNodesChange}
              onNodesDelete={shell.onNodesDelete}
              onEdgesChange={shell.onEdgesChange}
              onEdgesDelete={shell.onEdgesDelete}
              onNodeDragStop={shell.onNodeDragStop}
              onConnect={shell.onConnect}
              onConnectStart={shell.onConnectStart}
              onConnectEnd={shell.onConnectEnd}
              onNodeClick={shell.onNodeClick}
              onNodeDoubleClick={shell.onNodeDoubleClick}
              onPaneClick={shell.onPaneClick}
              onPaneContextMenu={shell.onPaneContextMenu}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                event.preventDefault();
                const nodeType = event.dataTransfer.getData('application/reactflow') as ForgeNodeType;
                
                // Validate node type is allowed for narrative graphs
                if (!nodeType || !Object.values(NARRATIVE_FORGE_NODE_TYPE).includes(nodeType as any)) {
                  return;
                }
                
                const position = reactFlow.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                
                actions.createNode(nodeType, position.x, position.y);
              }}
            >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <GraphMiniMap showMiniMap={showMiniMap} />
        <GraphLeftToolbar
          layoutStrategy="dagre"
          showMiniMap={showMiniMap}
          onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
          onOpenCopilot={openCopilotChat}
        />
        <GraphLayoutControls
          autoOrganize={autoOrganize}
          onToggleAutoOrganize={() => setAutoOrganize(!autoOrganize)}
          layoutDirection={layoutDirection}
          onLayoutDirectionChange={setLayoutDirection}
          onApplyLayout={() => handleAutoLayout()}
          showPathHighlight={showPathHighlight}
          onTogglePathHighlight={() => setShowPathHighlight(!showPathHighlight)}
          showBackEdges={showBackEdges}
          onToggleBackEdges={() => setShowBackEdges(!showBackEdges)}
        />

        {shell.paneContextMenu && (
          <NarrativeGraphEditorPaneContextMenu
            x={shell.paneContextMenu.screenX}
            y={shell.paneContextMenu.screenY}
            graphX={shell.paneContextMenu.flowX}
            graphY={shell.paneContextMenu.flowY}
            onAddNode={(type: ForgeNodeType, x: number, y: number) => actions.createNode(type, x, y)}
            onClose={() => shell.setPaneContextMenu(null)}
          />
        )}

        {/* Edge drop menu will be handled by registry pattern similar to storylet editor */}
        {/* For now, we'll skip it and add it in a follow-up if needed */}
            </ReactFlow>
          </div>
        </div>
  );
}

export function ForgeNarrativeGraphEditor(props: ForgeNarrativeGraphEditorProps) {
  // Create session store for this editor instance
  const sessionStore = React.useMemo(() => createForgeEditorSessionStore(), []);

  return (
    <ReactFlowProvider>
      <ForgeEditorSessionProvider store={sessionStore}>
        <ForgeNarrativeGraphEditorInternal {...props} />
      </ForgeEditorSessionProvider>
    </ReactFlowProvider>
  );
}
