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

import { useFlowPathHighlighting } from '@/forge/components/GraphEditors/hooks/useFlowPathHighlighting';
import { type LayoutDirection } from '@/forge/components/GraphEditors/utils/forge-flow-helpers';

import { applyLayout } from '@/forge/components/GraphEditors/utils/layout/layout';
import { GraphMiniMap } from '@/forge/components/GraphEditors/shared/GraphMiniMap';

import { ActNode } from './components/ActNode/ActNode';
import { ChapterNode } from './components/ChapterNode/ChapterNode';
import { PageNode } from './components/PageNode/PageNode';
import { DetourNode } from '@/forge/components/GraphEditors/shared/Nodes/components/DetourNode';
import { ForgeEdge } from '@/forge/components/GraphEditors/shared/Edges/ForgeEdge';
import { YarnView } from '@/forge/components/GraphEditors/shared/YarnView';
import { Network, FileText, Focus } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { cn } from '@/shared/lib/utils';

import type { ForgeGraphDoc, ForgeNode, ForgeNodeType, ForgeReactFlowNode } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

import { useForgeFlowEditorShell, type ShellNodeData } from '@/forge/components/GraphEditors/hooks/useForgeFlowEditorShell';
import { createForgeEditorSessionStore, ForgeEditorSessionProvider, useForgeEditorSession, useForgeEditorSessionStore } from '@/forge/components/GraphEditors/hooks/useForgeEditorSession';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeEditorActionsProvider, makeForgeEditorActions } from '@/forge/components/GraphEditors/hooks/useForgeEditorActions';
import { NarrativeGraphEditorPaneContextMenu } from '@/forge/components/GraphEditors/ForgeNarrativeGraphEditor/components/NarrativeGraphEditorPaneContextMenu';
import { FORGE_COMMAND } from '@/forge/components/GraphEditors/hooks/forge-commands';
import { useNodeDrag } from '@/forge/components/ForgeWorkspace/hooks/useNodeDrag';
import { NARRATIVE_FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { ForgeGraphBreadcrumbs } from '@/forge/components/ForgeWorkspace/components/ForgeGraphBreadcrumbs';
import { ConditionalNode } from '@/forge/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalNode';
import { GraphLeftToolbar } from '@/forge/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/forge/components/GraphEditors/shared/GraphLayoutControls';

const nodeTypes = {
  [FORGE_NODE_TYPE.ACT]: ActNode,
  [FORGE_NODE_TYPE.CHAPTER]: ChapterNode,
  [FORGE_NODE_TYPE.PAGE]: PageNode,
  [FORGE_NODE_TYPE.CONDITIONAL]: ConditionalNode,
  [FORGE_NODE_TYPE.DETOUR]: DetourNode,
  // ThreadNode is a special "start" node - we'll use a custom type for it
  START: ActNode,
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

  // Editor focus tracking - click-only, no hover preview
  const setFocusedEditor = useForgeWorkspaceStore((s) => s.actions.setFocusedEditor);
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
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
      <div 
        className={cn(
          "h-full w-full flex flex-col bg-[#0b0b14]",
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
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as ViewMode);
            }}
            variant="outline"
            className="gap-0"
          >
            <ToggleGroupItem value="graph" aria-label="Graph view" className="rounded-none border-r-0 first:rounded-l-md last:rounded-r-md last:border-r">
              <Network className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="yarn" aria-label="Yarn view" className="rounded-none border-r-0 last:rounded-r-md last:border-r">
              <FileText className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        {/* View content */}
        {viewMode === 'graph' && (
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
              graph={graph as ForgeGraphDoc}
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
