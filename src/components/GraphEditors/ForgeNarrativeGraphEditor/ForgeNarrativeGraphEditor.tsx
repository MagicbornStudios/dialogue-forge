// src/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx
/**
 * Forge Narrative Graph Editor - React Flow Implementation (flow-first)
 *
 * Source of truth: ForgeGraphDoc.flow (nodes[] + edges[])
 * No StoryThread converter. No NARRATIVE_ELEMENT usage in editor logic.
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

import { useFlowPathHighlighting } from '@/src/components/GraphEditors/hooks/useFlowPathHighlighting';
import { type LayoutDirection } from '@/src/utils/forge-flow-helpers';

import { applyLayout } from '@/src/components/GraphEditors/utils/layout/layout';
import { GraphLeftToolbar } from '@/src/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/src/components/GraphEditors/shared/GraphLayoutControls';
import { GraphMiniMap } from '@/src/components/GraphEditors/shared/GraphMiniMap';
import { useReactFlowBehaviors } from '@/src/components/GraphEditors/hooks/useReactFlowBehaviors';

import { ThreadNode } from './components/ThreadNode/ThreadNode';
import { ActNode } from './components/ActNode/ActNode';
import { ChapterNode } from './components/ChapterNode/ChapterNode';
import { PageNode } from './components/PageNode/PageNode';
import { ConditionalNodeV2 } from '@/src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2';
import { DetourNode } from '@/src/components/GraphEditors/shared/Nodes/DetourNode';
import { ForgeEdge } from '@/src/components/GraphEditors/shared/Edges/ForgeEdge';
import { GraphBreadcrumbs } from '@/src/components/ForgeWorkspace/components/GraphBreadcrumbs';
import { YarnView } from '@/src/components/GraphEditors/shared/YarnView';
import { Network, FileText } from 'lucide-react';

import type { ForgeGraphDoc, ForgeNode, ForgeNodeType, ForgeReactFlowNode } from '@/src/types/forge/forge-graph';
import { FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';

import { useForgeFlowEditorShell, type ShellNodeData } from '@/src/components/GraphEditors/hooks/useForgeFlowEditorShell';
import { createForgeEditorSessionStore, ForgeEditorSessionProvider, useForgeEditorSession, useForgeEditorSessionStore } from '@/src/components/GraphEditors/hooks/useForgeEditorSession';
import { useForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeEditorActionsProvider, makeForgeEditorActions } from '@/src/components/GraphEditors/hooks/useForgeEditorActions';
import { NarrativeGraphEditorPaneContextMenu } from './components/NarrativeGraphEditorPaneContextMenu';
import { FORGE_COMMAND } from '../hooks/forge-commands';
import { useNodeDrag } from '@/src/components/ForgeWorkspace/hooks/useNodeDrag';
import { NARRATIVE_FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';

const nodeTypes = {
  [FORGE_NODE_TYPE.ACT]: ActNode,
  [FORGE_NODE_TYPE.CHAPTER]: ChapterNode,
  [FORGE_NODE_TYPE.PAGE]: PageNode,
  [FORGE_NODE_TYPE.CONDITIONAL]: ConditionalNodeV2,
  [FORGE_NODE_TYPE.DETOUR]: DetourNode,
  // ThreadNode is a special "start" node - we'll use a custom type for it
  START: ThreadNode,
} as const;

const edgeTypes = {
  default: ForgeEdge,
} as const;

export interface ForgeNarrativeGraphEditorProps {
  graph: ForgeGraphDoc | null;
  onChange: (graph: ForgeGraphDoc) => void;
  className?: string;
}

type ViewMode = 'graph' | 'yarn';

function ForgeNarrativeGraphEditorInternal(props: ForgeNarrativeGraphEditorProps) {
  const {
    graph,
    onChange,
    className = '',
  } = props;
  
  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>('graph');
  const { draggedNodeType } = useNodeDrag();

  const reactFlow = useReactFlow();
  const { reactFlowWrapperRef } = useReactFlowBehaviors();

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

  const shell = useForgeFlowEditorShell({
    graph,
    onChange,
    reactFlow,
    sessionStore,
  });

  // Create actions from dispatch and provide to children
  const actions = React.useMemo(() => makeForgeEditorActions(shell.dispatch), [shell.dispatch]);

  // Path highlighting - only calculate when enabled
  const { edgesToSelectedNode, nodeDepths } = useFlowPathHighlighting(
    showPathHighlight ? shell.selectedNodeId : null,
    shell.effectiveGraph
  );

  // Consume focus requests from workspace
  const pendingFocus = useForgeWorkspaceStore((s) => s.pendingFocusByScope.narrative);
  const clearFocus = useForgeWorkspaceStore((s) => s.actions.clearFocus);
  
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

  // Decorate nodes with UI metadata
  const nodesWithMeta = React.useMemo(() => {
    const hasSelection = shell.selectedNodeId !== null && showPathHighlight;
    return shell.effectiveGraph.flow.nodes.map((node) => {
      const isInPath = showPathHighlight && nodeDepths.has(node.id);
      const isSelected = node.id === shell.selectedNodeId;
      const isDimmed = hasSelection && !isInPath && !isSelected;
      const isStartNode = node.id === shell.effectiveGraph.startNodeId;
      const isEndNode = shell.effectiveGraph.endNodeIds.some((e) => e.nodeId === node.id);

      const nodeData = (node.data ?? {}) as ForgeNode;

      return {
        ...node,
        data: {
          node: nodeData,
          layoutDirection,
          ui: {
            isDimmed,
            isInPath,
            isStartNode,
            isEndNode,
          },
        } as ShellNodeData,
      };
    });
  }, [shell.effectiveGraph, shell.selectedNodeId, showPathHighlight, nodeDepths, layoutDirection]);

  // Decorate edges with UI metadata
  const edgesWithMeta = React.useMemo(() => {
    return shell.effectiveGraph.flow.edges.map((edge) => {
      const isInPath = showPathHighlight && edgesToSelectedNode.has(edge.id);
      const sourceNode = shell.effectiveGraph.flow.nodes.find((n) => n.id === edge.source);
      const sourceFlowNode = sourceNode as ForgeReactFlowNode | undefined;

      return {
        ...edge,
        data: {
          ...edge.data,
          isInPathToSelected: isInPath,
          sourceNode: sourceFlowNode,
        },
      };
    });
  }, [shell.effectiveGraph, showPathHighlight, edgesToSelectedNode]);

  return (
    <ForgeEditorActionsProvider actions={actions}>
      <div className={`h-full w-full flex flex-col rounded-xl border border-[#1a1a2e] bg-[#0b0b14] ${className}`}>
        {/* Toolbar with breadcrumbs and view toggles */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-df-control-border bg-df-editor-bg flex-shrink-0">
          <GraphBreadcrumbs scope="narrative" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-df-control-active text-df-text-primary'
                  : 'bg-df-control-bg text-df-text-secondary hover:bg-df-control-hover'
              }`}
              title="Graph View"
            >
              <Network size={14} className="inline mr-1" />
              Graph
            </button>
            <button
              onClick={() => setViewMode('yarn')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'yarn'
                  ? 'bg-df-control-active text-df-text-primary'
                  : 'bg-df-control-bg text-df-text-secondary hover:bg-df-control-hover'
              }`}
              title="Yarn View"
            >
              <FileText size={14} className="inline mr-1" />
              Yarn
            </button>
          </div>
        </div>
        
        {/* View content */}
        {viewMode === 'graph' && (
          <div className="flex-1 min-h-0" ref={reactFlowWrapperRef}>
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
        onEdgesChange={shell.onEdgesChange}
        onConnect={shell.onConnect}
        onNodeClick={(_, node) => {
          shell.setSelectedNodeId(node.id);
        }}
        onNodeDoubleClick={(_, node) => {
          shell.setSelectedNodeId(node.id);
          if (reactFlow) {
            reactFlow.fitView({
              nodes: [{ id: node.id }],
              padding: 0.2,
              duration: 500,
              minZoom: 0.5,
              maxZoom: 2,
            });
          }
        }}
        onPaneClick={() => {
          shell.setSelectedNodeId(null);
          shell.setPaneContextMenu(null);
          shell.setEdgeDropMenu(null);
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          const point = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
          shell.setPaneContextMenu({
            screenX: event.clientX,
            screenY: event.clientY,
            flowX: point.x,
            flowY: point.y,
          });
        }}
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
        onEdgesDelete={(deletedEdges) => {
          deletedEdges.forEach((edge) => {
            shell.dispatch({
              type: FORGE_COMMAND.GRAPH.EDGE_DELETE,
              edgeId: edge.id,
            });
          });
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <GraphMiniMap showMiniMap={showMiniMap} />
        <GraphLeftToolbar
          layoutStrategy="dagre"
          showMiniMap={showMiniMap}
          onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
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
        )}
        
        {viewMode === 'yarn' && graph && (
          <div className="flex-1 min-h-0">
            <YarnView
              dialogue={graph}
              onExport={() => {
                console.log('Export Yarn');
              }}
              onChange={(updatedGraph) => {
                onChange(updatedGraph);
              }}
            />
          </div>
        )}
      </div>
    </ForgeEditorActionsProvider>
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
