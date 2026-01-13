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

import type { GameFlagState } from '@/src/types/game-state';
import { useFlowPathHighlighting } from '@/src/components/GraphEditors/hooks/useFlowPathHighlighting';

import {
  edgeStrokeColor,
  type LayoutDirection,
} from '@/src/utils/forge-flow-helpers';


import { NodeEditor } from '@/src/components/GraphEditors/shared/NodeEditor/NodeEditor';
import { GraphLeftToolbar } from '@/src/components/GraphEditors/shared/GraphLeftToolbar';
import { GraphLayoutControls } from '@/src/components/GraphEditors/shared/GraphLayoutControls';
import { GraphMiniMap } from '@/src/components/GraphEditors/shared/GraphMiniMap';
import { ForgeStoryletGraphEditorPaneContextMenu } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/ForgeStoryletGraphEditorPaneContextMenu';
import { useReactFlowBehaviors } from '@/src/components/GraphEditors/hooks/useReactFlowBehaviors';

import { CharacterNode } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterNode';
import { PlayerNodeV2 } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/PlayerNodeV2';
import { ConditionalNodeV2 } from '@/src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalNodeV2';
import { StoryletNode } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletNode';
import { ChoiceEdgeV2 } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/ChoiceEdgeV2';
import { CharacterEdge } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterEdge';
import { DetourNode } from '@/src/components/GraphEditors/shared/Nodes/DetourNode';

// EdgeDropMenu components
import { CharacterEdgeDropMenu } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/CharacterEdgeDropMenu';
import { PlayerEdgeDropMenu } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/PlayerEdgeDropMenu';
import { ConditionalEdgeDropMenu } from '@/src/components/GraphEditors/shared/Nodes/ConditionalNode/ConditionalEdgeDropMenu';
import { StoryletEdgeDropMenu } from '@/src/components/GraphEditors/ForgeStoryletGraphEditor/components/StoryletNode/StoryletEdgeDropMenu';

import type { FlagSchema } from '@/src/types/flags';
import type { Character } from '@/src/types/characters';


import type {
  ForgeGraphDoc,
  ForgeNode,
  ForgeNodeType,
  ForgeFlowNode,
} from '@/src/types/forge/forge-graph';
import { FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';

import {
  useForgeFlowEditorShell,
  type ShellNodeData,
} from '@/src/components/GraphEditors/hooks/useForgeFlowEditorShell';

import {
  createForgeEditorSessionStore,
  ForgeEditorSessionProvider,
  useForgeEditorSession,
  useForgeEditorSessionStore,
} from '@/src/components/GraphEditors/hooks/useForgeEditorSession';

import {
  ForgeEditorActionsProvider,
  makeForgeEditorActions,
} from '@/src/components/GraphEditors/hooks/useForgeEditorActions';

const nodeTypes = {
  CHARACTER: CharacterNode,
  PLAYER: PlayerNodeV2,
  CONDITIONAL: ConditionalNodeV2,
  STORYLET_REF: StoryletNode,
  DETOUR: DetourNode,
} as const;

const edgeTypes = {
  choice: ChoiceEdgeV2,
  default: CharacterEdge,
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
  characters?: Record<string, Character>;
  gameStateFlags?: GameFlagState;
}

function ForgeStoryletGraphEditorInternal(props: ForgeStoryletGraphEditorProps) {
  const {
    graph,
    onChange,
    className = '',
    flagSchema,
    characters = {},
    gameStateFlags,
  } = props;

  const reactFlow = useReactFlow();
  const { reactFlowWrapperRef } = useReactFlowBehaviors();

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

  // Actions from dispatch (node/edge components consume this)
  const actions = React.useMemo(() => makeForgeEditorActions(shell.dispatch), [shell.dispatch]);

  // Path highlighting
  const { edgesToSelectedNode, nodeDepths } = useFlowPathHighlighting(
    shell.selectedNodeId,
    shell.effectiveGraph
  );


  // Decorate nodes with UI metadata + read-only context (NO callbacks)
  const nodesWithMeta = React.useMemo(() => {
    const hasSelection = shell.selectedNodeId !== null && showPathHighlight;
    const startId = shell.effectiveGraph.startNodeId;

    return shell.nodes.map((n) => {
      const inPath = showPathHighlight && nodeDepths.has(n.id);
      const isSelected = n.id === shell.selectedNodeId;
      const isDimmed = hasSelection && !inPath && !isSelected;

      const flowNode = shell.effectiveGraph.flow.nodes.find((x) => x.id === n.id);
      const nodeType = (flowNode?.type as ForgeNodeType | undefined) ?? (flowNode?.data as any)?.type;

      const isStartNode = n.id === startId;
      const isEndNode = shell.endNodeIds.has(n.id);

      const baseNodeData = (flowNode?.data ?? {}) as ForgeNode;
      const hasConditionals =
        nodeType === FORGE_NODE_TYPE.CHARACTER && !!baseNodeData.conditionalBlocks?.length;

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
          hasConditionals,

          // Read-only context
          flagSchema,
          characters,
          gameStateFlags,
        } as ShellNodeData & {
          flagSchema?: FlagSchema;
          characters?: Record<string, Character>;
          gameStateFlags?: GameFlagState;
        },
      };
    });
  }, [
    characters,
    flagSchema,
    gameStateFlags,
    layoutDirection,
    nodeDepths,
    showPathHighlight,
    shell,
  ]);

  // Decorate edges with UI metadata (NO callbacks)
  const edgesWithMeta = React.useMemo(() => {
    const nodeById = new Map(shell.nodes.map((n) => [n.id, n]));
    const flowById = new Map(shell.effectiveGraph.flow.nodes.map((n) => [n.id, n]));
    const hasSelection = showPathHighlight && shell.selectedNodeId !== null;

    return shell.edges.map((e) => {
      const sourceRF = nodeById.get(e.source);
      const targetRF = nodeById.get(e.target);
      const sourceFlow = flowById.get(e.source);

      const sourceType = (sourceFlow?.type as string | undefined) ?? (sourceFlow?.data as any)?.type;

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

      const sourceFlowNode = sourceFlow as ForgeFlowNode | undefined;

      return {
        ...e,
        style: {
          ...(e.style ?? {}),
          stroke,
          strokeWidth: isInPath ? 4 : 2,
          opacity: isDimmed ? 0.2 : isInPath ? 1 : 0.7,
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
  }, [edgesToSelectedNode, layoutDirection, showBackEdges, showPathHighlight, shell]);

  return (
    <ForgeEditorActionsProvider actions={actions}>
      <div className={`dialogue-graph-editor ${className} w-full h-full flex flex-col`}>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative w-full h-full" ref={reactFlowWrapperRef} style={{ minHeight: 0 }}>
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
                  const sourceNodeType =
                    (sourceNode?.type as ForgeNodeType) ?? FORGE_NODE_TYPE.CHARACTER;
                  const MenuComponent = storyletEdgeDropMenuByNodeType[sourceNodeType];

                  if (!MenuComponent) return null;

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
          {shell.selectedNodeId && (
            <NodeEditor
              node={shell.nodes.find((n) => n.id === shell.selectedNodeId) as ForgeNode}
              graph={shell.effectiveGraph as ForgeGraphDoc}
              characters={characters}
              flagSchema={flagSchema}
              onClose={() => shell.setSelectedNodeId(null)}
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
