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
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowPathHighlighting } from '@/forge/lib/graph-editor/hooks/useFlowPathHighlighting';
import { type LayoutDirection } from '@/forge/lib/utils/forge-flow-helpers';

import { GraphMiniMap } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphMiniMap';

import { DetourNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/DetourNode';
import { ActNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ActNode/ActNode';
import { ChapterNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ChapterNode/ChapterNode';
import { PageNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PageNode/PageNode';
import { StoryletNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletNode';
import { ForgeEdge } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Edges/ForgeEdge';
import { FileText, Focus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

import type { ForgeGraphDoc, ForgeNode, ForgeNodeType, ForgeReactFlowNode } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

import { useForgeFlowEditorShell, type ShellNodeData } from '@/forge/lib/graph-editor/hooks/useForgeFlowEditorShell';
import { createForgeEditorSessionStore, ForgeEditorSessionProvider, useForgeEditorSession, useForgeEditorSessionStore } from '@/forge/lib/graph-editor/hooks/useForgeEditorSession';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeEditorActionsProvider, makeForgeEditorActions, useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';
import { useForgeGraphEditorActions } from '@/forge/copilotkit';
import { NarrativeGraphEditorPaneContextMenu } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeNarrativeGraphEditor/NarrativeGraphEditorPaneContextMenu';
import { ForgeGraphBreadcrumbs } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/ForgeGraphBreadcrumbs';
import { ConditionalNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalNode';
import { NarrativeConditionalNode } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/NarrativeConditionalNode';
import { GraphLeftToolbar } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphLayoutControls';
import { GraphEditorToolbar } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GraphEditorToolbar';
import { NodeEditor } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NodeEditor';
import { useShallow } from 'zustand/shallow';
import type { FlagSchema } from '@/forge/types/flags';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { ForgeGameFlagState, ForgeGameState } from '@/forge/types/forge-game-state';
import { debugLog } from '@/shared/utils/debug';
import { useToast } from '@/shared/ui/toast';

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
  
  // Memoize nodeTypes and edgeTypes to prevent React Flow warnings
  // Include all node types for rendering existing nodes in the graph
  // Note: Creation is restricted to DETOUR and CONDITIONAL via onDrop and context menu
  // Act, Chapter, and Page nodes are managed in Writer workspace but need to be renderable here
  const nodeTypes = React.useMemo(() => {
    debugLog('reactflow', 'Creating narrative nodeTypes');
    return {
      // All node types for rendering existing nodes
      [FORGE_NODE_TYPE.ACT]: ActNode,
      [FORGE_NODE_TYPE.CHAPTER]: ChapterNode,
      [FORGE_NODE_TYPE.PAGE]: PageNode,
      [FORGE_NODE_TYPE.STORYLET]: StoryletNode,
      [FORGE_NODE_TYPE.CONDITIONAL]: ConditionalNode,
      [FORGE_NODE_TYPE.NARRATIVE_CONDITIONAL]: NarrativeConditionalNode,
      [FORGE_NODE_TYPE.DETOUR]: DetourNode,
    } as const;
  }, []);

  const edgeTypes = React.useMemo(() => {
    debugLog('reactflow', 'Creating narrative edgeTypes');
    return {
      default: ForgeEdge,
    } as const;
  }, []);
  
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
    onChange: (updatedGraph) => {
      onChange(updatedGraph);
    },
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        layoutDirection={layoutDirection}
        showPathHighlight={showPathHighlight}
        showBackEdges={showBackEdges}
        showMiniMap={showMiniMap}
        autoOrganize={autoOrganize}
        isFocused={isFocused}
        openYarnModal={openYarnModal}
        handleClick={handleClick}
        handleAutoLayout={shell.handleAutoLayout}
        setLayoutDirection={setLayoutDirection}
        setAutoOrganize={setAutoOrganize}
        setShowPathHighlight={setShowPathHighlight}
        setShowBackEdges={setShowBackEdges}
        setShowMiniMap={setShowMiniMap}
        flagSchema={flagSchema}
        characters={characters}
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
  nodeTypes,
  edgeTypes,
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
  flagSchema,
  characters,
  className,
}: {
  graph: ForgeGraphDoc | null;
  shell: ReturnType<typeof useForgeFlowEditorShell>;
  reactFlow: ReturnType<typeof useReactFlow>;
  nodesWithMeta: any[];
  edgesWithMeta: any[];
  nodeTypes: Record<string, React.ComponentType<any>>;
  edgeTypes: Record<string, React.ComponentType<any>>;
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
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  className: string;
}) {
  // Register CopilotKit editor actions (must be inside provider)
  useForgeGraphEditorActions();
  
  // Debug logging for component render
  React.useEffect(() => {
    debugLog('components', 'ForgeNarrativeGraphEditorContent rendered', { 
      graphId: graph?.id,
      nodeCount: nodesWithMeta.length,
      edgeCount: edgesWithMeta.length 
    });
  });
  
  const actions = useForgeEditorActions();
  const { toast } = useToast();
  
  // Check if graph has Act node (required for narrative structure)
  const hasActNode = React.useMemo(() => {
    return shell.effectiveGraph.flow.nodes.some(node => {
      const nodeType = (node.type as ForgeNodeType | undefined) ?? 
                      ((node.data as ForgeNode | undefined)?.type);
      return nodeType === FORGE_NODE_TYPE.ACT;
    });
  }, [shell.effectiveGraph.flow.nodes]);

  const isEmpty = shell.effectiveGraph.flow.nodes.length === 0;
  const showEmptyState = isEmpty || !hasActNode;
  
  // Custom handler to prevent deletion of Act/Chapter/Page nodes
  const handleNodesDelete = React.useCallback((deleted: Node[]) => {
    const protectedNodes: Node[] = [];
    
    for (const node of deleted) {
      const flowNode = shell.effectiveGraph.flow.nodes.find(n => n.id === node.id);
      if (!flowNode) continue;
      
      const nodeType = (flowNode.type as ForgeNodeType | undefined) ?? 
                      ((flowNode.data as ForgeNode | undefined)?.type);
      
      // Check if this is a protected node type (ALL ACT/CHAPTER/PAGE nodes are protected)
      if (nodeType === FORGE_NODE_TYPE.ACT || 
          nodeType === FORGE_NODE_TYPE.CHAPTER || 
          nodeType === FORGE_NODE_TYPE.PAGE) {
        protectedNodes.push(node);
      }
    }
    
    if (protectedNodes.length > 0) {
      const nodeTypeNames = protectedNodes.map(n => {
        const flowNode = shell.effectiveGraph.flow.nodes.find(fn => fn.id === n.id);
        const type = (flowNode?.type as ForgeNodeType | undefined) ?? 
                    ((flowNode?.data as ForgeNode | undefined)?.type);
        return type === FORGE_NODE_TYPE.ACT ? 'Act' : 
               type === FORGE_NODE_TYPE.CHAPTER ? 'Chapter' : 'Page';
      }).join(', ');
      
      toast.error(`Cannot delete ${nodeTypeNames} nodes. Delete them from the Writer workspace sidebar first.`);
      return;
    }
    
    // Allow deletion of non-protected nodes
    shell.onNodesDelete(deleted);
  }, [shell, toast]);

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
          "flex items-center gap-3 px-3 py-2 border-t-1 bg-df-editor-bg flex-shrink-0 transition-colors",
          isFocused ? "border-t-[var(--color-df-info)]" : "border-t-df-control-border"
        )}>
          <div className="flex items-center gap-2">
            <ForgeGraphBreadcrumbs scope="narrative" />
            {isFocused && (
              <Focus size={14} style={{ color: 'var(--color-df-info)' }} />
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <GraphEditorToolbar 
              scope="narrative" 
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
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative w-full h-full" ref={shell.reactFlowWrapperRef} style={{ minHeight: 0 }}>
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
              onNodesDelete={handleNodesDelete}
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
                
                // Only allow Detour and Narrative Conditional nodes in narrative graph editor
                // CONDITIONAL is not allowed - only NARRATIVE_CONDITIONAL
                const allowedTypes = [FORGE_NODE_TYPE.DETOUR, FORGE_NODE_TYPE.NARRATIVE_CONDITIONAL];
                if (!nodeType || !allowedTypes.includes(nodeType as any)) {
                  return;
                }
                
                const position = reactFlow.screenToFlowPosition({
                  x: event.clientX,
                  y: event.clientY,
                });
                
                actions.createNode(nodeType, position.x, position.y);
              }}
            >
        <Background variant={BackgroundVariant.Lines} gap={20} size={1} color="rgba(255, 255, 255, 0.03)" />
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
            open={!!shell.paneContextMenu}
          />
        )}

        {/* Edge drop menu will be handled by registry pattern similar to storylet editor */}
        {/* For now, we'll skip it and add it in a follow-up if needed */}
            </ReactFlow>
            
            {/* Empty state overlay */}
            {showEmptyState && (
              <div className="absolute inset-0 flex items-center justify-center bg-df-canvas-bg/80 z-50">
                <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg p-8 max-w-md text-center">
                  <h3 className="text-lg font-semibold text-df-text-primary mb-2">
                    No Narrative Structure Found
                  </h3>
                  <p className="text-sm text-df-text-secondary mb-6">
                    Create an Act, Chapter, and Page in the Writer workspace first.
                  </p>
                  <Link
                    href="/writer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-df-info text-white rounded-md hover:bg-df-info/90 transition-colors"
                  >
                    <BookOpen size={16} />
                    Go to Writer Workspace
                  </Link>
                </div>
              </div>
            )}
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
                const selectedNode = shell.selectedNode;
                if (!selectedNode?.id) return;
                
                const selectedNodeId = selectedNode.id;
                const flowNode = shell.effectiveGraph.flow.nodes.find(n => n.id === selectedNodeId);
                if (flowNode) {
                  const nodeType = (flowNode.type as ForgeNodeType | undefined) ?? 
                                  ((flowNode.data as ForgeNode | undefined)?.type);
                  
                  // Prevent deletion of protected node types
                  if (nodeType === FORGE_NODE_TYPE.ACT || 
                      nodeType === FORGE_NODE_TYPE.CHAPTER || 
                      nodeType === FORGE_NODE_TYPE.PAGE) {
                    const nodeTypeName = nodeType === FORGE_NODE_TYPE.ACT ? 'Act' :
                                        nodeType === FORGE_NODE_TYPE.CHAPTER ? 'Chapter' :
                                        'Page';
                    toast.error(`Cannot delete ${nodeTypeName} nodes. Delete them from the Writer workspace sidebar first.`);
                    return;
                  }
                }
                actions.deleteNode(selectedNodeId);
              }}
            />
          )}
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
