import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  Panel,
  BackgroundVariant,
} from 'reactflow';
import {
  Trash2,
  Clapperboard,
  BookOpen,
  FileText,
  Eye,
  MessageSquare,
  Plus,
} from 'lucide-react';
import 'reactflow/dist/style.css';

import {
  NarrativeThread,
  ActNode as ActNodeType,
  ChapterNode as ChapterNodeType,
  PageNode as PageNodeType,
  NARRATIVE_NODE_TYPE,
} from '../types/narrative';
import {
  convertNarrativeThreadToReactFlow,
  updateNarrativeThreadFromReactFlow,
  NODE_SPACING,
} from '../utils/narrative-converter';
import {
  createActNode,
  createChapterNode,
  createPageNode,
  addActToThread,
  addChapterToAct,
  addPageToChapter,
  removeActFromThread,
  removeChapterFromAct,
  removePageFromChapter,
  generateNodeId,
  buildLinearSequence,
} from '../utils/narrative-helpers';
import { ActNodeV2 } from './ActNodeV2';
import { ChapterNodeV2 } from './ChapterNodeV2';
import { PageNodeV2 } from './PageNodeV2';
import { StoryletNodeV2 } from './StoryletNodeV2';
import { StartNodeV2, EndNodeV2 } from './StartEndNodeV2';

const narrativeNodeTypes = {
  [NARRATIVE_NODE_TYPE.ACT]: ActNodeV2,
  [NARRATIVE_NODE_TYPE.CHAPTER]: ChapterNodeV2,
  [NARRATIVE_NODE_TYPE.PAGE]: PageNodeV2,
  [NARRATIVE_NODE_TYPE.STORYLET]: StoryletNodeV2,
  start: StartNodeV2,
  end: EndNodeV2,
};

interface NarrativeGraphViewProps {
  thread: NarrativeThread;
  onChange: (thread: NarrativeThread) => void;
  onNodeSelect?: (nodeId: string | null, nodeType: string | null) => void;
  onEnterDialogue?: (nodeId: string, dialogueTreeId: string | null) => void;
  className?: string;
}

function NarrativeGraphViewInternal({
  thread,
  onChange,
  onNodeSelect,
  onEnterDialogue,
  className = '',
}: NarrativeGraphViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    graphX: number;
    graphY: number;
  } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeType: string;
  } | null>(null);

  const reactFlowInstance = useReactFlow();

  const memoizedNodeTypes = useMemo(() => narrativeNodeTypes, []);

  const { nodes, edges } = useMemo(
    () => convertNarrativeThreadToReactFlow(thread),
    [thread]
  );

  const [rfNodes, setRfNodes] = useState<Node[]>(nodes);
  const [rfEdges, setRfEdges] = useState<Edge[]>(edges);

  React.useEffect(() => {
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setRfNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        const positionChanges = changes.filter(
          (c) => c.type === 'position' && 'position' in c && c.dragging === false
        );
        if (positionChanges.length > 0) {
          const updatedThread = updateNarrativeThreadFromReactFlow(thread, next);
          onChange(updatedThread);
        }
        return next;
      });
    },
    [thread, onChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setRfEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === '__start__' || node.id === '__end__') {
        setSelectedNodeId(null);
        onNodeSelect?.(null, null);
        return;
      }
      setSelectedNodeId(node.id);
      onNodeSelect?.(node.id, node.type || null);
      setContextMenu(null);
      setNodeContextMenu(null);
    },
    [onNodeSelect]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === '__start__' || node.id === '__end__') return;
      
      if (node.type === NARRATIVE_NODE_TYPE.PAGE) {
        const page = thread.nodes.pages[node.id];
        onEnterDialogue?.(node.id, page?.dialogueTreeId || null);
      }
    },
    [thread, onEnterDialogue]
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        graphX: position.x,
        graphY: position.y,
      });
      setNodeContextMenu(null);
    },
    [reactFlowInstance]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.id === '__start__' || node.id === '__end__') return;
      
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType: node.type || '',
      });
      setContextMenu(null);
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
    setNodeContextMenu(null);
  }, []);

  const getNextPosition = useCallback(() => {
    const sequence = buildLinearSequence(thread);
    const lastRealNode = sequence.filter(s => s.type !== 'start' && s.type !== 'end').pop();
    const nextIndex = lastRealNode ? lastRealNode.sequenceIndex + 1 : 1;
    return {
      x: nextIndex * NODE_SPACING.horizontal,
      y: NODE_SPACING.vertical.act,
    };
  }, [thread]);

  const handleAddAct = useCallback(() => {
    const pos = contextMenu ? { x: contextMenu.graphX, y: contextMenu.graphY } : getNextPosition();
    const actId = generateNodeId('act');
    const newAct = createActNode(
      actId,
      'New Act',
      pos.x,
      pos.y,
      thread.actIds.length
    );

    const updatedThread = addActToThread(thread, newAct);
    onChange(updatedThread);
    setContextMenu(null);
    setSelectedNodeId(actId);
    onNodeSelect?.(actId, NARRATIVE_NODE_TYPE.ACT);
  }, [thread, onChange, contextMenu, getNextPosition, onNodeSelect]);

  const handleAddChapter = useCallback(
    (actId: string) => {
      const act = thread.nodes.acts[actId];
      if (!act) return;

      const chapterId = generateNodeId('chapter');
      const sequence = buildLinearSequence(thread);
      const actInSequence = sequence.find(s => s.id === actId);
      const nextIndex = actInSequence ? actInSequence.sequenceIndex + act.chapterIds.length + 1 : 1;

      const newChapter = createChapterNode(
        chapterId,
        actId,
        'New Chapter',
        nextIndex * NODE_SPACING.horizontal,
        NODE_SPACING.vertical.chapter,
        act.chapterIds.length
      );

      const updatedThread = addChapterToAct(thread, actId, newChapter);
      onChange(updatedThread);
      setNodeContextMenu(null);
      setSelectedNodeId(chapterId);
      onNodeSelect?.(chapterId, NARRATIVE_NODE_TYPE.CHAPTER);
    },
    [thread, onChange, onNodeSelect]
  );

  const handleAddPage = useCallback(
    (chapterId: string) => {
      const chapter = thread.nodes.chapters[chapterId];
      if (!chapter) return;

      const pageId = generateNodeId('page');
      const sequence = buildLinearSequence(thread);
      const chapterInSequence = sequence.find(s => s.id === chapterId);
      const nextIndex = chapterInSequence ? chapterInSequence.sequenceIndex + chapter.pageIds.length + 1 : 1;

      const newPage = createPageNode(
        pageId,
        chapterId,
        'New Page',
        nextIndex * NODE_SPACING.horizontal,
        NODE_SPACING.vertical.page,
        chapter.pageIds.length
      );

      const updatedThread = addPageToChapter(thread, chapterId, newPage);
      onChange(updatedThread);
      setNodeContextMenu(null);
      setSelectedNodeId(pageId);
      onNodeSelect?.(pageId, NARRATIVE_NODE_TYPE.PAGE);
    },
    [thread, onChange, onNodeSelect]
  );

  const handleDeleteNode = useCallback(() => {
    if (!nodeContextMenu) return;

    const { nodeId, nodeType } = nodeContextMenu;
    let updatedThread = thread;

    if (nodeType === NARRATIVE_NODE_TYPE.ACT) {
      updatedThread = removeActFromThread(thread, nodeId);
    } else if (nodeType === NARRATIVE_NODE_TYPE.CHAPTER) {
      updatedThread = removeChapterFromAct(thread, nodeId);
    } else if (nodeType === NARRATIVE_NODE_TYPE.PAGE) {
      updatedThread = removePageFromChapter(thread, nodeId);
    }

    onChange(updatedThread);
    setNodeContextMenu(null);
    setSelectedNodeId(null);
    onNodeSelect?.(null, null);
  }, [thread, onChange, nodeContextMenu, onNodeSelect]);

  const handleEditDialogue = useCallback(
    (nodeId: string) => {
      const page = thread.nodes.pages[nodeId];
      onEnterDialogue?.(nodeId, page?.dialogueTreeId || null);
      setNodeContextMenu(null);
    },
    [thread, onEnterDialogue]
  );

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={memoizedNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'start') return '#10b981';
            if (node.type === 'end') return '#f43f5e';
            if (node.type === NARRATIVE_NODE_TYPE.ACT) return '#f59e0b';
            if (node.type === NARRATIVE_NODE_TYPE.CHAPTER) return '#3b82f6';
            if (node.type === NARRATIVE_NODE_TYPE.PAGE) return '#10b981';
            return '#8b5cf6';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ backgroundColor: '#1f2937' }}
        />

        <Panel position="top-left" className="bg-gray-900/90 border border-gray-700 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{thread.title || 'Narrative Thread'}</span>
            <button
              onClick={handleAddAct}
              className="text-xs px-2 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white flex items-center gap-1"
            >
              <Plus size={12} />
              Add Act
            </button>
          </div>
        </Panel>

        <Panel position="top-right" className="text-[10px] text-gray-500">
          Click to select | Double-click Page for dialogue | Right-click for options
        </Panel>
      </ReactFlow>

      {contextMenu && (
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleAddAct}
            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <Clapperboard size={14} className="text-amber-400" />
            Add Act
          </button>
        </div>
      )}

      {nodeContextMenu && (
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-50 min-w-[180px]"
          style={{ left: nodeContextMenu.x, top: nodeContextMenu.y }}
        >
          {nodeContextMenu.nodeType === NARRATIVE_NODE_TYPE.ACT && (
            <button
              onClick={() => handleAddChapter(nodeContextMenu.nodeId)}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
            >
              <BookOpen size={14} className="text-blue-400" />
              Add Chapter to Act
            </button>
          )}

          {nodeContextMenu.nodeType === NARRATIVE_NODE_TYPE.CHAPTER && (
            <button
              onClick={() => handleAddPage(nodeContextMenu.nodeId)}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
            >
              <FileText size={14} className="text-emerald-400" />
              Add Page to Chapter
            </button>
          )}

          {nodeContextMenu.nodeType === NARRATIVE_NODE_TYPE.PAGE && (
            <button
              onClick={() => handleEditDialogue(nodeContextMenu.nodeId)}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
            >
              <MessageSquare size={14} className="text-cyan-400" />
              {thread.nodes.pages[nodeContextMenu.nodeId]?.dialogueTreeId ? 'Edit Dialogue' : 'Create Dialogue'}
            </button>
          )}

          <div className="border-t border-gray-700 my-1" />

          <button
            onClick={handleDeleteNode}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function NarrativeGraphView(props: NarrativeGraphViewProps) {
  return (
    <ReactFlowProvider>
      <NarrativeGraphViewInternal {...props} />
    </ReactFlowProvider>
  );
}
