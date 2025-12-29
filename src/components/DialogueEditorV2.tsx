/**
 * Dialogue Editor V2 - React Flow Implementation
 * 
 * This is the new version using React Flow for graph rendering.
 * See V2_MIGRATION_PLAN.md for implementation details.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  Panel,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';
import { Edit3, Plus, Trash2, Play, Layout, ArrowDown, ArrowRight, Magnet, Sparkles, Undo2, Flag, Home, Target, BookOpen, Settings, Grid3x3 } from 'lucide-react';
import { ExampleLoaderButton } from './ExampleLoaderButton';
import { ENABLE_DEBUG_TOOLS } from '../utils/feature-flags';
import 'reactflow/dist/style.css';

import { DialogueEditorProps, DialogueTree, DialogueNode, Choice, ConditionalBlock, ViewMode } from '../types';
import { exportToYarn, importFromYarn } from '../lib/yarn-converter';
import { convertDialogueTreeToReactFlow, updateDialogueTreeFromReactFlow, CHOICE_COLORS } from '../utils/reactflow-converter';
import { createNode, deleteNodeFromTree, addChoiceToNode, removeChoiceFromNode, updateChoiceInNode } from '../utils/node-helpers';
import { applyLayout, listLayouts, resolveNodeCollisions, LayoutDirection, type LayoutStrategy } from '../utils/layout';
import { NodeEditor } from './NodeEditor';
import { YarnView } from './YarnView';
import { PlayView } from './PlayView';
import { NPCNodeV2 } from './NPCNodeV2';
import { PlayerNodeV2 } from './PlayerNodeV2';
import { ConditionalNodeV2 } from './ConditionalNodeV2';
import { ChoiceEdgeV2 } from './ChoiceEdgeV2';
import { NPCEdgeV2 } from './NPCEdgeV2';
import { FlagSchema } from '../types/flags';
import { Character } from '../types/characters';
import { NODE_WIDTH } from '../utils/constants';

// Define node and edge types outside component for stability
const nodeTypes = {
  npc: NPCNodeV2,
  player: PlayerNodeV2,
  conditional: ConditionalNodeV2,
};

const edgeTypes = {
  choice: ChoiceEdgeV2,
  default: NPCEdgeV2, // Use custom component for NPC edges instead of React Flow default
};

interface DialogueEditorV2InternalProps extends DialogueEditorProps {
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>; // Characters from game state
  initialViewMode?: ViewMode;
  viewMode?: ViewMode; // Controlled view mode (if provided, overrides initialViewMode)
  onViewModeChange?: (mode: ViewMode) => void; // Callback when view mode changes
  layoutStrategy?: string; // Layout strategy ID from parent
  onLayoutStrategyChange?: (strategy: string) => void;
  onOpenFlagManager?: () => void;
  onOpenGuide?: () => void;
  onLoadExampleDialogue?: (dialogue: DialogueTree) => void;
  onLoadExampleFlags?: (flags: FlagSchema) => void;
  // Event hooks from DialogueEditorProps are already included
}

function DialogueEditorV2Internal({
  dialogue,
  onChange,
  onExportYarn,
  onExportJSON,
  className = '',
  showTitleEditor = true,
  flagSchema,
  characters = {},
  initialViewMode = 'graph',
  viewMode: controlledViewMode,
  onViewModeChange,
  layoutStrategy: propLayoutStrategy = 'dagre', // Accept from parent
  onLayoutStrategyChange,
  onOpenFlagManager,
  onOpenGuide,
  onLoadExampleDialogue,
  onLoadExampleFlags,
  // Event hooks
  onNodeAdd,
  onNodeDelete,
  onNodeUpdate,
  onConnect: onConnectHook,
  onDisconnect,
  onNodeSelect,
  onNodeDoubleClick: onNodeDoubleClickHook,
}: DialogueEditorV2InternalProps) {
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
  const [showLayoutMenu, setShowLayoutMenu] = useState<boolean>(false);
  const lastWheelClickRef = useRef<number>(0);

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

  // Find all edges that lead to the selected node by tracing FORWARD from start
  // This avoids including back-edges and only shows the actual forward path
  const { edgesToSelectedNode, nodeDepths } = useMemo(() => {
    if (!selectedNodeId || !dialogue || !dialogue.startNodeId) {
      return { edgesToSelectedNode: new Set<string>(), nodeDepths: new Map<string, number>() };
    }
    
    // Step 1: Find all forward paths from start that reach the selected node
    // Use DFS to trace forward, tracking the path
    const nodesOnPath = new Set<string>();
    const edgesOnPath = new Set<string>();
    const nodeDepthMap = new Map<string, number>();
    
    // DFS that returns true if this path leads to the selected node
    const findPathToTarget = (
      currentNodeId: string, 
      visitedInPath: Set<string>,
      depth: number
    ): boolean => {
      // Found the target!
      if (currentNodeId === selectedNodeId) {
        nodesOnPath.add(currentNodeId);
        nodeDepthMap.set(currentNodeId, depth);
        return true;
      }
      
      // Avoid cycles in THIS path (back-edges)
      if (visitedInPath.has(currentNodeId)) {
        return false;
      }
      
      const node = dialogue.nodes[currentNodeId];
      if (!node) return false;
      
      visitedInPath.add(currentNodeId);
      let foundPath = false;
      
      // Check NPC nextNodeId
      if (node.nextNodeId && dialogue.nodes[node.nextNodeId]) {
        if (findPathToTarget(node.nextNodeId, new Set(visitedInPath), depth + 1)) {
          foundPath = true;
          edgesOnPath.add(`${currentNodeId}-next`);
        }
      }
      
      // Check player choices
      if (node.choices) {
        node.choices.forEach((choice: Choice, idx: number) => {
          if (choice.nextNodeId && dialogue.nodes[choice.nextNodeId]) {
            if (findPathToTarget(choice.nextNodeId, new Set(visitedInPath), depth + 1)) {
              foundPath = true;
              edgesOnPath.add(`${currentNodeId}-choice-${idx}`);
            }
          }
        });
      }
      
      // Check conditional blocks
      if (node.conditionalBlocks) {
        node.conditionalBlocks.forEach((block: ConditionalBlock, idx: number) => {
          if (block.nextNodeId && dialogue.nodes[block.nextNodeId]) {
            if (findPathToTarget(block.nextNodeId, new Set(visitedInPath), depth + 1)) {
              foundPath = true;
              edgesOnPath.add(`${currentNodeId}-block-${idx}`);
            }
          }
        });
      }
      
      // If any path from this node leads to target, include this node
      if (foundPath) {
        nodesOnPath.add(currentNodeId);
        // Keep the minimum depth (closest to start)
        if (!nodeDepthMap.has(currentNodeId) || nodeDepthMap.get(currentNodeId)! > depth) {
          nodeDepthMap.set(currentNodeId, depth);
        }
      }
      
      return foundPath;
    };
    
    // Start the search from the dialogue's start node
    findPathToTarget(dialogue.startNodeId, new Set(), 0);
    
    return { edgesToSelectedNode: edgesOnPath, nodeDepths: nodeDepthMap };
  }, [selectedNodeId, dialogue]);

  // Update nodes/edges when dialogue changes externally
  // Skip conversion if we just made a direct React Flow update (for simple text changes)
  React.useEffect(() => {
    if (dialogue) {
      // If we just updated a node directly in React Flow, skip full conversion
      // The direct update already handled the visual change
      if (directUpdateRef.current) {
        directUpdateRef.current = null; // Clear the flag
        return; // Skip conversion - React Flow is already updated
      }
      
      const { nodes: newNodes, edges: newEdges } = convertDialogueTreeToReactFlow(dialogue, layoutDirection);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [dialogue, layoutDirection]);

  // Calculate end nodes (nodes with no outgoing connections)
  const endNodeIds = useMemo(() => {
    if (!dialogue) return new Set<string>();
    const ends = new Set<string>();
    Object.values(dialogue.nodes).forEach(node => {
      const hasNextNode = !!node.nextNodeId;
      const hasChoiceConnections = node.choices?.some(c => c.nextNodeId) || false;
      const hasBlockConnections = node.conditionalBlocks?.some(b => b.nextNodeId) || false;
      if (!hasNextNode && !hasChoiceConnections && !hasBlockConnections) {
        ends.add(node.id);
      }
    });
    return ends;
  }, [dialogue]);

  // Add flagSchema, characters, dim state, and layout direction to node data
  const nodesWithFlags = useMemo(() => {
    const hasSelection = selectedNodeId !== null && showPathHighlight;
    const startNodeId = dialogue?.startNodeId;
    
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
  }, [nodes, flagSchema, characters, nodeDepths, selectedNodeId, layoutDirection, showPathHighlight, dialogue, endNodeIds]);

  if (!dialogue) {
    return (
      <div className={`dialogue-editor-v2-empty ${className}`}>
        <p>No dialogue loaded. Please provide a dialogue tree.</p>
      </div>
    );
  }

  // Get selected node - use useMemo to ensure it updates when dialogue changes
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !dialogue) return null;
    const node = dialogue.nodes[selectedNodeId];
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
  }, [selectedNodeId, dialogue]);

  // Handle node deletion (multi-delete support)
  const onNodesDelete = useCallback((deleted: Node[]) => {
    let updatedNodes = { ...dialogue.nodes };
    let shouldClearSelection = false;
    
    deleted.forEach(node => {
      const dialogueNode = dialogue.nodes[node.id];
      delete updatedNodes[node.id];
      if (selectedNodeId === node.id) {
        shouldClearSelection = true;
      }
      // Call onNodeDelete hook
      onNodeDelete?.(node.id);
    });
    
    let newDialogue = { ...dialogue, nodes: updatedNodes };
    
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
  }, [dialogue, onChange, selectedNodeId, autoOrganize, layoutDirection, reactFlowInstance]);

  // Handle node changes (drag, delete, etc.)
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    
    // Handle deletions (backup in case onNodesDelete doesn't fire)
    const deletions = changes.filter(c => c.type === 'remove');
    if (deletions.length > 0) {
      let updatedNodes = { ...dialogue.nodes };
      let shouldClearSelection = false;
      
      deletions.forEach(change => {
        if (change.type === 'remove') {
          delete updatedNodes[change.id];
          if (selectedNodeId === change.id) {
            shouldClearSelection = true;
          }
        }
      });
      
      onChange({ ...dialogue, nodes: updatedNodes });
      if (shouldClearSelection) {
        setSelectedNodeId(null);
      }
    }
    
    // Sync position changes back to DialogueTree
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const node = dialogue.nodes[change.id];
        if (node && (node.x !== change.position.x || node.y !== change.position.y)) {
          // Create a new node object to avoid mutating the original
          const updatedNode = {
            ...dialogue.nodes[change.id],
            x: change.position.x,
            y: change.position.y,
          };
          onChange({
            ...dialogue,
            nodes: {
              ...dialogue.nodes,
              [change.id]: updatedNode,
            },
          });
        }
      }
    });
  }, [dialogue, onChange, selectedNodeId]);

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
          const sourceNode = dialogue.nodes[edge.source];
          if (sourceNode) {
            if (edge.sourceHandle === 'next' && sourceNode.type === 'npc') {
              // Remove NPC next connection
              onChange({
                ...dialogue,
                nodes: {
                  ...dialogue.nodes,
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
                  ...dialogue,
                  nodes: {
                    ...dialogue.nodes,
                    [edge.source]: updated,
                  },
                });
              }
            } else if (edge.sourceHandle?.startsWith('block-') && sourceNode.type === 'conditional') {
              // Remove Conditional block connection
              const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
              if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
                const updatedBlocks = [...sourceNode.conditionalBlocks];
                updatedBlocks[blockIdx] = {
                  ...updatedBlocks[blockIdx],
                  nextNodeId: undefined,
                };
                onChange({
                  ...dialogue,
                  nodes: {
                    ...dialogue.nodes,
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
  }, [dialogue, onChange, edges]);

  // Handle edge deletion (when Delete key is pressed on selected edges)
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      // Call onDisconnect hook
      onDisconnect?.(edge.id, edge.source, edge.target);
      
      const sourceNode = dialogue.nodes[edge.source];
      if (sourceNode) {
        if (edge.sourceHandle === 'next' && sourceNode.type === 'npc') {
          // Remove NPC next connection
          onChange({
            ...dialogue,
            nodes: {
              ...dialogue.nodes,
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
              ...dialogue,
              nodes: {
                ...dialogue.nodes,
                [edge.source]: updated,
              },
            });
          }
        } else if (edge.sourceHandle?.startsWith('block-') && sourceNode.type === 'conditional') {
          // Remove Conditional block connection
          const blockIdx = parseInt(edge.sourceHandle.replace('block-', ''));
          if (sourceNode.conditionalBlocks && sourceNode.conditionalBlocks[blockIdx]) {
            const updatedBlocks = [...sourceNode.conditionalBlocks];
            updatedBlocks[blockIdx] = {
              ...updatedBlocks[blockIdx],
              nextNodeId: undefined,
            };
            onChange({
              ...dialogue,
              nodes: {
                ...dialogue.nodes,
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
  }, [dialogue, onChange]);

  // Handle connection start (track what we're connecting from)
  const onConnectStart = useCallback((_event: React.MouseEvent | React.TouchEvent, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
    if (!nodeId) return;
    const sourceNode = dialogue.nodes[nodeId];
    if (!sourceNode) return;
    
    if (handleId === 'next' && sourceNode.type === 'npc') {
      connectingRef.current = { fromNodeId: nodeId, sourceHandle: 'next' };
    } else if (handleId?.startsWith('choice-')) {
      const choiceIdx = parseInt(handleId.replace('choice-', ''));
      connectingRef.current = { fromNodeId: nodeId, fromChoiceIdx: choiceIdx, sourceHandle: handleId };
    } else if (handleId?.startsWith('block-')) {
      const blockIdx = parseInt(handleId.replace('block-', ''));
      connectingRef.current = { fromNodeId: nodeId, fromBlockIdx: blockIdx, sourceHandle: handleId };
    }
  }, [dialogue]);

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
    if (!connection.source || !connection.target) return;
    
    const newEdge = addEdge(connection, edges);
    setEdges(newEdge);
    setEdgeDropMenu(null); // Close edge drop menu if open
    
    // Call onConnect hook
    onConnectHook?.(connection.source, connection.target, connection.sourceHandle || undefined);
    
    // Update DialogueTree
    const sourceNode = dialogue.nodes[connection.source];
    if (!sourceNode) return;
    
    if (connection.sourceHandle === 'next' && sourceNode.type === 'npc') {
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
    } else if (connection.sourceHandle?.startsWith('block-') && sourceNode.type === 'conditional') {
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
  }, [dialogue, onChange, edges]);

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

  // Handle pane double-click - fit view to all nodes (like default zoom)
  // We'll handle this via useEffect since React Flow doesn't have onPaneDoubleClick
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      // Check if clicking on the pane (not on a node or edge)
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) {
        return; // Don't handle if clicking on node/edge
      }
      
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      }
    };

    const container = reactFlowWrapperRef.current;
    if (container) {
      container.addEventListener('dblclick', handleDoubleClick);
      return () => {
        container.removeEventListener('dblclick', handleDoubleClick);
      };
    }
  }, [reactFlowInstance]);

  // Track mouse wheel clicks for double-click detection
  useEffect(() => {
    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.button === 1) { // Middle mouse button (wheel)
        const now = Date.now();
        if (now - lastWheelClickRef.current < 300) {
          // Double-click detected - fit view
          mouseEvent.preventDefault();
          if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
          }
          lastWheelClickRef.current = 0;
        } else {
          lastWheelClickRef.current = now;
        }
      }
    };

    const container = document.querySelector('.react-flow');
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [reactFlowInstance]);

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
  const handleInsertNode = useCallback((type: 'npc' | 'player' | 'conditional', edgeId: string, x: number, y: number) => {
    // Find the edge
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    // Get the source and target nodes
    const sourceNode = dialogue.nodes[edge.source];
    const targetNode = dialogue.nodes[edge.target];
    if (!sourceNode || !targetNode) return;
    
    // Create new node
    const newId = `${type}_${Date.now()}`;
    const newNode = createNode(type, newId, x, y);
    
    // Update dialogue tree: break old connection, add new node, connect source->new->target
    const updatedNodes = { ...dialogue.nodes, [newId]: newNode };
    
    // Break the old connection and reconnect through new node
    if (edge.sourceHandle === 'next' && sourceNode.type === 'npc') {
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
      ...dialogue,
      nodes: updatedNodes,
    });
    
    setEdgeContextMenu(null);
  }, [dialogue, onChange, edges]);

  // Add node from context menu or edge drop
  const handleAddNode = useCallback((type: 'npc' | 'player' | 'conditional', x: number, y: number, autoConnect?: { fromNodeId: string; fromChoiceIdx?: number; fromBlockIdx?: number; sourceHandle?: string }) => {
    const newId = `${type}_${Date.now()}`;
    const newNode = createNode(type, newId, x, y);
    
    // Call onNodeAdd hook
    onNodeAdd?.(newNode);
    
    // Build the complete new dialogue state in one go
    let newDialogue = {
      ...dialogue,
      nodes: { ...dialogue.nodes, [newId]: newNode }
    };
    
    // If auto-connecting, include that connection
    if (autoConnect) {
      const sourceNode = dialogue.nodes[autoConnect.fromNodeId];
      if (sourceNode) {
        if (autoConnect.sourceHandle === 'next' && sourceNode.type === 'npc') {
          newDialogue.nodes[autoConnect.fromNodeId] = { ...sourceNode, nextNodeId: newId };
        } else if (autoConnect.fromChoiceIdx !== undefined && sourceNode.choices) {
          const newChoices = [...sourceNode.choices];
          newChoices[autoConnect.fromChoiceIdx] = { ...newChoices[autoConnect.fromChoiceIdx], nextNodeId: newId };
          newDialogue.nodes[autoConnect.fromNodeId] = { ...sourceNode, choices: newChoices };
        } else if (autoConnect.fromBlockIdx !== undefined && sourceNode.type === 'conditional' && sourceNode.conditionalBlocks) {
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
  }, [dialogue, onChange, autoOrganize, layoutDirection, reactFlowInstance]);

  // Handle node updates
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<DialogueNode>) => {
    const updatedNode = { ...dialogue.nodes[nodeId], ...updates };
    
    // Check if this is a "simple" update (just text/content changes, not structural)
    // Simple updates: speaker, content, characterId (non-structural properties)
    // Structural updates: choices, conditionalBlocks, nextNodeId (affect edges/connections)
    const isSimpleUpdate = Object.keys(updates).every(key => 
      ['speaker', 'content', 'characterId', 'setFlags'].includes(key)
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
      ...dialogue,
      nodes: {
        ...dialogue.nodes,
        [nodeId]: updatedNode
      }
    });
    
    // Call onNodeUpdate hook
    onNodeUpdate?.(nodeId, updates);
  }, [dialogue, onChange, onNodeUpdate, reactFlowInstance]);

  // Handle choice updates
  const handleAddChoice = useCallback((nodeId: string) => {
    const updated = addChoiceToNode(dialogue.nodes[nodeId]);
    handleUpdateNode(nodeId, updated);
  }, [dialogue, handleUpdateNode]);

  const handleUpdateChoice = useCallback((nodeId: string, choiceIdx: number, updates: Partial<Choice>) => {
    const updated = updateChoiceInNode(dialogue.nodes[nodeId], choiceIdx, updates);
    handleUpdateNode(nodeId, updated);
  }, [dialogue, handleUpdateNode]);

  const handleRemoveChoice = useCallback((nodeId: string, choiceIdx: number) => {
    const updated = removeChoiceFromNode(dialogue.nodes[nodeId], choiceIdx);
    handleUpdateNode(nodeId, updated);
  }, [dialogue, handleUpdateNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    try {
      let newDialogue = deleteNodeFromTree(dialogue, nodeId);
      
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
  }, [dialogue, onChange, autoOrganize, layoutDirection, reactFlowInstance]);

  // Handle node drag stop - resolve collisions in freeform mode
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // In freeform mode, resolve collisions after drag
    if (!autoOrganize) {
      const collisionResolved = resolveNodeCollisions(dialogue, {
        maxIterations: 50,
        overlapThreshold: 0.3,
        margin: 20,
      });
      
      // Only update if positions actually changed
      const hasChanges = Object.keys(collisionResolved.nodes).some(id => {
        const orig = dialogue.nodes[id];
        const resolved = collisionResolved.nodes[id];
        return orig && resolved && (orig.x !== resolved.x || orig.y !== resolved.y);
      });
      
      if (hasChanges) {
        onChange(collisionResolved);
      }
    }
  }, [dialogue, onChange, autoOrganize]);

  // Handle auto-layout with direction (strategy comes from prop)
  const handleAutoLayout = useCallback((direction?: LayoutDirection) => {
    const dir = direction || layoutDirection;
    if (direction) {
      setLayoutDirection(direction);
    }
    const result = applyLayout(dialogue, layoutStrategy, { direction: dir });
    onChange(result.dialogue);
    
    // Fit view after a short delay to allow React Flow to update
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      }
    }, 100);
  }, [dialogue, onChange, reactFlowInstance, layoutDirection, layoutStrategy]);

  return (
    <div className={`dialogue-editor-v2 ${className} w-full h-full flex flex-col`}>
      {viewMode === 'graph' && (
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
                setShowLayoutMenu(false);
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
              
              {/* Enhanced MiniMap with title */}
              <Panel position="bottom-right" className="!p-0 !m-2">
                <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg overflow-hidden shadow-xl">
                  <div className="px-3 py-1.5 border-b border-df-sidebar-border flex items-center justify-between bg-df-elevated">
                    <span className="text-[10px] font-medium text-df-text-secondary uppercase tracking-wider">Overview</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-df-npc-selected" title="NPC Node" />
                      <span className="w-2 h-2 rounded-full bg-df-player-selected" title="Player Node" />
                      <span className="w-2 h-2 rounded-full bg-df-conditional-border" title="Conditional" />
                    </div>
                  </div>
                  <MiniMap 
                    style={{ 
                      width: 180, 
                      height: 120,
                      backgroundColor: '#08080c',
                    }}
                    maskColor="rgba(0, 0, 0, 0.7)"
                    nodeColor={(node) => {
                      if (node.type === 'npc') return '#e94560';
                      if (node.type === 'player') return '#8b5cf6';
                      if (node.type === 'conditional') return '#3b82f6';
                      return '#4a4a6a';
                    }}
                    nodeStrokeWidth={2}
                    pannable
                    zoomable
                  />
                </div>
              </Panel>
              
              {/* Left Toolbar - Layout, Flags, Guide */}
              <Panel position="top-left" className="!bg-transparent !border-0 !p-0 !m-2">
                <div className="flex flex-col gap-1.5 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg p-1.5 shadow-lg">
                  {/* Layout Strategy Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                      className={`p-1.5 rounded transition-colors ${
                        showLayoutMenu
                          ? 'bg-df-npc-selected/20 text-df-npc-selected border border-df-npc-selected'
                          : 'bg-df-elevated border border-df-control-border text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover'
                      }`}
                      title={`Layout: ${listLayouts().find(l => l.id === layoutStrategy)?.name || layoutStrategy}`}
                    >
                      <Grid3x3 size={14} />
                    </button>
                    {showLayoutMenu && (
                      <div className="absolute left-full ml-2 top-0 z-50 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-xl p-1 min-w-[200px]">
                        <div className="text-[10px] text-df-text-secondary uppercase tracking-wider px-2 py-1 border-b border-df-sidebar-border">Layout Algorithm</div>
                        {listLayouts().map(layout => (
                          <button
                            key={layout.id}
                            onClick={() => {
                              if (onLayoutStrategyChange) {
                                onLayoutStrategyChange(layout.id);
                                setShowLayoutMenu(false);
                                // Trigger layout update with new strategy
                                setTimeout(() => handleAutoLayout(), 0);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                              layoutStrategy === layout.id
                                ? 'bg-df-npc-selected/20 text-df-npc-selected'
                                : 'text-df-text-primary hover:bg-df-elevated'
                            }`}
                          >
                            <div className="font-medium">{layout.name} {layout.isDefault && '(default)'}</div>
                            <div className="text-[10px] text-df-text-secondary mt-0.5">{layout.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Flag Manager */}
                  {onOpenFlagManager && (
                    <button
                      onClick={onOpenFlagManager}
                      className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
                      title="Manage Flags"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                  
                  {/* Guide */}
                  {onOpenGuide && (
                    <button
                      onClick={onOpenGuide}
                      className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
                      title="Guide & Documentation"
                    >
                      <BookOpen size={14} />
                    </button>
                  )}

                  {/* Example Loader (Debug Tool) */}
                  {ENABLE_DEBUG_TOOLS && onLoadExampleDialogue && onLoadExampleFlags && (
                    <ExampleLoaderButton
                      onLoadDialogue={onLoadExampleDialogue}
                      onLoadFlags={onLoadExampleFlags}
                    />
                  )}
                </div>
              </Panel>
              
              {/* Layout Controls */}
              <Panel position="top-right" className="!bg-transparent !border-0 !p-0 !m-2">
                <div className="flex items-center gap-1.5 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg p-1.5 shadow-lg">
                  {/* Auto-organize toggle */}
                  <button
                    onClick={() => {
                      const newAutoOrganize = !autoOrganize;
                      setAutoOrganize(newAutoOrganize);
                      // If turning on, immediately apply layout
                      if (newAutoOrganize) {
                        handleAutoLayout();
                      }
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      autoOrganize 
                        ? 'bg-df-success/20 text-df-success border border-df-success' 
                        : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
                    }`}
                    title={autoOrganize ? `Auto Layout ON - Nodes auto-arrange` : "Auto Layout OFF - Free placement"}
                  >
                    <Magnet size={14} />
                  </button>
                  
                  <div className="w-px h-5 bg-df-control-border" />
                  
                  {/* Layout direction buttons */}
                  <div className="flex border border-df-control-border rounded overflow-hidden">
                    <button
                      onClick={() => handleAutoLayout('TB')}
                      className={`p-1.5 transition-colors ${
                        layoutDirection === 'TB' 
                          ? 'bg-df-npc-selected/20 text-df-npc-selected' 
                          : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary'
                      } border-r border-df-control-border`}
                      title="Vertical Layout (Top to Bottom)"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => handleAutoLayout('LR')}
                      className={`p-1.5 transition-colors ${
                        layoutDirection === 'LR' 
                          ? 'bg-df-player-selected/20 text-df-player-selected' 
                          : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary'
                      }`}
                      title="Horizontal Layout (Left to Right)"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleAutoLayout()}
                    className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
                      title="Re-apply Layout"
                    >
                      <Layout size={14} />
                    </button>
                  
                  <div className="w-px h-5 bg-df-control-border" />
                  
                  {/* Path highlighting toggle */}
                  <button
                    onClick={() => setShowPathHighlight(!showPathHighlight)}
                    className={`p-1.5 rounded transition-colors ${
                      showPathHighlight 
                        ? 'bg-df-info/20 text-df-info border border-df-info' 
                        : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
                    }`}
                    title={showPathHighlight ? "Path Highlight ON" : "Path Highlight OFF"}
                  >
                    <Sparkles size={14} />
                  </button>
                  
                  {/* Back-edge visualization toggle */}
                  <button
                    onClick={() => setShowBackEdges(!showBackEdges)}
                    className={`p-1.5 rounded transition-colors ${
                      showBackEdges 
                        ? 'bg-df-warning/20 text-df-warning border border-df-warning' 
                        : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
                    }`}
                    title={showBackEdges ? "Loop Edges Styled" : "Loop Edges Normal"}
                  >
                    <Undo2 size={14} />
                  </button>
                  
                  <div className="w-px h-5 bg-df-control-border" />
                  
                  {/* Quick select start node */}
                  <button
                    onClick={() => {
                      if (dialogue?.startNodeId) {
                        setSelectedNodeId(dialogue.startNodeId);
                        // Center on start node
                        const startNode = nodes.find(n => n.id === dialogue.startNodeId);
                        if (startNode && reactFlowInstance) {
                          reactFlowInstance.setCenter(
                            startNode.position.x + 110, 
                            startNode.position.y + 60, 
                            { zoom: 1, duration: 500 }
                          );
                        }
                      }
                    }}
                    className="p-1.5 bg-df-start/20 text-df-start border border-df-start rounded transition-colors hover:bg-df-start/30"
                    title="Go to Start Node"
                  >
                    <Home size={14} />
                  </button>
                  
                  {/* Quick select an end node */}
                  <button
                    onClick={() => {
                      const endNodes = Array.from(endNodeIds);
                      if (endNodes.length > 0) {
                        // Cycle through end nodes or select first one
                        const currentIdx = selectedNodeId ? endNodes.indexOf(selectedNodeId) : -1;
                        const nextIdx = (currentIdx + 1) % endNodes.length;
                        const nextEndNodeId = endNodes[nextIdx];
                        setSelectedNodeId(nextEndNodeId);
                        // Center on end node
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
                    className="p-1.5 bg-df-end/20 text-df-end border border-df-end rounded transition-colors hover:bg-df-end/30"
                    title={`Go to End Node (${endNodeIds.size} total)`}
                  >
                    <Flag size={14} />
                  </button>
                </div>
              </Panel>
              
              {/* Pane Context Menu */}
              {contextMenu && (
                <div 
                  className="fixed z-50"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                  <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
                    <button
                      onClick={() => {
                        handleAddNode('npc', contextMenu.graphX, contextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add NPC Node
                    </button>
                    <button
                      onClick={() => {
                        handleAddNode('player', contextMenu.graphX, contextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add Player Node
                    </button>
                    <button
                      onClick={() => {
                        handleAddNode('conditional', contextMenu.graphX, contextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add Conditional Node
                    </button>
                    <button
                      onClick={() => setContextMenu(null)}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edge Drop Menu */}
              {edgeDropMenu && (
                <div 
                  className="fixed z-50"
                  style={{ left: edgeDropMenu.x, top: edgeDropMenu.y }}
                >
                  <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
                    <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
                      Create Node
                    </div>
                    <button
                      onClick={() => {
                        handleAddNode('npc', edgeDropMenu.graphX, edgeDropMenu.graphY, {
                          fromNodeId: edgeDropMenu.fromNodeId,
                          fromChoiceIdx: edgeDropMenu.fromChoiceIdx,
                          fromBlockIdx: edgeDropMenu.fromBlockIdx,
                          sourceHandle: edgeDropMenu.sourceHandle,
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add NPC Node
                    </button>
                    <button
                      onClick={() => {
                        handleAddNode('player', edgeDropMenu.graphX, edgeDropMenu.graphY, {
                          fromNodeId: edgeDropMenu.fromNodeId,
                          fromChoiceIdx: edgeDropMenu.fromChoiceIdx,
                          fromBlockIdx: edgeDropMenu.fromBlockIdx,
                          sourceHandle: edgeDropMenu.sourceHandle,
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add Player Node
                    </button>
                    <button
                      onClick={() => {
                        handleAddNode('conditional', edgeDropMenu.graphX, edgeDropMenu.graphY, {
                          fromNodeId: edgeDropMenu.fromNodeId,
                          fromChoiceIdx: edgeDropMenu.fromChoiceIdx,
                          fromBlockIdx: edgeDropMenu.fromBlockIdx,
                          sourceHandle: edgeDropMenu.sourceHandle,
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Add Conditional Node
                    </button>
                    <button
                      onClick={() => {
                        setEdgeDropMenu(null);
                        connectingRef.current = null;
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edge Context Menu */}
              {edgeContextMenu && (
                <div 
                  className="fixed z-50"
                  style={{ left: edgeContextMenu.x, top: edgeContextMenu.y }}
                >
                  <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[180px]">
                    <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
                      Insert Node
                    </div>
                    <button
                      onClick={() => {
                        handleInsertNode('npc', edgeContextMenu.edgeId, edgeContextMenu.graphX, edgeContextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Insert NPC Node
                    </button>
                    <button
                      onClick={() => {
                        handleInsertNode('player', edgeContextMenu.edgeId, edgeContextMenu.graphX, edgeContextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Insert Player Node
                    </button>
                    <button
                      onClick={() => {
                        handleInsertNode('conditional', edgeContextMenu.edgeId, edgeContextMenu.graphX, edgeContextMenu.graphY);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
                    >
                      Insert Conditional Node
                    </button>
                    <button
                      onClick={() => setEdgeContextMenu(null)}
                      className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Node Context Menu */}
              {nodeContextMenu && (
                <div 
                  className="fixed z-50"
                  style={{ left: nodeContextMenu.x, top: nodeContextMenu.y }}
                >
                  <div className="bg-df-elevated border border-df-player-border rounded-lg shadow-xl py-1 min-w-[180px]">
                    {(() => {
                      const node = dialogue.nodes[nodeContextMenu.nodeId];
                      if (!node) return null;
                      
                      return (
                        <>
                          <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-control-border">
                            {node.id}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedNodeId(nodeContextMenu.nodeId);
                              setNodeContextMenu(null);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-df-text-primary hover:bg-df-control-hover flex items-center gap-2"
                          >
                            <Edit3 size={14} className="text-df-npc-selected" /> Edit Node
                          </button>
                          {node.type === 'player' && (
                            <button
                              onClick={() => {
                                handleAddChoice(nodeContextMenu.nodeId);
                                setNodeContextMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-df-text-primary hover:bg-df-control-hover flex items-center gap-2"
                            >
                              <Plus size={14} className="text-df-player-selected" /> Add Choice
                            </button>
                          )}
                          {node.type === 'npc' && !node.conditionalBlocks && (
                            <button
                              onClick={() => {
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
                                setNodeContextMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-df-text-primary hover:bg-df-control-hover flex items-center gap-2"
                            >
                              <Plus size={14} className="text-df-conditional-border" /> Add Conditionals
                            </button>
                          )}
                          {node.id !== dialogue.startNodeId && (
                            <button
                              onClick={() => {
                                handleDeleteNode(nodeContextMenu.nodeId);
                                setNodeContextMenu(null);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-df-error hover:bg-df-control-hover flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </>
                      );
                    })()}
                    <button
                      onClick={() => setNodeContextMenu(null)}
                      className="w-full px-4 py-1.5 text-xs text-df-text-secondary hover:text-df-text-primary border-t border-df-control-border mt-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </ReactFlow>
          </div>

          {/* Node Editor Sidebar */}
          {selectedNode && (
            <NodeEditor
              node={selectedNode}
              dialogue={dialogue}
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

      {viewMode === 'yarn' && (
        <YarnView
          dialogue={dialogue}
          onExport={() => {
            const yarn = exportToYarn(dialogue);
            if (onExportYarn) {
              onExportYarn(yarn);
            } else {
              // Default: download file
              const blob = new Blob([yarn], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${dialogue.title.replace(/\s+/g, '_')}.yarn`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          onImport={(yarn) => {
            try {
              const importedDialogue = importFromYarn(yarn, dialogue.title);
              onChange(importedDialogue);
            } catch (err) {
              console.error('Failed to import Yarn:', err);
              alert('Failed to import Yarn file. Please check the format.');
            }
          }}
        />
      )}

      {viewMode === 'play' && (
        <PlayView
          dialogue={dialogue}
          flagSchema={flagSchema}
        />
      )}
    </div>
  );
}

export function DialogueEditorV2(props: DialogueEditorProps & { 
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>; // Characters from game state
  initialViewMode?: ViewMode;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  layoutStrategy?: string;
  onLayoutStrategyChange?: (strategy: string) => void;
  onOpenFlagManager?: () => void;
  onOpenGuide?: () => void;
}) {
  return (
    <ReactFlowProvider>
      <DialogueEditorV2Internal {...props} />
    </ReactFlowProvider>
  );
}
