import React, { useMemo, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NARRATIVE_ELEMENT, type NarrativeElement, type StoryThread, type NarrativeAct, type NarrativeChapter, type NarrativePage } from '../../../types/narrative';
import { convertNarrativeToReactFlow, convertReactFlowToNarrative, type NarrativeFlowNodeData } from '../../../utils/narrative-converter';
import {
  addAct,
  addChapter,
  addPage,
  linkPages,
  findPageParent,
} from '../../../utils/narrative-helpers';
import { NPCEdgeV2 } from '../ForgeStoryletGraphEditor/components/NPCNode/NPCEdgeV2';
import { ThreadNode } from './components/ThreadNode/ThreadNode';
import { ActNode } from './components/ActNode/ActNode';
import { ChapterNode } from './components/ChapterNode/ChapterNode';
import { PageNode } from './components/PageNode/PageNode';
import { GraphMiniMap } from '../shared/GraphMiniMap';
import { GraphLeftToolbar } from '../shared/GraphLeftToolbar';
import { GraphLayoutControls } from '../shared/GraphLayoutControls';
import { useReactFlowBehaviors } from '../hooks/useReactFlowBehaviors';
import { EdgeDropMenu } from '../ForgeStoryletGraphEditor/components/EdgeDropMenu';
import { NarrativeGraphEditorPaneContextMenu } from './components/NarrativeGraphEditorPaneContextMenu';
import { createUniqueId } from '../../../utils/narrative-editor-utils';
import { useNarrativePathHighlighting } from './hooks/useNarrativePathHighlighting';
import type { LayoutDirection } from '../utils/layout/types';
import dagre from '@dagrejs/dagre';
import { ConditionalNodeV2 } from '../shared/Nodes/ConditionalNode/ConditionalNodeV2';
import { DetourNode } from '../shared/Nodes/DetourNode';

interface ForgeNarrativeGraphEditorProps {
  thread: StoryThread;
  onChange?: (thread: StoryThread) => void;
  className?: string;
  showMiniMap?: boolean;
  onSelectElement?: (element: NarrativeElement, id: string) => void;
  onToggleMiniMap?: () => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneClick?: () => void;
  dialogueTreeId?: string;
  onEditPageDialogue?: (pageId: string, dialogueId: string) => void;
}

const nodeTypes = {
  [NARRATIVE_ELEMENT.THREAD]: ThreadNode,
  [NARRATIVE_ELEMENT.ACT]: ActNode,
  [NARRATIVE_ELEMENT.CHAPTER]: ChapterNode,
  [NARRATIVE_ELEMENT.PAGE]: PageNode,
  [NARRATIVE_ELEMENT.CONDITIONAL]: ConditionalNodeV2,
  [NARRATIVE_ELEMENT.DETOUR]: DetourNode,
};

const edgeTypes = {
  default: NPCEdgeV2,
};

function ForgeNarrativeGraphEditorInternal({
  thread,
  onChange,
  className = '',
  showMiniMap = true,
  onSelectElement,
  onToggleMiniMap,
  onPaneContextMenu: onPaneContextMenuProp,
  onPaneClick: onPaneClickProp,
  dialogueTreeId = '',
  onEditPageDialogue,
}: ForgeNarrativeGraphEditorProps) {
  // Ensure we have a thread object (even if empty) for the editor to work
  // Always preserve the thread ID to maintain the start node
  const effectiveThread: StoryThread = thread || {
    id: 'empty-thread',
    title: 'Empty Thread',
    acts: [],
  };

  const [layoutDirection, setLayoutDirection] = React.useState<LayoutDirection>('TB');
  const [autoOrganize, setAutoOrganize] = React.useState(false);
  const [showPathHighlight, setShowPathHighlight] = React.useState(true);
  const [showBackEdges, setShowBackEdges] = React.useState(true);

  const { nodes: initialNodes, edges: initialEdges} = useMemo(() => convertNarrativeToReactFlow(effectiveThread, layoutDirection), [effectiveThread, layoutDirection]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { reactFlowWrapperRef } = useReactFlowBehaviors();
  const reactFlowInstance = useReactFlow();
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<NarrativeElement | null>(null);
  const [paneContextMenu, setPaneContextMenu] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);
  const [edgeDropMenu, setEdgeDropMenu] = useState<{ x: number; y: number; graphX: number; graphY: number; fromNodeId: string; fromElementType: NarrativeElement } | null>(null);
  const connectingRef = useRef<{ fromNodeId: string; fromElementType: NarrativeElement } | null>(null);
  const localVersionRef = useRef(0);
  const lastSyncedVersionRef = useRef(0);

  // Use path highlighting hook
  const { edgesToSelectedElement, nodeDepths } = useNarrativePathHighlighting(selectedElementId, selectedElementType, effectiveThread);

  // Handle pane context menu (right-click on empty space)
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const point = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setPaneContextMenu({
      x: event.clientX,
      y: event.clientY,
      graphX: point.x,
      graphY: point.y,
    });
    onPaneContextMenuProp?.(event);
  }, [reactFlowInstance, onPaneContextMenuProp]);

  // Handle pane click (close edge drop menu)
  const onPaneClick = useCallback(() => {
    setEdgeDropMenu(null);
    setPaneContextMenu(null);
    onPaneClickProp?.();
  }, [onPaneClickProp]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (!onChange) return;
    
    deletedEdges.forEach(edge => {
      // Remove the edge from the narrative structure
      // This means removing the child from its parent
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const sourceType = sourceNode.type as NarrativeElement;
      const targetType = targetNode.type as NarrativeElement;
      
      let newThread: StoryThread;
      
      // Thread -> Act
      if (sourceType === NARRATIVE_ELEMENT.THREAD && targetType === NARRATIVE_ELEMENT.ACT) {
        newThread = {
          ...effectiveThread,
          acts: effectiveThread.acts.filter(act => act.id !== targetNode.id),
        };
      }
      // Act -> Chapter
      else if (sourceType === NARRATIVE_ELEMENT.ACT && targetType === NARRATIVE_ELEMENT.CHAPTER) {
        newThread = {
          ...effectiveThread,
          acts: effectiveThread.acts.map(act =>
            act.id === sourceNode.id
              ? { ...act, chapters: act.chapters.filter(ch => ch.id !== targetNode.id) }
              : act
          ),
        };
      }
      // Chapter -> Page
      else if (sourceType === NARRATIVE_ELEMENT.CHAPTER && targetType === NARRATIVE_ELEMENT.PAGE) {
        newThread = {
          ...effectiveThread,
          acts: effectiveThread.acts.map(act => ({
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === sourceNode.id
                ? { ...chapter, pages: chapter.pages.filter(p => p.id !== targetNode.id) }
                : chapter
            ),
          })),
        };
      } else {
        return; // Unknown edge type
      }
      
      localVersionRef.current++;
      const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread, layoutDirection);
      setNodes(() => newNodes);
      setEdges(() => newEdges);
      onChange(newThread);
    });
  }, [nodes, edges, effectiveThread, onChange, layoutDirection]);

  // Create narrative element
  const handleAddElement = useCallback((type: NarrativeElement, x: number, y: number, autoConnect?: { fromNodeId: string }) => {
    if (!onChange) return;

    let newThread: StoryThread;

    if (type === NARRATIVE_ELEMENT.ACT) {
      // Acts always append to the end (linear structure)
      newThread = addAct(effectiveThread, `Act ${effectiveThread.acts.length + 1}`);
      
    } else if (type === NARRATIVE_ELEMENT.CHAPTER) {
      // Find the parent act
      const actId = autoConnect?.fromNodeId;
      const act = actId ? effectiveThread.acts.find(a => a.id === actId) : effectiveThread.acts[effectiveThread.acts.length - 1];
      
      if (act) {
        newThread = addChapter(effectiveThread, act.id, `Chapter ${act.chapters.length + 1}`);
      } else {
        console.warn('No act found to add chapter to');
        return;
      }
      
    } else if (type === NARRATIVE_ELEMENT.PAGE) {
      // Determine parent chapter and act
      let targetAct: NarrativeAct | undefined;
      let targetChapter: NarrativeChapter | undefined;
      
      if (autoConnect) {
        // Check if connecting from a page (sequential page link)
        const sourcePage = effectiveThread.acts
          .flatMap(act => act.chapters.flatMap(ch => ch.pages))
          .find(p => p.id === autoConnect.fromNodeId);
          
        if (sourcePage) {
          // Find the chapter containing this page
          const parentInfo = findPageParent(effectiveThread, sourcePage.id);
          if (parentInfo) {
            targetAct = parentInfo.act;
            targetChapter = parentInfo.chapter;
          }
        } else {
          // Check if connecting from a chapter
          for (const act of effectiveThread.acts) {
            const chapter = act.chapters.find(c => c.id === autoConnect.fromNodeId);
            if (chapter) {
              targetAct = act;
              targetChapter = chapter;
              break;
            }
          }
        }
      }
      
      // Fallback to last chapter of last act
      if (!targetAct || !targetChapter) {
        targetAct = effectiveThread.acts[effectiveThread.acts.length - 1];
        targetChapter = targetAct?.chapters[targetAct.chapters.length - 1];
      }
      
      if (targetAct && targetChapter) {
        newThread = addPage(
          effectiveThread,
          targetAct.id,
          targetChapter.id,
          `Page ${targetChapter.pages.length + 1}`,
          dialogueTreeId
        );
        
        // If connecting from a page, link them sequentially
        if (autoConnect) {
          const sourcePage = effectiveThread.acts
            .flatMap(act => act.chapters.flatMap(ch => ch.pages))
            .find(p => p.id === autoConnect.fromNodeId);
            
          if (sourcePage) {
            // Get the new page ID (it will be the last page in the chapter)
            const updatedChapter = newThread.acts
              .find(a => a.id === targetAct!.id)
              ?.chapters.find(c => c.id === targetChapter!.id);
            const newPageId = updatedChapter?.pages[updatedChapter.pages.length - 1]?.id;
            
            if (newPageId) {
              newThread = linkPages(newThread, targetAct.id, targetChapter.id, sourcePage.id, newPageId);
            }
          }
        }
      } else {
        console.warn('No chapter found to add page to');
        return;
      }
    } else {
      // Unknown type
      return;
    }

    // Mark that we're making a local update to prevent useEffect from overwriting
    localVersionRef.current++;
    
    // Immediately update the nodes/edges to reflect the new thread structure
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread, layoutDirection);
    
    // Debug: Log to verify nodes are being created
    console.log('Creating element:', type, 'Thread:', newThread.id, 'Acts:', newThread.acts.length, 'Nodes:', newNodes.length, 'Edges:', newEdges.length, 'Node IDs:', newNodes.map(n => `${n.type}:${n.id}`));
    
    // Force React Flow to update by using functional setState
    setNodes(() => newNodes);
    setEdges(() => newEdges);
    
    // Update parent state
    onChange(newThread);
    
    // Fit view to show new nodes after a brief delay
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      }
    }, 100);
    
    connectingRef.current = null;
  }, [effectiveThread, onChange, dialogueTreeId, reactFlowInstance, layoutDirection]);

  // Handle edit page dialogue - opens the dialogue tree for a page
  const handleEditPageDialogue = useCallback((pageId: string) => {
    const page = effectiveThread.acts
      .flatMap(a => a.chapters.flatMap(c => c.pages))
      .find(p => p.id === pageId);
    if (page?.dialogueId && onEditPageDialogue) {
      onEditPageDialogue(pageId, page.dialogueId);
    }
  }, [effectiveThread, onEditPageDialogue]);

  // Handle delete element
  const handleDeleteElement = useCallback((elementType: NarrativeElement, elementId: string) => {
    if (!onChange) return;
    
    // Thread cannot be deleted
    if (elementType === NARRATIVE_ELEMENT.THREAD) return;
    
    let newThread: StoryThread;
    
    if (elementType === NARRATIVE_ELEMENT.ACT) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.filter(act => act.id !== elementId),
      };
    } else if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.map(act => ({
          ...act,
          chapters: act.chapters.filter(chapter => chapter.id !== elementId),
        })),
      };
    } else if (elementType === NARRATIVE_ELEMENT.PAGE) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.map(act => ({
          ...act,
          chapters: act.chapters.map(chapter => ({
            ...chapter,
            pages: chapter.pages.filter(page => page.id !== elementId),
          })),
        })),
      };
    } else {
      return;
    }
    
    localVersionRef.current++;
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread, layoutDirection);
    setNodes(() => newNodes);
    setEdges(() => newEdges);
    onChange(newThread);
  }, [effectiveThread, onChange, layoutDirection]);

  // Update nodes/edges when thread changes externally
  // Skip if we just made a local update (to prevent race conditions)
  React.useEffect(() => {
    // Skip if local version is ahead of last synced (local mutation in progress)
    if (localVersionRef.current > lastSyncedVersionRef.current) {
      lastSyncedVersionRef.current = localVersionRef.current;
      return;
    }
    
    const threadToUse = thread || {
      id: 'empty-thread',
      title: 'Empty Thread',
      acts: [],
    };
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(threadToUse, layoutDirection);
    
    // Add path highlighting data and callbacks to nodes
    const hasSelection = selectedElementId !== null && showPathHighlight;
    const nodesWithCallbacks = newNodes.map(node => {
      const isInPath = showPathHighlight && nodeDepths.has(node.id);
      const isSelected = node.id === selectedElementId;
      const isDimmed = hasSelection && !isInPath && !isSelected;
      const elementType = node.type as NarrativeElement;
      
      // Create callbacks based on node type
      const callbacks: Partial<NarrativeFlowNodeData> = {};
      
      if (elementType === NARRATIVE_ELEMENT.THREAD) {
        callbacks.onEdit = () => {
          onSelectElement?.(elementType, node.id);
        };
        callbacks.onAddAct = () => {
          handleAddElement(NARRATIVE_ELEMENT.ACT, 0, 0, { fromNodeId: node.id });
        };
      } else if (elementType === NARRATIVE_ELEMENT.ACT) {
        callbacks.onEdit = () => {
          onSelectElement?.(elementType, node.id);
        };
        callbacks.onAddChapter = () => {
          handleAddElement(NARRATIVE_ELEMENT.CHAPTER, 0, 0, { fromNodeId: node.id });
        };
        callbacks.onDelete = () => {
          handleDeleteElement(elementType, node.id);
        };
      } else if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
        callbacks.onEdit = () => {
          onSelectElement?.(elementType, node.id);
        };
        callbacks.onAddPage = () => {
          handleAddElement(NARRATIVE_ELEMENT.PAGE, 0, 0, { fromNodeId: node.id });
        };
        callbacks.onDelete = () => {
          handleDeleteElement(elementType, node.id);
        };
      } else if (elementType === NARRATIVE_ELEMENT.PAGE) {
        // Find parent info for determining if this is the last element
        const parentInfo = findPageParent(effectiveThread, node.id);
        const isLastPageInChapter = parentInfo?.chapter.pages[parentInfo.chapter.pages.length - 1]?.id === node.id;
        const isLastChapterInAct = parentInfo?.act.chapters[parentInfo.act.chapters.length - 1]?.id === parentInfo?.chapter.id;
        const isLastActInThread = effectiveThread.acts[effectiveThread.acts.length - 1]?.id === parentInfo?.act.id;
        
        callbacks.canAddChapter = isLastPageInChapter && isLastChapterInAct;
        callbacks.canAddAct = isLastPageInChapter && isLastChapterInAct && isLastActInThread;
        callbacks.onAddPage = () => {
          handleAddElement(NARRATIVE_ELEMENT.PAGE, 0, 0, { fromNodeId: node.id });
        };
        callbacks.onAddChapter = () => {
          if (parentInfo) {
            handleAddElement(NARRATIVE_ELEMENT.CHAPTER, 0, 0, { fromNodeId: parentInfo.act.id });
          }
        };
        callbacks.onAddAct = () => {
          handleAddElement(NARRATIVE_ELEMENT.ACT, 0, 0);
        };
        callbacks.onEditDialogue = () => {
          handleEditPageDialogue(node.id);
        };
        callbacks.onEdit = () => {
          onSelectElement?.(elementType, node.id);
        };
        callbacks.onDelete = () => {
          handleDeleteElement(elementType, node.id);
        };
      }
      
      return {
        ...node,
        data: {
          ...node.data,
          isDimmed,
          isInPath,
          ...callbacks,
        },
      };
    });
    
    // Add path highlighting data and callbacks to edges
    const edgesWithCallbacks = newEdges.map(edge => {
      const isInPath = showPathHighlight && edgesToSelectedElement.has(edge.id);
      const sourceNode = newNodes.find(n => n.id === edge.source);
      const sourceType = sourceNode?.type as NarrativeElement;
      
      const edgeData: any = {
        ...edge.data,
        isInPathToSelected: isInPath,
      };
      
      // Add insert element callback for narrative edges
      if (sourceType === NARRATIVE_ELEMENT.THREAD) {
        edgeData.onInsertElement = (type: NarrativeElement, edgeId: string, x: number, y: number) => {
          handleAddElement(type, x, y, { fromNodeId: edge.source });
        };
        edgeData.insertElementTypes = [{ type: NARRATIVE_ELEMENT.CHAPTER, label: 'Chapter' }];
      } else if (sourceType === NARRATIVE_ELEMENT.ACT) {
        edgeData.onInsertElement = (type: NarrativeElement, edgeId: string, x: number, y: number) => {
          handleAddElement(type, x, y, { fromNodeId: edge.source });
        };
        edgeData.insertElementTypes = [{ type: NARRATIVE_ELEMENT.PAGE, label: 'Page' }];
      } else if (sourceType === NARRATIVE_ELEMENT.CHAPTER) {
        edgeData.onInsertElement = (type: NarrativeElement, edgeId: string, x: number, y: number) => {
          handleAddElement(type, x, y, { fromNodeId: edge.source });
        };
        edgeData.insertElementTypes = [{ type: NARRATIVE_ELEMENT.PAGE, label: 'Page' }];
      }
      
      return {
        ...edge,
        data: edgeData,
      };
    });
    
    // Force React Flow to update
    setNodes(() => nodesWithCallbacks);
    setEdges(() => edgesWithCallbacks);
  }, [thread, selectedElementId, showPathHighlight, nodeDepths, edgesToSelectedElement, layoutDirection, effectiveThread, handleAddElement, handleDeleteElement, handleEditPageDialogue, onSelectElement]);

  // Handle update element
  const handleUpdateElement = useCallback((elementType: NarrativeElement, elementId: string, updates: Partial<NarrativeAct | NarrativeChapter | NarrativePage | StoryThread>) => {
    if (!onChange) return;
    
    let newThread: StoryThread;
    
    if (elementType === NARRATIVE_ELEMENT.THREAD) {
      newThread = {
        ...effectiveThread,
        ...(updates as Partial<StoryThread>),
        id: effectiveThread.id, // Preserve ID
      };
    } else if (elementType === NARRATIVE_ELEMENT.ACT) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.map(act =>
          act.id === elementId ? { ...act, ...(updates as Partial<NarrativeAct>) } : act
        ),
      };
    } else if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.map(act => ({
          ...act,
          chapters: act.chapters.map(chapter =>
            chapter.id === elementId ? { ...chapter, ...(updates as Partial<NarrativeChapter>) } : chapter
          ),
        })),
      };
    } else if (elementType === NARRATIVE_ELEMENT.PAGE) {
      newThread = {
        ...effectiveThread,
        acts: effectiveThread.acts.map(act => ({
          ...act,
          chapters: act.chapters.map(chapter => ({
            ...chapter,
            pages: chapter.pages.map(page =>
              page.id === elementId ? { ...page, ...(updates as Partial<NarrativePage>) } : page
            ),
          })),
        })),
      };
    } else {
      return;
    }
    
    localVersionRef.current++;
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread, layoutDirection);
    setNodes(() => newNodes);
    setEdges(() => newEdges);
    onChange(newThread);
  }, [effectiveThread, onChange, layoutDirection]);

  // Handle edge connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || !onChange) return;
    
    // Clear connecting ref since we successfully connected
    connectingRef.current = null;
    
    const newEdges = addEdge(connection, edges);
    setEdges(newEdges);
    
    // Mark that we're making a local update
    localVersionRef.current++;
    
    // Convert back to narrative structure
    // Preserve the thread ID to ensure the start node stays
    const updatedThread = convertReactFlowToNarrative(nodes, newEdges);
    // Ensure thread ID is preserved
    if (updatedThread.id !== effectiveThread.id) {
      updatedThread.id = effectiveThread.id;
    }
    onChange(updatedThread);
  }, [nodes, edges, onChange, effectiveThread.id]);

  // Handle connection start
  const onConnectStart = useCallback((_event: React.MouseEvent | React.TouchEvent, { nodeId }: { nodeId: string | null }) => {
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      connectingRef.current = {
        fromNodeId: nodeId,
        fromElementType: node.type as NarrativeElement,
      };
    }
  }, [nodes]);

  // Handle connection end (check if dropped on empty space or near a node)
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingRef.current) return;
    
    const clientX = 'clientX' in event ? event.clientX : (event.touches?.[0]?.clientX || 0);
    const clientY = 'clientY' in event ? event.clientY : (event.touches?.[0]?.clientY || 0);
    const point = reactFlowInstance.screenToFlowPosition({
      x: clientX,
      y: clientY,
    });
    
    // Check if we're near any node (within 100px)
    const CONNECTION_THRESHOLD = 100;
    let nearestNode: (typeof nodes)[number] | null = null;
    let minDistance = Infinity;
    
    for (const node of nodes) {
      const nodePosition = node.position;
      const nodeWidth = node.width || 200;
      const nodeHeight = node.height || 100;
      const nodeCenterX = nodePosition.x + nodeWidth / 2;
      const nodeCenterY = nodePosition.y + nodeHeight / 2;
      
      const distance = Math.sqrt(
        Math.pow(point.x - nodeCenterX, 2) + Math.pow(point.y - nodeCenterY, 2)
      );
      
      if (distance < minDistance && distance < CONNECTION_THRESHOLD) {
        minDistance = distance;
        nearestNode = node;
      }
    }
    
    // Auto-connect if we're near a valid target node (allow any connection - flexible graph)
    if (nearestNode && nearestNode.id !== connectingRef.current.fromNodeId) {
      const { fromNodeId } = connectingRef.current;
      
      // Connect without restrictions - allow any node type to connect to any other
      const connection: Connection = {
        source: fromNodeId,
        target: nearestNode.id,
        sourceHandle: null,
        targetHandle: null,
      };
      onConnect(connection);
      connectingRef.current = null;
      return;
    }
    
    // Use a small delay to check if onConnect was called (which means we connected to a node)
    // If onConnect wasn't called, we dropped on empty space
    setTimeout(() => {
      if (!connectingRef.current) return; // onConnect was called and cleared this
      
      // Dropped on empty space - show edge drop menu
      const { fromElementType, fromNodeId } = connectingRef.current;
      
      // Show edge drop menu based on element type
      if (fromElementType === NARRATIVE_ELEMENT.THREAD || 
          fromElementType === NARRATIVE_ELEMENT.ACT || 
          fromElementType === NARRATIVE_ELEMENT.CHAPTER ||
          fromElementType === NARRATIVE_ELEMENT.PAGE) {
        setEdgeDropMenu({
          x: clientX,
          y: clientY,
          graphX: point.x,
          graphY: point.y,
          fromNodeId,
          fromElementType,
        });
      }
      
      connectingRef.current = null;
    }, 10);
  }, [reactFlowInstance, nodes, onConnect]);

  // Handle node/edge changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);
    
    // Convert back to narrative structure when nodes change
    // Preserve the thread ID to ensure the start node stays
    if (onChange) {
      // Mark that we're making a local update
      localVersionRef.current++;
      
      const updatedThread = convertReactFlowToNarrative(updatedNodes, edges);
      // Ensure thread ID is preserved
      if (updatedThread.id !== effectiveThread.id) {
        updatedThread.id = effectiveThread.id;
      }
      onChange(updatedThread);
    }
  }, [nodes, edges, onChange, effectiveThread.id]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    setEdges(updatedEdges);
    // Convert back to narrative structure when edges change
    // Preserve the thread ID to ensure the start node stays
    if (onChange) {
      // Mark that we're making a local update
      localVersionRef.current++;
      
      const updatedThread = convertReactFlowToNarrative(nodes, updatedEdges);
      // Ensure thread ID is preserved
      if (updatedThread.id !== effectiveThread.id) {
        updatedThread.id = effectiveThread.id;
      }
      onChange(updatedThread);
    }
  }, [nodes, edges, onChange, effectiveThread.id]);

  // Handle auto-layout with direction
  const handleAutoLayout = useCallback((direction?: LayoutDirection) => {
    const dir = direction || layoutDirection;
    if (direction) {
      setLayoutDirection(direction);
    }
    
    // Create dagre graph
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    
    // Configure layout
    const isHorizontal = dir === 'LR';
    g.setGraph({
      rankdir: dir,
      nodesep: isHorizontal ? 80 : 120,
      ranksep: isHorizontal ? 120 : 80,
      marginx: 50,
      marginy: 50,
      ranker: 'network-simplex',
      align: 'UL',
    });
    
    // Add nodes
    nodes.forEach(node => {
      g.setNode(node.id, {
        width: node.width || 220,
        height: node.height || 100,
      });
    });
    
    // Add edges
    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });
    
    // Run layout
    dagre.layout(g);
    
    // Update node positions
    const updatedNodes = nodes.map(node => {
      const dagreNode = g.node(node.id);
      if (dagreNode) {
        return {
          ...node,
          position: {
            x: dagreNode.x - (node.width || 220) / 2,
            y: dagreNode.y - (node.height || 100) / 2,
          },
        };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    
    // Fit view after a short delay
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      }
    }, 100);
  }, [nodes, edges, layoutDirection, reactFlowInstance]);

  return (
    <div className={`h-full w-full rounded-xl border border-[#1a1a2e] bg-[#0b0b14] ${className}`} ref={reactFlowWrapperRef}>
      <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-df-canvas-bg"
            minZoom={0.1}
            maxZoom={1.5}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={(_, node) => {
              const elementType = node.type as NarrativeElement | undefined;
              if (elementType) {
                setSelectedElementId(node.id);
                setSelectedElementType(elementType);
                onSelectElement?.(elementType, node.id);
              }
            }}
            onEdgesDelete={onEdgesDelete}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
          >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <GraphMiniMap showMiniMap={showMiniMap} />
        {onToggleMiniMap && (
          <GraphLeftToolbar
            layoutStrategy="dagre"
            showMiniMap={showMiniMap}
            onToggleMiniMap={onToggleMiniMap}
          />
        )}
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
        
        {paneContextMenu && (
          <NarrativeGraphEditorPaneContextMenu
            x={paneContextMenu.x}
            y={paneContextMenu.y}
            graphX={paneContextMenu.graphX}
            graphY={paneContextMenu.graphY}
            onAddElement={(type, x, y) => handleAddElement(type, x, y)}
            onClose={() => setPaneContextMenu(null)}
          />
        )}

        {edgeDropMenu && (() => {
          const { fromElementType, fromNodeId, x, y, graphX, graphY } = edgeDropMenu;
          
          return (
            <EdgeDropMenu
              mode="narrative"
              x={x}
              y={y}
              graphX={graphX}
              graphY={graphY}
              fromNodeId={fromNodeId}
              fromElementType={fromElementType}
              onAddElement={(type, x, y, autoConnect) => {
                handleAddElement(type, x, y, autoConnect);
                setEdgeDropMenu(null);
              }}
              onClose={() => setEdgeDropMenu(null)}
            />
          );
        })()}
      </ReactFlow>
    </div>
  );
}

export function ForgeNarrativeGraphEditor(props: ForgeNarrativeGraphEditorProps) {
  return (
    <ReactFlowProvider>
      <ForgeNarrativeGraphEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
