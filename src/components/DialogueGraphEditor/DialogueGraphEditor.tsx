/**
 * Dialogue Graph Editor - React Flow Implementation
 * 
 * Graph-based editor for dialogue trees using React Flow.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { 
  ReactFlowProvider,
  Background,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DialogueEditorProps, DialogueTree, DialogueNode, Choice, ConditionalBlock, ViewMode } from '../../types';
import type { GameFlagState } from '../../types/game-state';
import { exportToYarn, importFromYarn } from '../../lib/yarn-converter';
import { convertDialogueTreeToReactFlow, updateDialogueTreeFromReactFlow, CHOICE_COLORS } from '../../utils/reactflow-converter';
import { usePathHighlighting } from './hooks/usePathHighlighting';
import { createNode, deleteNodeFromTree, addChoiceToNode, removeChoiceFromNode, updateChoiceInNode } from '../../utils/node-helpers';
import { applyLayout, listLayouts, resolveNodeCollisions, LayoutDirection, type LayoutStrategy } from '../../utils/layout';
import { NodeEditor } from '../EditorComponents/NodeEditor';
import { YarnView } from '../EditorComponents/YarnView';
import { PlayView } from '../EditorComponents/PlayView';
import { GraphLeftToolbar } from '../EditorComponents/GraphLeftToolbar';
import { GraphLayoutControls } from '../EditorComponents/GraphLayoutControls';
import { GraphMiniMap } from '../EditorComponents/GraphMiniMap';
import { DailogueGraphEditorPaneContextMenu } from './components/DailogueGraphEditorPaneContextMenu';
import { PlayerEdgeDropMenu } from './components/PlayerNode/PlayerEdgeDropMenu';
import { NPCEdgeDropMenu } from './components/NPCNode/NPCEdgeDropMenu';
import { ConditionalEdgeDropMenu } from './components/ConditionalNode/ConditionalEdgeDropMenu';
import { StoryletEdgeDropMenu } from './components/StoryletNode/StoryletEdgeDropMenu';
import { StoryletPoolEdgeDropMenu } from './components/StoryletPoolNode/StoryletPoolEdgeDropMenu';
import { PlayerEdgeContextMenu } from './components/PlayerNode/PlayerEdgeContextMenu';
import { NPCEdgeContextMenu } from './components/NPCNode/NPCEdgeContextMenu';
import { ConditionalEdgeContextMenu } from './components/ConditionalNode/ConditionalEdgeContextMenu';
import { StoryletEdgeContextMenu } from './components/StoryletNode/StoryletEdgeContextMenu';
import { StoryletPoolEdgeContextMenu } from './components/StoryletPoolNode/StoryletPoolEdgeContextMenu';
import { useReactFlowBehaviors } from '../EditorComponents/hooks/useReactFlowBehaviors';
import { NPCNodeV2 } from './components/NPCNode/NPCNodeV2';
import { PlayerNodeV2 } from './components/PlayerNode/PlayerNodeV2';
import { PlayerNodeContextMenu } from './components/PlayerNode/PlayerNodeContextMenu';
import { NPCNodeContextMenu } from './components/NPCNode/NPCNodeContextMenu';
import { ConditionalNodeContextMenu } from './components/ConditionalNode/ConditionalNodeContextMenu';
import { StoryletNodeContextMenu } from './components/StoryletNode/StoryletNodeContextMenu';
import { StoryletPoolNodeContextMenu } from './components/StoryletPoolNode/StoryletPoolNodeContextMenu';
import { ConditionalNodeV2 } from './components/ConditionalNode/ConditionalNodeV2';
import { StoryletNode } from './components/StoryletNode/StoryletNode';
import { StoryletPoolNode } from './components/StoryletPoolNode/StoryletPoolNode';
import { ChoiceEdgeV2 } from './components/PlayerNode/ChoiceEdgeV2';
import { NPCEdgeV2 } from './components/NPCNode/NPCEdgeV2';
import { FlagSchema } from '../../types/flags';
import { Character } from '../../types/characters';
import { NODE_WIDTH } from '../../utils/constants';
import { NODE_TYPE, VIEW_MODE, type NodeType } from '../../types/constants';

// Define node and edge types outside component for stability
const nodeTypes = {
  [NODE_TYPE.NPC]: NPCNodeV2,
  [NODE_TYPE.PLAYER]: PlayerNodeV2,
  [NODE_TYPE.CONDITIONAL]: ConditionalNodeV2,
  [NODE_TYPE.STORYLET]: StoryletNode,
  [NODE_TYPE.STORYLET_POOL]: StoryletPoolNode,
};

const LINEAR_NODE_TYPES = new Set<NodeType>([
  NODE_TYPE.NPC,
  NODE_TYPE.STORYLET,
  NODE_TYPE.STORYLET_POOL,
]);

const isLinearNodeType = (type: NodeType) => LINEAR_NODE_TYPES.has(type);

const edgeTypes = {
  choice: ChoiceEdgeV2,
  default: NPCEdgeV2, // Use custom component for NPC edges instead of React Flow default
};

interface DialogueGraphEditorInternalProps extends DialogueEditorProps {
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>; // Characters from game state
  gameStateFlags?: GameFlagState;
  initialViewMode?: ViewMode;
  viewMode?: ViewMode; // Controlled view mode (if provided, overrides initialViewMode)
  onViewModeChange?: (mode: ViewMode) => void; // Callback when view mode changes
  layoutStrategy?: string; // Layout strategy ID from parent
  onLayoutStrategyChange?: (strategy: string) => void;
  onOpenFlagManager?: () => void;
  onOpenGuide?: () => void;
  onLoadExampleDialogue?: (dialogue: DialogueTree) => void;
  onLoadExampleFlags?: (flags: FlagSchema) => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  // Event hooks from DialogueEditorProps are already included
}

function DialogueGraphEditorInternal({
  dialogue,
  onChange,
  onExportYarn,
  onExportJSON,
  className = '',
  showTitleEditor = true,
  flagSchema,
  characters = {},
  gameStateFlags,
  initialViewMode = VIEW_MODE.GRAPH,
  viewMode: controlledViewMode,
  onViewModeChange,
  layoutStrategy: propLayoutStrategy = 'dagre', // Accept from parent
  onLayoutStrategyChange,
  onOpenFlagManager,
  onOpenGuide,
  onLoadExampleDialogue,
  onLoadExampleFlags,
  showMiniMap = true,
  onToggleMiniMap,
  // Event hooks
  onNodeAdd,
  onNodeDelete,
  onNodeUpdate,
  onConnect: onConnectHook,
  onDisconnect,
  onNodeSelect,
  onNodeDoubleClick: onNodeDoubleClickHook,
}: DialogueGraphEditorInternalProps) {
  // Use controlled viewMode if provided, otherwise use internal state
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(initialViewMode);
  const viewMode = controlledViewMode ?? internalViewMode;
  
  const setViewMode = (mode: ViewMode) => {
    if (controlledViewMode === undefined) {
      setInternalViewMode(mode);
    }
    onViewModeChange?.(mode);
  };
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('TB');
  const layoutStrategy = propLayoutStrategy; // Use prop instead of state
  const [autoOrganize, setAutoOrganize] = useState<boolean>(false); // Auto-layout on changes
  
  // Track if we've made a direct React Flow update to avoid unnecessary conversions
  const directUpdateRef = useRef<string | null>(null);
  const [showPathHighlight, setShowPathHighlight] = useState<boolean>(true); // Toggle path highlighting
  const [showBackEdges, setShowBackEdges] = useState<boolean>(true); // Toggle back-edge styling

  // Memoize nodeTypes and edgeTypes to prevent React Flow warnings
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string; graphX: number; graphY: number } | null>(null);
  const [edgeDropMenu, setEdgeDropMenu] = useState<{ x: number; y: number; graphX: number; graphY: number; fromNodeId: string; fromChoiceIdx?: number; fromBlockIdx?: number; sourceHandle?: string } | null>(null);
  const reactFlowInstance = useReactFlow();
  const connectingRef = useRef<{ fromNodeId: string; fromChoiceIdx?: number; fromBlockIdx?: number; sourceHandle?: string } | null>(null);

  // Convert DialogueTree to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => dialogue ? convertDialogueTreeToReactFlow(dialogue, layoutDirection) : { nodes: [], edges: [] },
    [dialogue, layoutDirection]
  );

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  // Ensure we have a dialogue object (even if empty) for the editor to work
  const effectiveDialogue = dialogue || {
    id: 'temp-dialogue',
    title: 'New Dialogue',
    startNodeId: '',
    nodes: {},
  };

  // Use path highlighting hook
  const { edgesToSelectedNode, nodeDepths } = usePathHighlighting(selectedNodeId, effectiveDialogue);

  // Update nodes/edges when dialogue changes externally
  // Skip conversion if we just made a direct React Flow update (for simple text changes)
  React.useEffect(() => {
    // If we just updated a node directly in React Flow, skip full conversion
    // The direct update already handled the visual change
    if (directUpdateRef.current) {
      directUpdateRef.current = null; // Clear the flag
      return; // Skip conversion - React Flow is already updated
    }
    
    const { nodes: newNodes, edges: newEdges } = convertDialogueTreeToReactFlow(effectiveDialogue, layoutDirection);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [effectiveDialogue, layoutDirection]);

  // Calculate end nodes (nodes with no outgoing connections)
  const endNodeIds = useMemo(() => {
    if (!effectiveDialogue || !effectiveDialogue.nodes) return new Set<string>();
    const ends = new Set<string>();
    Object.values(effectiveDialogue.nodes).forEach(node => {
      const hasNextNode = !!node.nextNodeId;
      const hasChoiceConnections = node.choices?.some(c => c.nextNodeId) || false;
      const hasBlockConnections = node.conditionalBlocks?.some(b => b.nextNodeId) || false;
      if (!hasNextNode && !hasChoiceConnections && !hasBlockConnections) {
        ends.add(node.id);
      }
    });
    return ends;
  }, [effectiveDialogue]);

  // Add flagSchema, characters, dim state, and layout direction to node data
  const nodesWithFlags = useMemo(() => {
    const hasSelection = selectedNodeId !== null && showPathHighlight;
    const startNodeId = effectiveDialogue?.startNodeId;
    
    return nodes.map(node => {
      const isInPath = showPathHighlight && nodeDepths.has(node.id);
      const isSelected = node.id === selectedNodeId;
      // Dim nodes that aren't in the path when something is selected (only if path highlight is on)
      const isDimmed = hasSelection && !isInPath && !isSelected;
      const isStartNode = node.id === startNodeId;
      const isEndNode = endNodeIds.has(node.id);
      
      return {
        ...node,
        data: {
          ...node.data,
          flagSchema,
          characters, // Pass characters to all nodes including conditional
          isDimmed,
          isInPath,
          layoutDirection,
          isStartNode,
          isEndNode,
        },
      };
    });
  }, [nodes, flagSchema, characters, nodeDepths, selectedNodeId, layoutDirection, showPathHighlight, effectiveDialogue, endNodeIds]);

  // Allow rendering even with null dialogue - handleAddNode will create a new one
  // if (!dialogue) {
  //   return (
  //     <div className={`dialogue-graph-editor-empty ${className}`}>
  //       <p>No dialogue loaded. Please provide a dialogue tree.</p>
  //     </div>
  //   );
  // }

  // Get selected node - use useMemo to ensure it updates when dialogue changes
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !effectiveDialogue) return null;
    const node = effectiveDialogue.nodes[selectedNodeId];
    if (!node) return null;
    // Return a fresh copy to ensure React detects changes
    return {
      ...node,
      choices: node.choices ? node.choices.map(c => ({ ...c })) : undefined,
      setFlags: node.setFlags ? [...node.setFlags] : undefined,
      conditionalBlocks: node.conditionalBlocks ? node.conditionalBlocks.map(b => ({
        ...b,
        condition: b.condition ? [...b.condition] : undefined,
      })) : undefined,
    };
  }, [selectedNodeId, effectiveDialogue]);

  // Handle node deletion (multi-delete support)
  const onNodesDelete = useCallback((deleted: Node[]) => {
    if (!effectiveDialogue || !effectiveDialogue.nodes) return;
    let updatedNodes = { ...effectiveDialogue.nodes };
    let shouldClearSelection = false;
    
    deleted.forEach(node => {
      const dialogueNode = effectiveDialogue.nodes[node.id];
      delete updatedNodes[node.id];
      if (selectedNodeId === node.id) {
        shouldClearSelection = true;
      }
      // Call onNodeDelete hook
      onNodeDelete?.(node.id);
    });
    
    let newDialogue = { ...effectiveDialogue, nodes: updatedNodes };
    
    // Auto-organize if enabled
    if (autoOrganize) {
      const result = applyLayout(newDialogue, layoutStrategy, { direction: layoutDirection });
      newDialogue = result.dialogue;
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
        }
      }, 50);
    }
    
    onChange(newDialogue);
    if (shouldClearSelection) {
      setSelectedNodeId(null);
    }
  }, [effectiveDialogue, onChange, selectedNodeId, autoOrganize, layoutDirection, reactFlowInstance]);

  // Handle node changes (drag, delete, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    
    // Handle deletions (backup in case onNodesDelete doesn't fire)
    const deletions = changes.filter(c => c.type === 'remove');
    if (deletions.length > 0 && effectiveDialogue) {
      let updatedNodes = { ...effectiveDialogue.nodes };
      let shouldClearSelection = false;
      
      deletions.forEach(change => {
        if (change.type === 'remove') {
          delete updatedNodes[change.id];
          if (selectedNodeId === change.id) {
            shouldClearSelection = true;
          }
        }
      });
      
      onChange({ ...effectiveDialogue, nodes: updatedNodes });
      if (shouldClearSelection) {
        setSelectedNodeId(null);
      }
    }
    
    // Sync position changes back to DialogueTree
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const node = effectiveDialogue.nodes[change.id];
        if (node && (node.x !== change.position.x || node.y !== change.position.y)) {
          // Create a new node object to avoid mutating the original
          const updatedNode = {
            ...effectiveDialogue.nodes[change.id],
            x: change.position.x,
            y: change.position.y,
          };
          onChange({
            ...effectiveDialogue,
            nodes: {
              ...effectiveDialogue.nodes,
              [change.id]: updatedNode,
            },
          });
        }
      }
    });
  }, [effectiveDialogue, onChange, selectedNodeId]);

  // Handle edge changes (delete, etc.)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    
    // Sync edge deletions back to DialogueTree
    changes.forEach(change => {
      if (change.type === 'remove') {
        // Find the edge before it's removed
        const currentEdges = edges;
        const edge = currentEdges.find(e => e.id === change.id);
        if (edge) {
          const sourceNode = effectiveDialogue.nodes[edge.source];
          if (sourceNode) {
            if (edge.sourceHandle === 'next' && isLinearNodeType(sourceNode.type)) {
              // Remove NPC next connection
              onChange({
                ...effectiveDialogue,
                nodes: {
                  ...effectiveDialogue.nodes,
                  [edge.source]: {
                    ...sourceNode,
                    nextNodeId: undefined,
                  },
                },
              });
            } else if (edge.sourceHandle?.startsWith('choice-')) {
              // Remove Player choice connection
              const choiceIdx = parseInt(edge.sourceHandle.replace('choice-', ''));
              if (sourceNode.choices && sourceNode.choices[choiceIdx]) {
                const updated = updateChoiceInNode(sourceNode, choiceIdx, { nextNodeId: '' });
                onChange({
                  ...effectiveDialogue,
                  nodes: {
                    ...effectiveDialogue.nodes,
                    [edge.source]: updated,
                  },
                });
              }
            } else if (edge.sourceHandle?.startsWith('block-') && sourceNode.type === NODE_TYPE.CONDITIONAL) {
              // Remove Conditional block connection
              const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
              if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
                const updatedBlocks = [...sourceNode.conditionalBlocks];
                updatedBlocks[blockIdx] = {
                  ...updatedBlocks[blockIdx],
                  nextNodeId: undefined,
                };
                onChange({
                  ...effectiveDialogue,
                  nodes: {
                    ...effectiveDialogue.nodes,
                    [edge.source]: {
                      ...sourceNode,
                      conditionalBlocks: updatedBlocks,
                    },
                  },
                });
              }
            }
          }
        }
      }
    });
  }, [effectiveDialogue, onChange, edges]);

  // Handle edge deletion (when Delete key is pressed on selected edges)
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      // Call onDisconnect hook
      onDisconnect?.(edge.id, edge.source, edge.target);
      
      const sourceNode = effectiveDialogue.nodes[edge.source];
      if (sourceNode) {
        if (edge.sourceHandle === 'next' && isLinearNodeType(sourceNode.type)) {
          // Remove NPC next connection
          onChange({
            ...effectiveDialogue,
            nodes: {
              ...effectiveDialogue.nodes,
              [edge.source]: {
                ...sourceNode,
                nextNodeId: undefined,
              },
            },
          });
        } else if (edge.sourceHandle?.startsWith('choice-')) {
          // Remove Player choice connection
          const choiceIdx = parseInt(edge.sourceHandle.replace('choice-', ''));
          if (sourceNode.choices && sourceNode.choices[choiceIdx]) {
            const updated = updateChoiceInNode(sourceNode, choiceIdx, { nextNodeId: '' });
            onChange({
              ...effectiveDialogue,
              nodes: {
                ...effectiveDialogue.nodes,
                [edge.source]: updated,
              },
            });
          }
        } else if (edge.sourceHandle?.startsWith('block-') && sourceNode.type === NODE_TYPE.CONDITIONAL) {
          // Remove Conditional block connection
          const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
          if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
            const updatedBlocks = [...sourceNode.conditionalBlocks];
            updatedBlocks[blockIdx] = {
              ...updatedBlocks[blockIdx],
              nextNodeId: undefined,
            };
            onChange({
              ...effectiveDialogue,
              nodes: {
                ...effectiveDialogue.nodes,
                [edge.source]: {
                  ...sourceNode,
                  conditionalBlocks: updatedBlocks,
                },
              },
            });
          }
        }
      }
    });
  }, [effectiveDialogue, onChange]);

  // Handle connection start (track what we're connecting from)
  const onConnectStart = useCallback((_event: React.MouseEvent | React.TouchEvent, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
    if (!nodeId || !effectiveDialogue) return;
    const sourceNode = effectiveDialogue.nodes[nodeId];
    if (!sourceNode) return;
    
    if (handleId === 'next' && isLinearNodeType(sourceNode.type)) {
      connectingRef.current = { fromNodeId: nodeId, sourceHandle: 'next' };
    } else if (handleId?.startsWith('choice-')) {
      const choiceIdx = parseInt(handleId.replace('choice-', ''));
      connectingRef.current = { fromNodeId: nodeId, fromChoiceIdx: choiceIdx, sourceHandle: handleId };
    } else if (handleId?.startsWith('block-')) {
      const blockIdx = parseInt(handleId.replace('block-', ''));
      connectingRef.current = { fromNodeId: nodeId, fromBlockIdx: blockIdx, sourceHandle: handleId };
    }
  }, [effectiveDialogue]);

  // Handle connection end (check if dropped on empty space)
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingRef.current) return;
    
    const targetIsNode = (event.target as HTMLElement).closest('.react-flow__node');
    if (!targetIsNode) {
      // Dropped on empty space - show edge drop menu
      const clientX = 'clientX' in event ? event.clientX : (event.touches?.[0]?.clientX || 0);
      const clientY = 'clientY' in event ? event.clientY : (event.touches?.[0]?.clientY || 0);
      const point = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });
      setEdgeDropMenu({
        x: clientX,
        y: clientY,
        graphX: point.x,
        graphY: point.y,
        fromNodeId: connectingRef.current.fromNodeId,
        fromChoiceIdx: connectingRef.current.fromChoiceIdx,
        fromBlockIdx: connectingRef.current.fromBlockIdx,
        sourceHandle: connectingRef.current.sourceHandle,
      });
    }
    connectingRef.current = null;
  }, [reactFlowInstance]);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || !dialogue) return;
    
    const newEdge = addEdge(connection, edges);
    setEdges(newEdge);
    setEdgeDropMenu(null); // Close edge drop menu if open
    
    // Call onConnect hook
    onConnectHook?.(connection.source, connection.target, connection.sourceHandle || undefined);
    
    // Update DialogueTree
    const sourceNode = effectiveDialogue.nodes[connection.source];
    if (!sourceNode) return;
    
    if (connection.sourceHandle === 'next' && isLinearNodeType(sourceNode.type)) {
      // NPC next connection
      onChange({
        ...dialogue,
        nodes: {
          ...dialogue.nodes,
          [connection.source]: {
            ...sourceNode,
            nextNodeId: connection.target,
          },
        },
      });
    } else if (connection.sourceHandle?.startsWith('choice-')) {
      // Player choice connection
      const choiceIdx = parseInt(connection.sourceHandle.replace('choice-', ''));
      if (sourceNode.choices && sourceNode.choices[choiceIdx]) {
        const updated = updateChoiceInNode(sourceNode, choiceIdx, { nextNodeId: connection.target });
        onChange({
          ...dialogue,
          nodes: {
            ...dialogue.nodes,
            [connection.source]: updated,
          },
        });
      }
    } else if (connection.sourceHandle?.startsWith('block-') && sourceNode.type === NODE_TYPE.CONDITIONAL) {
      // Conditional block connection
      const blockIdx = parseInt(connection.sourceHandle.replace('block-', ''));
      if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
        const updatedBlocks = [...sourceNode.conditionalBlocks];
        updatedBlocks[blockIdx] = {
          ...updatedBlocks[blockIdx],
          nextNodeId: connection.target,
        };
        onChange({
          ...dialogue,
          nodes: {
            ...dialogue.nodes,
            [connection.source]: {
              ...sourceNode,
              conditionalBlocks: updatedBlocks,
            },
          },
        });
      }
    }
    connectingRef.current = null;
  }, [effectiveDialogue, onChange, edges]);

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setNodeContextMenu(null);
    onNodeSelect?.(node.id);
  }, [onNodeSelect]);

  // Handle node double-click - zoom to node
  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (reactFlowInstance) {
      reactFlowInstance.setCenter(
        node.position.x + 110, // Half of NODE_WIDTH
        node.position.y + 60,  // Half of NODE_HEIGHT
        { zoom: 1.5, duration: 500 }
      );
    }
    onNodeDoubleClickHook?.(node.id);
  }, [reactFlowInstance, onNodeDoubleClickHook]);

  // Use shared React Flow behaviors
  const { reactFlowWrapperRef } = useReactFlowBehaviors();

  // Handle pane context menu (right-click on empty space)
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const point = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      graphX: point.x,
      graphY: point.y,
    });
  }, [reactFlowInstance]);

  // Handle node context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setNodeContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
    setContextMenu(null);
  }, []);

  // Handle edge context menu (right-click on edge to insert node)
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    
    // Calculate midpoint position on the edge
    const sourceNodePosition = nodes.find(n => n.id === edge.source)?.position;
    const targetNodePosition = nodes.find(n => n.id === edge.target)?.position;
    
    if (!sourceNodePosition || !targetNodePosition) return;
    
    // Calculate midpoint in flow coordinates
    const midX = (sourceNodePosition.x + targetNodePosition.x) / 2;
    const midY = (sourceNodePosition.y + targetNodePosition.y) / 2;
    
    // Convert to screen coordinates for menu positioning
    const point = reactFlowInstance.flowToScreenPosition({ x: midX, y: midY });
    
    setEdgeContextMenu({
      x: point.x,
      y: point.y,
      edgeId: edge.id,
      graphX: midX,
      graphY: midY,
    });
    setContextMenu(null);
    setNodeContextMenu(null);
  }, [nodes, reactFlowInstance]);

  // Insert node between two connected nodes
  const handleInsertNode = useCallback((type: NodeType, edgeId: string, x: number, y: number) => {
    if (!effectiveDialogue) return;
    
    // Find the edge
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    // Get the source and target nodes
    const sourceNode = effectiveDialogue.nodes[edge.source];
    const targetNode = effectiveDialogue.nodes[edge.target];
    if (!sourceNode || !targetNode) return;
    
    // Create new node
    const newId = `${type}_${Date.now()}`;
    const newNode = createNode(type, newId, x, y);
    
    // Update dialogue tree: break old connection, add new node, connect source->new->target
    const updatedNodes = { ...effectiveDialogue.nodes, [newId]: newNode };
    
    // Break the old connection and reconnect through new node
    if (edge.sourceHandle === 'next' && isLinearNodeType(sourceNode.type)) {
      // NPC connection
      updatedNodes[edge.source] = {
        ...sourceNode,
        nextNodeId: newId, // Connect source to new node
      };
      updatedNodes[newId] = {
        ...newNode,
        nextNodeId: edge.target, // Connect new node to target
      };
    } else if (edge.sourceHandle?.startsWith('choice-')) {
      // Player choice connection
      const choiceIdx = parseInt(edge.sourceHandle.replace('choice-', ''));
      if (sourceNode.choices && sourceNode.choices[choiceIdx]) {
        const updatedChoices = [...sourceNode.choices];
        updatedChoices[choiceIdx] = {
          ...updatedChoices[choiceIdx],
          nextNodeId: newId, // Connect choice to new node
        };
        updatedNodes[edge.source] = {
          ...sourceNode,
          choices: updatedChoices,
        };
        updatedNodes[newId] = {
          ...newNode,
          nextNodeId: edge.target, // Connect new node to target
        };
      }
    } else if (edge.sourceHandle?.startsWith('block-')) {
      // Conditional block connection
      const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
      if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
        const updatedBlocks = [...sourceNode.conditionalBlocks];
        updatedBlocks[blockIdx] = {
          ...updatedBlocks[blockIdx],
          nextNodeId: newId, // Connect block to new node
        };
        updatedNodes[edge.source] = {
          ...sourceNode,
          conditionalBlocks: updatedBlocks,
        };
        updatedNodes[newId] = {
          ...newNode,
          nextNodeId: edge.target, // Connect new node to target
        };
      }
    }
    
    onChange({
      ...effectiveDialogue,
      nodes: updatedNodes,
    });
    
    setEdgeContextMenu(null);
  }, [effectiveDialogue, onChange, edges]);

  // Add node from context menu or edge drop
  const handleAddNode = useCallback((type: NodeType, x: number, y: number, autoConnect?: { fromNodeId: string; fromChoiceIdx?: number; fromBlockIdx?: number; sourceHandle?: string }) => {
    const newId = `${type}_${Date.now()}`;
    const newNode = createNode(type, newId, x, y);
    
    // Call onNodeAdd hook
    onNodeAdd?.(newNode);
    
    // If dialogue is null/undefined, create a new dialogue tree
    if (!effectiveDialogue || !effectiveDialogue.nodes) {
      const newDialogue: DialogueTree = {
        id: dialogue?.id || `dialogue_${Date.now()}`,
        title: dialogue?.title || 'New Dialogue',
        startNodeId: dialogue?.startNodeId || newId,
        nodes: { ...(dialogue?.nodes || {}), [newId]: newNode }
      };
      onChange(newDialogue);
      setSelectedNodeId(newId);
      setContextMenu(null);
      setEdgeDropMenu(null);
      connectingRef.current = null;
      return;
    }
    
    // Build the complete new dialogue state in one go
    let newDialogue = {
      ...effectiveDialogue,
      nodes: { ...effectiveDialogue.nodes, [newId]: newNode }
    };
    
    // If auto-connecting, include that connection
    if (autoConnect) {
      const sourceNode = effectiveDialogue.nodes[autoConnect.fromNodeId];
      if (sourceNode) {
        if (autoConnect.sourceHandle === 'next' && isLinearNodeType(sourceNode.type)) {
          newDialogue.nodes[autoConnect.fromNodeId] = { ...sourceNode, nextNodeId: newId };
        } else if (autoConnect.fromChoiceIdx !== undefined && sourceNode.choices) {
          const newChoices = [...sourceNode.choices];
          newChoices[autoConnect.fromChoiceIdx] = { ...newChoices[autoConnect.fromChoiceIdx], nextNodeId: newId };
          newDialogue.nodes[autoConnect.fromNodeId] = { ...sourceNode, choices: newChoices };
        } else if (autoConnect.fromBlockIdx !== undefined && sourceNode.type === NODE_TYPE.CONDITIONAL && sourceNode.conditionalBlocks) {
          const newBlocks = [...sourceNode.conditionalBlocks];
          newBlocks[autoConnect.fromBlockIdx] = { ...newBlocks[autoConnect.fromBlockIdx], nextNodeId: newId };
          newDialogue.nodes[autoConnect.fromNodeId] = { ...sourceNode, conditionalBlocks: newBlocks };
        }
      }
    }
    
    // Apply layout if auto-organize is enabled
    if (autoOrganize) {
      const result = applyLayout(newDialogue, layoutStrategy, { direction: layoutDirection });
      newDialogue = result.dialogue;
    }
    
    // Single onChange call with all updates
    onChange(newDialogue);
    
    setSelectedNodeId(newId);
    setContextMenu(null);
    setEdgeDropMenu(null);
    connectingRef.current = null;
    
    // Fit view after layout (only if auto-organize is on)
    if (autoOrganize) {
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
        }
      }, 50);
    }
  }, [effectiveDialogue, onChange, autoOrganize, layoutDirection, reactFlowInstance, onNodeAdd]);

  // Handle node updates
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<DialogueNode>) => {
    if (!effectiveDialogue || !effectiveDialogue.nodes[nodeId]) return;
    const updatedNode = { ...effectiveDialogue.nodes[nodeId], ...updates };
    
    // Check if this is a "simple" update (just text/content changes, not structural)
    // Simple updates: speaker, content, characterId (non-structural properties)
    // Structural updates: choices, conditionalBlocks, nextNodeId (affect edges/connections)
    const isSimpleUpdate = Object.keys(updates).every(key =>
      ['speaker', 'content', 'characterId', 'setFlags', 'storyletCall', 'storyletId', 'storyletPoolId'].includes(key)
    );
    
    if (isSimpleUpdate && reactFlowInstance) {
      // For simple updates, update React Flow directly without full tree conversion
      // This is much faster and avoids expensive recalculations
      const allNodes = reactFlowInstance.getNodes();
      const nodeToUpdate = allNodes.find(n => n.id === nodeId);
      
      if (nodeToUpdate) {
        // Mark that we're doing a direct update to skip full conversion
        directUpdateRef.current = nodeId;
        
        // Update the node data directly in React Flow
        const updatedReactFlowNode = {
          ...nodeToUpdate,
          data: {
            ...nodeToUpdate.data,
            node: updatedNode, // Update the dialogue node in the data
          },
        };
        
        // Update just this node in React Flow
        const updatedNodes = allNodes.map(n => n.id === nodeId ? updatedReactFlowNode : n);
        reactFlowInstance.setNodes(updatedNodes);
      }
    }
    
    // Always update the dialogue tree (source of truth) - but this triggers full conversion
    // The useEffect will handle the full conversion, but React Flow is already updated above
    onChange({
      ...effectiveDialogue,
      nodes: {
        ...effectiveDialogue.nodes,
        [nodeId]: updatedNode
      }
    });
    
    // Call onNodeUpdate hook
    onNodeUpdate?.(nodeId, updates);
  }, [effectiveDialogue, onChange, onNodeUpdate, reactFlowInstance]);

  // Handle choice updates
  const handleAddChoice = useCallback((nodeId: string) => {
    if (!effectiveDialogue || !effectiveDialogue.nodes[nodeId]) return;
    const updated = addChoiceToNode(effectiveDialogue.nodes[nodeId]);
    handleUpdateNode(nodeId, updated);
  }, [effectiveDialogue, handleUpdateNode]);

  const handleUpdateChoice = useCallback((nodeId: string, choiceIdx: number, updates: Partial<Choice>) => {
    if (!effectiveDialogue || !effectiveDialogue.nodes[nodeId]) return;
    const updated = updateChoiceInNode(effectiveDialogue.nodes[nodeId], choiceIdx, updates);
    handleUpdateNode(nodeId, updated);
  }, [effectiveDialogue, handleUpdateNode]);

  const handleRemoveChoice = useCallback((nodeId: string, choiceIdx: number) => {
    if (!effectiveDialogue || !effectiveDialogue.nodes[nodeId]) return;
    const updated = removeChoiceFromNode(effectiveDialogue.nodes[nodeId], choiceIdx);
    handleUpdateNode(nodeId, updated);
  }, [effectiveDialogue, handleUpdateNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    try {
      if (!effectiveDialogue) return;
      let newDialogue = deleteNodeFromTree(effectiveDialogue, nodeId);
      
      // Auto-organize if enabled
      if (autoOrganize) {
        const result = applyLayout(newDialogue, layoutStrategy, { direction: layoutDirection });
        newDialogue = result.dialogue;
        setTimeout(() => {
          if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
          }
        }, 50);
      }
      
      onChange(newDialogue);
      setSelectedNodeId(null);
    } catch (e: any) {
      alert(e.message);
    }
  }, [effectiveDialogue, onChange, autoOrganize, layoutDirection, reactFlowInstance]);

  // Handle node drag stop - resolve collisions in freeform mode
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // In freeform mode, resolve collisions after drag
    if (!autoOrganize) {
      if (!effectiveDialogue) return;
      const collisionResolved = resolveNodeCollisions(effectiveDialogue, {
        maxIterations: 50,
        overlapThreshold: 0.3,
        margin: 20,
      });
      
      // Only update if positions actually changed
      const hasChanges = Object.keys(collisionResolved.nodes).some(id => {
        const orig = effectiveDialogue.nodes[id];
        const resolved = collisionResolved.nodes[id];
        return orig && resolved && (orig.x !== resolved.x || orig.y !== resolved.y);
      });
      
      if (hasChanges) {
        onChange(collisionResolved);
      }
    }
  }, [effectiveDialogue, onChange, autoOrganize]);

  // Handle auto-layout with direction (strategy comes from prop)
  const handleAutoLayout = useCallback((direction?: LayoutDirection) => {
    const dir = direction || layoutDirection;
    if (direction) {
      setLayoutDirection(direction);
    }
    if (!effectiveDialogue) return;
    const result = applyLayout(effectiveDialogue, layoutStrategy, { direction: dir });
    onChange(result.dialogue);
    
    // Fit view after a short delay to allow React Flow to update
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      }
    }, 100);
  }, [effectiveDialogue, onChange, reactFlowInstance, layoutDirection, layoutStrategy]);

  return (
    <div className={`dialogue-graph-editor ${className} w-full h-full flex flex-col`}>
      {viewMode === VIEW_MODE.GRAPH && (
        <div className="flex-1 flex overflow-hidden">
          {/* React Flow Graph */}
          <div className="flex-1 relative w-full h-full" ref={reactFlowWrapperRef} style={{ minHeight: 0 }}>
            <ReactFlow
              nodes={nodesWithFlags}
              edges={edges.map(edge => {
                // Detect back-edges (loops) based on layout direction
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                // For TB layout: back-edge if target Y < source Y (going up)
                // For LR layout: back-edge if target X < source X (going left)
                const isBackEdge = showBackEdges && sourceNode && targetNode && (
                  layoutDirection === 'TB' 
                    ? targetNode.position.y < sourceNode.position.y
                    : targetNode.position.x < sourceNode.position.x
                );
                
                const isInPath = edgesToSelectedNode.has(edge.id);
                // Dim edges not in the path when path highlighting is on and something is selected
                const isDimmed = showPathHighlight && selectedNodeId !== null && !isInPath;
                
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    isInPathToSelected: showPathHighlight && isInPath,
                    isBackEdge,
                    isDimmed,
                  },
                };
              })}
              nodeTypes={memoizedNodeTypes}
              edgeTypes={memoizedEdgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onNodeDragStop={onNodeDragStop}
              nodesDraggable={!autoOrganize} // Disable dragging in auto-organize mode
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              onPaneClick={() => {
                // Close context menus and deselect node when clicking on pane (not nodes)
                setContextMenu(null);
                setNodeContextMenu(null);
                setSelectedNodeId(null);
              }}
              fitView
              className="bg-df-canvas-bg"
              style={{ background: 'radial-gradient(circle, var(--color-df-canvas-grid) 1px, var(--color-df-canvas-bg) 1px)', backgroundSize: '20px 20px' }}
              defaultEdgeOptions={{ type: 'default' }}
              connectionLineStyle={{ stroke: '#e94560', strokeWidth: 2 }}
              connectionLineType={ConnectionLineType.SmoothStep}
              snapToGrid={false}
              nodesConnectable={true}
              elementsSelectable={true}
              selectionOnDrag={true}
              panOnDrag={true} // Enable panning when dragging empty space (left-click or trackpad drag)
              panOnScroll={true} // Pan with Shift+Scroll (allows both horizontal and vertical panning)
              zoomOnScroll={true} // Scroll/trackpad scroll to zoom (when Shift not held)
              zoomOnPinch={true} // Pinch to zoom on trackpad
              preventScrolling={false} // Allow native scrolling for panning
              // Behavior:
              // - Click and drag a node = moves the node (React Flow handles this automatically)
              // - Click and drag empty space = pans canvas
              // - Trackpad two-finger swipe = pans canvas (works with panOnDrag)
              // - Scroll wheel/trackpad scroll = zooms
              // - Shift+Scroll = pans
              // Note: React Flow automatically detects if you're dragging a node vs empty space
              zoomOnDoubleClick={false}
              minZoom={0.1}
              maxZoom={3}
              deleteKeyCode={['Delete', 'Backspace']}
              tabIndex={0}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a2e" />
              
              <GraphMiniMap showMiniMap={showMiniMap || false} />
              
              <GraphLeftToolbar
                layoutStrategy={layoutStrategy}
                onLayoutStrategyChange={onLayoutStrategyChange}
                onApplyLayout={handleAutoLayout}
                showMiniMap={showMiniMap}
                onToggleMiniMap={onToggleMiniMap}
                onOpenFlagManager={onOpenFlagManager}
                onOpenGuide={onOpenGuide}
                onLoadExampleDialogue={onLoadExampleDialogue}
                onLoadExampleFlags={onLoadExampleFlags}
              />
              
              <GraphLayoutControls
                autoOrganize={autoOrganize}
                onToggleAutoOrganize={() => {
                  const newAutoOrganize = !autoOrganize;
                  setAutoOrganize(newAutoOrganize);
                  if (newAutoOrganize) {
                    handleAutoLayout();
                  }
                }}
                layoutDirection={layoutDirection}
                onLayoutDirectionChange={(dir) => {
                  setLayoutDirection(dir);
                  handleAutoLayout(dir);
                }}
                onApplyLayout={handleAutoLayout}
                showPathHighlight={showPathHighlight}
                onTogglePathHighlight={() => setShowPathHighlight(!showPathHighlight)}
                showBackEdges={showBackEdges}
                onToggleBackEdges={() => setShowBackEdges(!showBackEdges)}
                onGoToStart={() => {
                  if (effectiveDialogue?.startNodeId) {
                    setSelectedNodeId(effectiveDialogue.startNodeId);
                    const startNode = nodes.find(n => n.id === effectiveDialogue.startNodeId);
                    if (startNode && reactFlowInstance) {
                      reactFlowInstance.setCenter(
                        startNode.position.x + 110,
                        startNode.position.y + 60,
                        { zoom: 1, duration: 500 }
                      );
                    }
                  }
                }}
                onGoToEnd={() => {
                  const endNodes = Array.from(endNodeIds);
                  if (endNodes.length > 0) {
                    const currentIdx = selectedNodeId ? endNodes.indexOf(selectedNodeId) : -1;
                    const nextIdx = (currentIdx + 1) % endNodes.length;
                    const nextEndNodeId = endNodes[nextIdx];
                    setSelectedNodeId(nextEndNodeId);
                    const endNode = nodes.find(n => n.id === nextEndNodeId);
                    if (endNode && reactFlowInstance) {
                      reactFlowInstance.setCenter(
                        endNode.position.x + 110,
                        endNode.position.y + 60,
                        { zoom: 1, duration: 500 }
                      );
                    }
                  }
                }}
                endNodeCount={endNodeIds.size}
              />
              
              {contextMenu && (
                <DailogueGraphEditorPaneContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  graphX={contextMenu.graphX}
                  graphY={contextMenu.graphY}
                  onAddNode={(type, x, y) => handleAddNode(type, x, y)}
                  onClose={() => setContextMenu(null)}
                />
              )}

              {edgeDropMenu && (() => {
                const sourceNode = effectiveDialogue.nodes[edgeDropMenu.fromNodeId];
                if (!sourceNode) return null;
                
                if (sourceNode.type === NODE_TYPE.PLAYER) {
                  return (
                    <PlayerEdgeDropMenu
                      x={edgeDropMenu.x}
                      y={edgeDropMenu.y}
                      graphX={edgeDropMenu.graphX}
                      graphY={edgeDropMenu.graphY}
                      fromNodeId={edgeDropMenu.fromNodeId}
                      fromChoiceIdx={edgeDropMenu.fromChoiceIdx}
                      sourceHandle={edgeDropMenu.sourceHandle}
                      onAddNode={(type, x, y, autoConnect) => handleAddNode(type, x, y, autoConnect)}
                      onClose={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.NPC) {
                  return (
                    <NPCEdgeDropMenu
                      x={edgeDropMenu.x}
                      y={edgeDropMenu.y}
                      graphX={edgeDropMenu.graphX}
                      graphY={edgeDropMenu.graphY}
                      fromNodeId={edgeDropMenu.fromNodeId}
                      sourceHandle={edgeDropMenu.sourceHandle}
                      onAddNode={(type, x, y, autoConnect) => handleAddNode(type, x, y, autoConnect)}
                      onClose={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.STORYLET) {
                  return (
                    <StoryletEdgeDropMenu
                      x={edgeDropMenu.x}
                      y={edgeDropMenu.y}
                      graphX={edgeDropMenu.graphX}
                      graphY={edgeDropMenu.graphY}
                      fromNodeId={edgeDropMenu.fromNodeId}
                      sourceHandle={edgeDropMenu.sourceHandle}
                      onAddNode={(type, x, y, autoConnect) => handleAddNode(type, x, y, autoConnect)}
                      onClose={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.STORYLET_POOL) {
                  return (
                    <StoryletPoolEdgeDropMenu
                      x={edgeDropMenu.x}
                      y={edgeDropMenu.y}
                      graphX={edgeDropMenu.graphX}
                      graphY={edgeDropMenu.graphY}
                      fromNodeId={edgeDropMenu.fromNodeId}
                      sourceHandle={edgeDropMenu.sourceHandle}
                      onAddNode={(type, x, y, autoConnect) => handleAddNode(type, x, y, autoConnect)}
                      onClose={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.CONDITIONAL) {
                  return (
                    <ConditionalEdgeDropMenu
                      x={edgeDropMenu.x}
                      y={edgeDropMenu.y}
                      graphX={edgeDropMenu.graphX}
                      graphY={edgeDropMenu.graphY}
                      fromNodeId={edgeDropMenu.fromNodeId}
                      fromBlockIdx={edgeDropMenu.fromBlockIdx}
                      sourceHandle={edgeDropMenu.sourceHandle}
                      onAddNode={(type, x, y, autoConnect) => handleAddNode(type, x, y, autoConnect)}
                      onClose={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                    />
                  );
                }
                
                return null;
              })()}

              {edgeContextMenu && (() => {
                const edge = edges.find(e => e.id === edgeContextMenu.edgeId);
                if (!edge) return null;
                const sourceNode = effectiveDialogue.nodes[edge.source];
                if (!sourceNode) return null;
                
                if (sourceNode.type === NODE_TYPE.PLAYER) {
                  return (
                    <PlayerEdgeContextMenu
                      x={edgeContextMenu.x}
                      y={edgeContextMenu.y}
                      edgeId={edgeContextMenu.edgeId}
                      graphX={edgeContextMenu.graphX}
                      graphY={edgeContextMenu.graphY}
                      onInsertNode={(type, edgeId, x, y) => handleInsertNode(type, edgeId, x, y)}
                      onClose={() => setEdgeContextMenu(null)}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.NPC) {
                  return (
                    <NPCEdgeContextMenu
                      x={edgeContextMenu.x}
                      y={edgeContextMenu.y}
                      edgeId={edgeContextMenu.edgeId}
                      graphX={edgeContextMenu.graphX}
                      graphY={edgeContextMenu.graphY}
                      onInsertNode={(type, edgeId, x, y) => handleInsertNode(type, edgeId, x, y)}
                      onClose={() => setEdgeContextMenu(null)}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.STORYLET) {
                  return (
                    <StoryletEdgeContextMenu
                      x={edgeContextMenu.x}
                      y={edgeContextMenu.y}
                      edgeId={edgeContextMenu.edgeId}
                      graphX={edgeContextMenu.graphX}
                      graphY={edgeContextMenu.graphY}
                      onInsertNode={(type, edgeId, x, y) => handleInsertNode(type, edgeId, x, y)}
                      onClose={() => setEdgeContextMenu(null)}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.STORYLET_POOL) {
                  return (
                    <StoryletPoolEdgeContextMenu
                      x={edgeContextMenu.x}
                      y={edgeContextMenu.y}
                      edgeId={edgeContextMenu.edgeId}
                      graphX={edgeContextMenu.graphX}
                      graphY={edgeContextMenu.graphY}
                      onInsertNode={(type, edgeId, x, y) => handleInsertNode(type, edgeId, x, y)}
                      onClose={() => setEdgeContextMenu(null)}
                    />
                  );
                }
                
                if (sourceNode.type === NODE_TYPE.CONDITIONAL) {
                  return (
                    <ConditionalEdgeContextMenu
                      x={edgeContextMenu.x}
                      y={edgeContextMenu.y}
                      edgeId={edgeContextMenu.edgeId}
                      graphX={edgeContextMenu.graphX}
                      graphY={edgeContextMenu.graphY}
                      onInsertNode={(type, edgeId, x, y) => handleInsertNode(type, edgeId, x, y)}
                      onClose={() => setEdgeContextMenu(null)}
                    />
                  );
                }
                
                return null;
              })()}

              {nodeContextMenu && (() => {
                const node = effectiveDialogue.nodes[nodeContextMenu.nodeId];
                if (!node) return null;
                
                if (node.type === NODE_TYPE.PLAYER) {
                  return (
                    <PlayerNodeContextMenu
                      x={nodeContextMenu.x}
                      y={nodeContextMenu.y}
                      nodeId={nodeContextMenu.nodeId}
                      isStartNode={node.id === effectiveDialogue.startNodeId}
                      onEdit={() => setSelectedNodeId(nodeContextMenu.nodeId)}
                      onAddChoice={() => handleAddChoice(nodeContextMenu.nodeId)}
                      onDelete={node.id !== effectiveDialogue.startNodeId ? () => handleDeleteNode(nodeContextMenu.nodeId) : undefined}
                      onClose={() => setNodeContextMenu(null)}
                    />
                  );
                }
                
                if (node.type === NODE_TYPE.NPC) {
                  return (
                    <NPCNodeContextMenu
                      x={nodeContextMenu.x}
                      y={nodeContextMenu.y}
                      nodeId={nodeContextMenu.nodeId}
                      isStartNode={node.id === effectiveDialogue.startNodeId}
                      hasConditionals={!!node.conditionalBlocks}
                      onEdit={() => setSelectedNodeId(nodeContextMenu.nodeId)}
                      onAddConditionals={!node.conditionalBlocks ? () => {
                        handleUpdateNode(nodeContextMenu.nodeId, {
                          conditionalBlocks: [{
                            id: `block_${Date.now()}`,
                            type: 'if',
                            condition: [],
                            content: node.content,
                            speaker: node.speaker
                          }]
                        });
                        setSelectedNodeId(nodeContextMenu.nodeId);
                      } : undefined}
                      onDelete={node.id !== effectiveDialogue.startNodeId ? () => handleDeleteNode(nodeContextMenu.nodeId) : undefined}
                      onClose={() => setNodeContextMenu(null)}
                    />
                  );
                }
                
                if (node.type === NODE_TYPE.CONDITIONAL) {
                  return (
                    <ConditionalNodeContextMenu
                      x={nodeContextMenu.x}
                      y={nodeContextMenu.y}
                      nodeId={nodeContextMenu.nodeId}
                      isStartNode={node.id === effectiveDialogue.startNodeId}
                      onEdit={() => setSelectedNodeId(nodeContextMenu.nodeId)}
                      onDelete={node.id !== effectiveDialogue.startNodeId ? () => handleDeleteNode(nodeContextMenu.nodeId) : undefined}
                      onClose={() => setNodeContextMenu(null)}
                    />
                  );
                }
                
                if (node.type === NODE_TYPE.STORYLET) {
                  return (
                    <StoryletNodeContextMenu
                      x={nodeContextMenu.x}
                      y={nodeContextMenu.y}
                      nodeId={nodeContextMenu.nodeId}
                      isStartNode={node.id === effectiveDialogue.startNodeId}
                      onEdit={() => setSelectedNodeId(nodeContextMenu.nodeId)}
                      onDelete={node.id !== effectiveDialogue.startNodeId ? () => handleDeleteNode(nodeContextMenu.nodeId) : undefined}
                      onClose={() => setNodeContextMenu(null)}
                    />
                  );
                }
                
                if (node.type === NODE_TYPE.STORYLET_POOL) {
                  return (
                    <StoryletPoolNodeContextMenu
                      x={nodeContextMenu.x}
                      y={nodeContextMenu.y}
                      nodeId={nodeContextMenu.nodeId}
                      isStartNode={node.id === effectiveDialogue.startNodeId}
                      onEdit={() => setSelectedNodeId(nodeContextMenu.nodeId)}
                      onDelete={node.id !== effectiveDialogue.startNodeId ? () => handleDeleteNode(nodeContextMenu.nodeId) : undefined}
                      onClose={() => setNodeContextMenu(null)}
                    />
                  );
                }
                
                return null;
              })()}
            </ReactFlow>
          </div>

          {/* Node Editor Sidebar */}
          {selectedNode && (
            <NodeEditor
              node={selectedNode}
              dialogue={effectiveDialogue}
              characters={characters}
              onUpdate={(updates) => handleUpdateNode(selectedNode.id, updates)}
              onFocusNode={(nodeId) => {
                const targetNode = nodes.find(n => n.id === nodeId);
                if (targetNode && reactFlowInstance) {
                  // Set selectedNodeId first so NodeEditor updates
                  setSelectedNodeId(nodeId);
                  
                  // Update nodes using React Flow instance to ensure proper selection
                  const allNodes = reactFlowInstance.getNodes();
                  const updatedNodes = allNodes.map((n: Node) => ({
                    ...n,
                    selected: n.id === nodeId
                  }));
                  reactFlowInstance.setNodes(updatedNodes);
                  
                  // Also update local state to keep in sync
                  setNodes(updatedNodes);
                  
                  // Focus on the target node with animation
                  setTimeout(() => {
                    reactFlowInstance.fitView({ 
                      nodes: [{ id: nodeId }], 
                      padding: 0.2, 
                      duration: 500,
                      minZoom: 0.5,
                      maxZoom: 2
                    });
                  }, 0);
                }
              }}
              onDelete={() => handleDeleteNode(selectedNode.id)}
              onAddChoice={() => handleAddChoice(selectedNode.id)}
              onUpdateChoice={(idx, updates) => handleUpdateChoice(selectedNode.id, idx, updates)}
              onRemoveChoice={(idx) => handleRemoveChoice(selectedNode.id, idx)}
              onClose={() => setSelectedNodeId(null)}
              flagSchema={flagSchema}
            />
          )}
        </div>
      )}

      {viewMode === VIEW_MODE.YARN && (
        <YarnView
          dialogue={effectiveDialogue}
          onExport={() => {
            const yarn = exportToYarn(effectiveDialogue);
            if (onExportYarn) {
              onExportYarn(yarn);
            } else {
              // Default: download file
              const blob = new Blob([yarn], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${effectiveDialogue.title.replace(/\s+/g, '_')}.yarn`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          onImport={(yarn) => {
            try {
              const importedDialogue = importFromYarn(yarn, effectiveDialogue.title);
              onChange(importedDialogue);
            } catch (err) {
              console.error('Failed to import Yarn:', err);
              alert('Failed to import Yarn file. Please check the format.');
            }
          }}
          onChange={onChange}
        />
      )}

      {viewMode === VIEW_MODE.PLAY && (
        <PlayView
          dialogue={effectiveDialogue}
          flagSchema={flagSchema}
          gameStateFlags={gameStateFlags}
        />
      )}
    </div>
  );
}

export function DialogueGraphEditor(props: DialogueEditorProps & { 
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>; // Characters from game state
  initialViewMode?: ViewMode;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  layoutStrategy?: string;
  onLayoutStrategyChange?: (strategy: string) => void;
  onOpenFlagManager?: () => void;
  onOpenGuide?: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
}) {
  return (
    <ReactFlowProvider>
      <DialogueGraphEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
