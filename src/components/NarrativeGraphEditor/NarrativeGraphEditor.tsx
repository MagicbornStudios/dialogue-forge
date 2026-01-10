import React, { useMemo, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
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

import { NARRATIVE_ELEMENT, type NarrativeElement, type StoryThread, type NarrativeAct, type NarrativeChapter, type NarrativePage } from '../../types/narrative';
import { convertNarrativeToReactFlow, convertReactFlowToNarrative } from '../../utils/narrative-converter';
import { NPCEdgeV2 } from '../DialogueGraphEditor/components/NPCNode/NPCEdgeV2';
import { ThreadNode } from './components/ThreadNode/ThreadNode';
import { ActNode } from './components/ActNode/ActNode';
import { ChapterNode } from './components/ChapterNode/ChapterNode';
import { PageNode } from './components/PageNode/PageNode';
import { GraphMiniMap } from '../EditorComponents/GraphMiniMap';
import { GraphLeftToolbar } from '../EditorComponents/GraphLeftToolbar';
import { GraphLayoutControls } from '../EditorComponents/GraphLayoutControls';
import { useReactFlowBehaviors } from '../EditorComponents/hooks/useReactFlowBehaviors';
import { NarrativeGraphEditorPaneContextMenu } from './components/NarrativeGraphEditorPaneContextMenu';
import { ThreadNodeContextMenu } from './components/ThreadNodeContextMenu';
import { ActNodeContextMenu } from './components/ActNode/ActNodeContextMenu';
import { ChapterNodeContextMenu } from './components/ChapterNode/ChapterNodeContextMenu';
import { PageNodeContextMenu } from './components/PageNode/PageNodeContextMenu';
import { ThreadEdgeDropMenu } from './components/ThreadNode/ThreadEdgeDropMenu';
import { ActEdgeDropMenu } from './components/ActNode/ActEdgeDropMenu';
import { ChapterEdgeDropMenu } from './components/ChapterNode/ChapterEdgeDropMenu';
import { PageEdgeDropMenu } from './components/PageNode/PageEdgeDropMenu';
import { ActEdgeContextMenu } from './components/ActNode/ActEdgeContextMenu';
import { ChapterEdgeContextMenu } from './components/ChapterNode/ChapterEdgeContextMenu';
import { PageEdgeContextMenu } from './components/PageNode/PageEdgeContextMenu';
import { createUniqueId } from '../../utils/narrative-editor-utils';
import { useNarrativePathHighlighting } from './hooks/useNarrativePathHighlighting';
import type { LayoutDirection } from '../../utils/layout/types';
import dagre from '@dagrejs/dagre';

interface NarrativeGraphEditorProps {
  thread: StoryThread;
  onChange?: (thread: StoryThread) => void;
  className?: string;
  showMiniMap?: boolean;
  onSelectElement?: (element: NarrativeElement, id: string) => void;
  onToggleMiniMap?: () => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneClick?: () => void;
  dialogueTreeId?: string;
}

const nodeTypes = {
  [NARRATIVE_ELEMENT.THREAD]: ThreadNode,
  [NARRATIVE_ELEMENT.ACT]: ActNode,
  [NARRATIVE_ELEMENT.CHAPTER]: ChapterNode,
  [NARRATIVE_ELEMENT.PAGE]: PageNode,
};

const edgeTypes = {
  default: NPCEdgeV2,
};

function NarrativeGraphEditorInternal({
  thread,
  onChange,
  className = '',
  showMiniMap = true,
  onSelectElement,
  onToggleMiniMap,
  onPaneContextMenu: onPaneContextMenuProp,
  onPaneClick: onPaneClickProp,
  dialogueTreeId = '',
}: NarrativeGraphEditorProps) {
  // Ensure we have a thread object (even if empty) for the editor to work
  // Always preserve the thread ID to maintain the start node
  const effectiveThread: StoryThread = thread || {
    id: 'empty-thread',
    title: 'Empty Thread',
    acts: [],
  };

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => convertNarrativeToReactFlow(effectiveThread), [effectiveThread]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { reactFlowWrapperRef } = useReactFlowBehaviors();
  const reactFlowInstance = useReactFlow();
  const [layoutDirection, setLayoutDirection] = React.useState<LayoutDirection>('TB');
  const [autoOrganize, setAutoOrganize] = React.useState(false);
  const [showPathHighlight, setShowPathHighlight] = React.useState(true); // Default to true like DialogueGraphEditor
  const [showBackEdges, setShowBackEdges] = React.useState(true);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<NarrativeElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{ x: number; y: number; nodeId: string; elementType: NarrativeElement } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{ x: number; y: number; edgeId: string; graphX: number; graphY: number } | null>(null);
  const [edgeDropMenu, setEdgeDropMenu] = useState<{ x: number; y: number; graphX: number; graphY: number; fromNodeId: string; fromElementType: NarrativeElement } | null>(null);
  const connectingRef = useRef<{ fromNodeId: string; fromElementType: NarrativeElement } | null>(null);
  const localUpdateRef = useRef<string | null>(null); // Track when we make a local update to prevent overwriting

  // Use path highlighting hook
  const { edgesToSelectedElement, nodeDepths } = useNarrativePathHighlighting(selectedElementId, selectedElementType, effectiveThread);

  // Update nodes/edges when thread changes externally
  // Watch thread prop directly to detect changes from parent
  // Skip if we just made a local update (to prevent race conditions)
  React.useEffect(() => {
    if (localUpdateRef.current) {
      localUpdateRef.current = null; // Clear the flag
      return; // Skip this update - we already updated locally
    }
    
    const threadToUse = thread || {
      id: 'empty-thread',
      title: 'Empty Thread',
      acts: [],
    };
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(threadToUse);
    
    // Add path highlighting data to nodes
    const hasSelection = selectedElementId !== null && showPathHighlight;
    const nodesWithHighlighting = newNodes.map(node => {
      const isInPath = showPathHighlight && nodeDepths.has(node.id);
      const isSelected = node.id === selectedElementId;
      const isDimmed = hasSelection && !isInPath && !isSelected;
      
      return {
        ...node,
        data: {
          ...node.data,
          isDimmed,
          isInPath,
        },
      };
    });
    
    // Add path highlighting data to edges
    const edgesWithHighlighting = newEdges.map(edge => {
      const isInPath = showPathHighlight && edgesToSelectedElement.has(edge.id);
      
      return {
        ...edge,
        data: {
          ...edge.data,
          isInPathToSelected: isInPath,
        },
      };
    });
    
    // Force React Flow to update
    setNodes(() => nodesWithHighlighting);
    setEdges(() => edgesWithHighlighting);
  }, [thread, selectedElementId, showPathHighlight, nodeDepths, edgesToSelectedElement]);

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
    onPaneContextMenuProp?.(event);
  }, [reactFlowInstance, onPaneContextMenuProp]);

  // Handle pane click (close context menu)
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setNodeContextMenu(null);
    setEdgeContextMenu(null);
    setEdgeDropMenu(null);
    onPaneClickProp?.();
  }, [onPaneClickProp]);

  // Handle node context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const elementType = node.type as NarrativeElement;
    if (elementType) {
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        elementType,
      });
    }
  }, []);

  // Handle edge context menu
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
      
      localUpdateRef.current = newThread.id;
      const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread);
      setNodes(() => newNodes);
      setEdges(() => newEdges);
      onChange(newThread);
    });
  }, [nodes, edges, effectiveThread, onChange]);

  // Create narrative element
  const handleAddElement = useCallback((type: NarrativeElement, x: number, y: number, autoConnect?: { fromNodeId: string }) => {
    if (!onChange) return;

    const newId = createUniqueId(
      effectiveThread.acts.flatMap(act => [
        act.id,
        ...act.chapters.flatMap(chapter => [
          chapter.id,
          ...chapter.pages.map(page => page.id)
        ])
      ]),
      type === NARRATIVE_ELEMENT.ACT ? 'act' : type === NARRATIVE_ELEMENT.CHAPTER ? 'chapter' : 'page'
    );

    let newThread: StoryThread;

    if (type === NARRATIVE_ELEMENT.ACT) {
      const newAct: NarrativeAct = {
        id: newId,
        title: `Act ${effectiveThread.acts.length + 1}`,
        chapters: [],
      };
      newThread = {
        ...effectiveThread,
        id: effectiveThread.id, // Preserve thread ID
        title: effectiveThread.title, // Preserve thread title
        acts: [...effectiveThread.acts, newAct],
      };
    } else if (type === NARRATIVE_ELEMENT.CHAPTER) {
      // If auto-connecting, find the act to add chapter to
      if (autoConnect) {
        const act = effectiveThread.acts.find(a => a.id === autoConnect.fromNodeId);
        if (act) {
          const newChapter: NarrativeChapter = {
            id: newId,
            title: `Chapter ${act.chapters.length + 1}`,
            pages: [],
          };
          newThread = {
            ...effectiveThread,
            id: effectiveThread.id, // Preserve thread ID
            title: effectiveThread.title, // Preserve thread title
            acts: effectiveThread.acts.map(a =>
              a.id === act.id
                ? { ...a, chapters: [...a.chapters, newChapter] }
                : a
            ),
          };
        } else {
          // No valid parent, just add to first act or create one
          if (effectiveThread.acts.length === 0) {
            const newAct: NarrativeAct = {
              id: createUniqueId([], 'act'),
              title: 'Act 1',
              chapters: [{
                id: newId,
                title: 'Chapter 1',
                pages: [],
              }],
            };
            newThread = {
              ...effectiveThread,
              id: effectiveThread.id, // Preserve thread ID
              title: effectiveThread.title, // Preserve thread title
              acts: [newAct],
            };
          } else {
            const firstAct = effectiveThread.acts[0];
            const newChapter: NarrativeChapter = {
              id: newId,
              title: `Chapter ${firstAct.chapters.length + 1}`,
              pages: [],
            };
            newThread = {
              ...effectiveThread,
              id: effectiveThread.id, // Preserve thread ID
              title: effectiveThread.title, // Preserve thread title
              acts: effectiveThread.acts.map(a =>
                a.id === firstAct.id
                  ? { ...a, chapters: [...a.chapters, newChapter] }
                  : a
              ),
            };
          }
        }
      } else {
        // No auto-connect, add to first act or create one
        if (effectiveThread.acts.length === 0) {
          const newAct: NarrativeAct = {
            id: createUniqueId([], 'act'),
            title: 'Act 1',
            chapters: [{
              id: newId,
              title: 'Chapter 1',
              pages: [],
            }],
          };
          newThread = {
            ...effectiveThread,
            acts: [newAct],
          };
        } else {
          const firstAct = effectiveThread.acts[0];
          const newChapter: NarrativeChapter = {
            id: newId,
            title: `Chapter ${firstAct.chapters.length + 1}`,
            pages: [],
          };
          newThread = {
            ...effectiveThread,
            id: effectiveThread.id, // Preserve thread ID
            title: effectiveThread.title, // Preserve thread title
            acts: effectiveThread.acts.map(a =>
              a.id === firstAct.id
                ? { ...a, chapters: [...a.chapters, newChapter] }
                : a
            ),
          };
        }
      }
    } else if (type === NARRATIVE_ELEMENT.PAGE) {
      // If auto-connecting, find the chapter to add page to
      if (autoConnect) {
        const chapter = effectiveThread.acts
          .flatMap(act => act.chapters)
          .find(c => c.id === autoConnect.fromNodeId);
        if (chapter) {
          const act = effectiveThread.acts.find(a => a.chapters.some(c => c.id === chapter.id));
          if (act) {
            const newPage: NarrativePage = {
              id: newId,
              title: `Page ${chapter.pages.length + 1}`,
              dialogueId: dialogueTreeId,
              type: NARRATIVE_ELEMENT.PAGE,
            };
            newThread = {
              ...effectiveThread,
              id: effectiveThread.id, // Preserve thread ID
              title: effectiveThread.title, // Preserve thread title
              acts: effectiveThread.acts.map(a =>
                a.id === act.id
                  ? {
                      ...a,
                      chapters: a.chapters.map(c =>
                        c.id === chapter.id
                          ? { ...c, pages: [...c.pages, newPage] }
                          : c
                      ),
                    }
                  : a
              ),
            };
          } else {
            // Fallback: add to first chapter of first act
            if (effectiveThread.acts.length > 0 && effectiveThread.acts[0].chapters.length > 0) {
              const firstChapter = effectiveThread.acts[0].chapters[0];
              const newPage: NarrativePage = {
                id: newId,
                title: `Page ${firstChapter.pages.length + 1}`,
                dialogueId: dialogueTreeId,
                type: NARRATIVE_ELEMENT.PAGE,
              };
              newThread = {
                ...effectiveThread,
                id: effectiveThread.id, // Preserve thread ID
                title: effectiveThread.title, // Preserve thread title
                acts: effectiveThread.acts.map(a =>
                  a.id === effectiveThread.acts[0].id
                    ? {
                        ...a,
                        chapters: a.chapters.map(c =>
                          c.id === firstChapter.id
                            ? { ...c, pages: [...c.pages, newPage] }
                            : c
                        ),
                      }
                    : a
                ),
              };
            } else {
              // Create act -> chapter -> page
              const newAct: NarrativeAct = {
                id: createUniqueId([], 'act'),
                title: 'Act 1',
                chapters: [{
                  id: createUniqueId([], 'chapter'),
                  title: 'Chapter 1',
                  pages: [{
                    id: newId,
                    title: 'Page 1',
                    dialogueId: dialogueTreeId,
                    type: NARRATIVE_ELEMENT.PAGE,
                  }],
                }],
              };
              newThread = {
                ...effectiveThread,
                acts: [...effectiveThread.acts, newAct],
              };
            }
          }
        } else {
          // Fallback: add to first chapter of first act
          if (effectiveThread.acts.length > 0 && effectiveThread.acts[0].chapters.length > 0) {
            const firstChapter = effectiveThread.acts[0].chapters[0];
            const newPage: NarrativePage = {
              id: newId,
              title: `Page ${firstChapter.pages.length + 1}`,
              dialogueId: dialogueTreeId,
              type: NARRATIVE_ELEMENT.PAGE,
            };
            newThread = {
              ...effectiveThread,
              id: effectiveThread.id, // Preserve thread ID
              title: effectiveThread.title, // Preserve thread title
              acts: effectiveThread.acts.map(a =>
                a.id === effectiveThread.acts[0].id
                  ? {
                      ...a,
                      chapters: a.chapters.map(c =>
                        c.id === firstChapter.id
                          ? { ...c, pages: [...c.pages, newPage] }
                          : c
                      ),
                    }
                  : a
              ),
            };
          } else {
            // Create act -> chapter -> page
            const newAct: NarrativeAct = {
              id: createUniqueId([], 'act'),
              title: 'Act 1',
              chapters: [{
                id: createUniqueId([], 'chapter'),
                title: 'Chapter 1',
                pages: [{
                  id: newId,
                  title: 'Page 1',
                  dialogueId: dialogueTreeId,
                  type: NARRATIVE_ELEMENT.PAGE,
                }],
              }],
            };
            newThread = {
              ...effectiveThread,
              acts: [...effectiveThread.acts, newAct],
            };
          }
        }
      } else {
        // No auto-connect, add to first chapter of first act or create structure
        if (effectiveThread.acts.length > 0 && effectiveThread.acts[0].chapters.length > 0) {
          const firstChapter = effectiveThread.acts[0].chapters[0];
          const newPage: NarrativePage = {
            id: newId,
            title: `Page ${firstChapter.pages.length + 1}`,
            dialogueId: dialogueTreeId,
            type: NARRATIVE_ELEMENT.PAGE,
          };
          newThread = {
            ...effectiveThread,
            id: effectiveThread.id, // Preserve thread ID
            title: effectiveThread.title, // Preserve thread title
            acts: effectiveThread.acts.map(a =>
              a.id === effectiveThread.acts[0].id
                ? {
                    ...a,
                    chapters: a.chapters.map(c =>
                      c.id === firstChapter.id
                        ? { ...c, pages: [...c.pages, newPage] }
                        : c
                    ),
                  }
                : a
            ),
          };
        } else {
          // Create act -> chapter -> page
          const newAct: NarrativeAct = {
            id: createUniqueId([], 'act'),
            title: 'Act 1',
            chapters: [{
              id: createUniqueId([], 'chapter'),
              title: 'Chapter 1',
              pages: [{
                id: newId,
                title: 'Page 1',
                dialogueId: dialogueTreeId,
                type: NARRATIVE_ELEMENT.PAGE,
              }],
            }],
          };
          newThread = {
            ...effectiveThread,
            acts: [...effectiveThread.acts, newAct],
          };
        }
      }
    } else {
      // Unknown type, just return
      return;
    }

    // Mark that we're making a local update to prevent useEffect from overwriting
    localUpdateRef.current = newThread.id;
    
    // Immediately update the nodes/edges to reflect the new thread structure
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread);
    
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
    
    setContextMenu(null);
    connectingRef.current = null;
  }, [effectiveThread, onChange, dialogueTreeId, reactFlowInstance]);

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
    
    localUpdateRef.current = newThread.id;
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread);
    setNodes(() => newNodes);
    setEdges(() => newEdges);
    onChange(newThread);
  }, [effectiveThread, onChange]);

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
    
    localUpdateRef.current = newThread.id;
    const { nodes: newNodes, edges: newEdges } = convertNarrativeToReactFlow(newThread);
    setNodes(() => newNodes);
    setEdges(() => newEdges);
    onChange(newThread);
  }, [effectiveThread, onChange]);

  // Handle edge connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || !onChange) return;
    
    // Clear connecting ref since we successfully connected
    connectingRef.current = null;
    
    const newEdges = addEdge(connection, edges);
    setEdges(newEdges);
    
    // Mark that we're making a local update
    localUpdateRef.current = effectiveThread.id;
    
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

  // Handle connection end (check if dropped on empty space)
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingRef.current) return;
    
    // Use a small delay to check if onConnect was called (which means we connected to a node)
    // If onConnect wasn't called, we dropped on empty space
    setTimeout(() => {
      if (!connectingRef.current) return; // onConnect was called and cleared this
      
      // Dropped on empty space - show edge drop menu
      const clientX = 'clientX' in event ? event.clientX : (event.touches?.[0]?.clientX || 0);
      const clientY = 'clientY' in event ? event.clientY : (event.touches?.[0]?.clientY || 0);
      const point = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });
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
  }, [reactFlowInstance]);

  // Handle node/edge changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);
    
    // Convert back to narrative structure when nodes change
    // Preserve the thread ID to ensure the start node stays
    if (onChange) {
      // Mark that we're making a local update
      localUpdateRef.current = effectiveThread.id;
      
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
      localUpdateRef.current = effectiveThread.id;
      
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
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
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
        {contextMenu && (
          <NarrativeGraphEditorPaneContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            graphX={contextMenu.graphX}
            graphY={contextMenu.graphY}
            onAddElement={(type, x, y) => handleAddElement(type, x, y)}
            onClose={() => setContextMenu(null)}
          />
        )}
        
        {nodeContextMenu && (() => {
          const { elementType, nodeId, x, y } = nodeContextMenu;
          
          if (elementType === NARRATIVE_ELEMENT.THREAD) {
            return (
              <ThreadNodeContextMenu
                x={x}
                y={y}
                nodeId={nodeId}
                onEdit={() => {
                  onSelectElement?.(elementType, nodeId);
                  setNodeContextMenu(null);
                }}
                onAddAct={() => {
                  const point = reactFlowInstance.screenToFlowPosition({ x, y });
                  handleAddElement(NARRATIVE_ELEMENT.ACT, point.x, point.y, { fromNodeId: nodeId });
                  setNodeContextMenu(null);
                }}
                onClose={() => setNodeContextMenu(null)}
              />
            );
          }
          
          if (elementType === NARRATIVE_ELEMENT.ACT) {
            const act = effectiveThread.acts.find(a => a.id === nodeId);
            return (
              <ActNodeContextMenu
                x={x}
                y={y}
                nodeId={nodeId}
                onEdit={() => {
                  onSelectElement?.(elementType, nodeId);
                  setNodeContextMenu(null);
                }}
                onAddChapter={() => {
                  const point = reactFlowInstance.screenToFlowPosition({ x, y });
                  handleAddElement(NARRATIVE_ELEMENT.CHAPTER, point.x, point.y, { fromNodeId: nodeId });
                  setNodeContextMenu(null);
                }}
                onDelete={act ? () => {
                  handleDeleteElement(elementType, nodeId);
                  setNodeContextMenu(null);
                } : undefined}
                onClose={() => setNodeContextMenu(null)}
              />
            );
          }
          
          if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
            const chapter = effectiveThread.acts
              .flatMap(act => act.chapters)
              .find(c => c.id === nodeId);
            return (
              <ChapterNodeContextMenu
                x={x}
                y={y}
                nodeId={nodeId}
                onEdit={() => {
                  onSelectElement?.(elementType, nodeId);
                  setNodeContextMenu(null);
                }}
                onAddPage={() => {
                  const point = reactFlowInstance.screenToFlowPosition({ x, y });
                  handleAddElement(NARRATIVE_ELEMENT.PAGE, point.x, point.y, { fromNodeId: nodeId });
                  setNodeContextMenu(null);
                }}
                onDelete={chapter ? () => {
                  handleDeleteElement(elementType, nodeId);
                  setNodeContextMenu(null);
                } : undefined}
                onClose={() => setNodeContextMenu(null)}
              />
            );
          }
          
          if (elementType === NARRATIVE_ELEMENT.PAGE) {
            const page = effectiveThread.acts
              .flatMap(act => act.chapters)
              .flatMap(chapter => chapter.pages)
              .find(p => p.id === nodeId);
            return (
              <PageNodeContextMenu
                x={x}
                y={y}
                nodeId={nodeId}
                onEdit={() => {
                  onSelectElement?.(elementType, nodeId);
                  setNodeContextMenu(null);
                }}
                onDelete={page ? () => {
                  handleDeleteElement(elementType, nodeId);
                  setNodeContextMenu(null);
                } : undefined}
                onClose={() => setNodeContextMenu(null)}
              />
            );
          }
          
          return null;
        })()}
        
        {edgeDropMenu && (() => {
          const { fromElementType, fromNodeId, x, y, graphX, graphY } = edgeDropMenu;
          
          if (fromElementType === NARRATIVE_ELEMENT.THREAD) {
            return (
              <ThreadEdgeDropMenu
                x={x}
                y={y}
                graphX={graphX}
                graphY={graphY}
                fromNodeId={fromNodeId}
                onAddElement={(type, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId });
                  setEdgeDropMenu(null);
                }}
                onClose={() => setEdgeDropMenu(null)}
              />
            );
          }
          
          if (fromElementType === NARRATIVE_ELEMENT.ACT) {
            return (
              <ActEdgeDropMenu
                x={x}
                y={y}
                graphX={graphX}
                graphY={graphY}
                fromNodeId={fromNodeId}
                onAddElement={(type, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId });
                  setEdgeDropMenu(null);
                }}
                onClose={() => setEdgeDropMenu(null)}
              />
            );
          }
          
          if (fromElementType === NARRATIVE_ELEMENT.CHAPTER) {
            return (
              <ChapterEdgeDropMenu
                x={x}
                y={y}
                graphX={graphX}
                graphY={graphY}
                fromNodeId={fromNodeId}
                onAddElement={(type, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId });
                  setEdgeDropMenu(null);
                }}
                onClose={() => setEdgeDropMenu(null)}
              />
            );
          }
          
          if (fromElementType === NARRATIVE_ELEMENT.PAGE) {
            return (
              <PageEdgeDropMenu
                x={x}
                y={y}
                graphX={graphX}
                graphY={graphY}
                fromNodeId={fromNodeId}
                onAddElement={(type, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId });
                  setEdgeDropMenu(null);
                }}
                onClose={() => setEdgeDropMenu(null)}
              />
            );
          }
          
          return null;
        })()}
        
        {edgeContextMenu && (() => {
          const edge = edges.find(e => e.id === edgeContextMenu.edgeId);
          if (!edge) return null;
          
          const sourceNode = nodes.find(n => n.id === edge.source);
          const sourceType = sourceNode?.type as NarrativeElement;
          
          if (sourceType === NARRATIVE_ELEMENT.THREAD) {
            return (
              <ActEdgeContextMenu
                x={edgeContextMenu.x}
                y={edgeContextMenu.y}
                edgeId={edgeContextMenu.edgeId}
                graphX={edgeContextMenu.graphX}
                graphY={edgeContextMenu.graphY}
                onInsertElement={(type, edgeId, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId: edge.source });
                  setEdgeContextMenu(null);
                }}
                onClose={() => setEdgeContextMenu(null)}
              />
            );
          }
          
          if (sourceType === NARRATIVE_ELEMENT.ACT) {
            return (
              <ChapterEdgeContextMenu
                x={edgeContextMenu.x}
                y={edgeContextMenu.y}
                edgeId={edgeContextMenu.edgeId}
                graphX={edgeContextMenu.graphX}
                graphY={edgeContextMenu.graphY}
                onInsertElement={(type, edgeId, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId: edge.source });
                  setEdgeContextMenu(null);
                }}
                onClose={() => setEdgeContextMenu(null)}
              />
            );
          }
          
          if (sourceType === NARRATIVE_ELEMENT.CHAPTER) {
            return (
              <PageEdgeContextMenu
                x={edgeContextMenu.x}
                y={edgeContextMenu.y}
                edgeId={edgeContextMenu.edgeId}
                graphX={edgeContextMenu.graphX}
                graphY={edgeContextMenu.graphY}
                onInsertElement={(type, edgeId, x, y) => {
                  handleAddElement(type, x, y, { fromNodeId: edge.source });
                  setEdgeContextMenu(null);
                }}
                onClose={() => setEdgeContextMenu(null)}
              />
            );
          }
          
          return null;
        })()}
      </ReactFlow>
    </div>
  );
}

export function NarrativeGraphEditor(props: NarrativeGraphEditorProps) {
  return (
    <ReactFlowProvider>
      <NarrativeGraphEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
