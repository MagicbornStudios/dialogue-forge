import { Node, Edge, Position } from 'reactflow';
import {
  NarrativeThread,
  ActNode,
  ChapterNode,
  PageNode,
  StoryletNode,
  NARRATIVE_NODE_TYPE,
} from '../types/narrative';
import { buildLinearSequence, LinearSequenceItem } from './narrative-helpers';

export const NARRATIVE_EDGE_COLORS = {
  sequence: '#6b7280',
  actToChapter: '#f59e0b',
  chapterToPage: '#3b82f6',
  pageFlow: '#10b981',
  storylet: '#8b5cf6',
};

export const NODE_SPACING = {
  horizontal: 280,
  vertical: {
    act: 0,
    chapter: 80,
    page: 160,
    start: 80,
    end: 80,
  },
};

export interface NarrativeReactFlowNodeData {
  node: ActNode | ChapterNode | PageNode | StoryletNode | null;
  sequenceItem: LinearSequenceItem;
  chapterCount?: number;
  pageCount?: number;
  hasDialogue: boolean;
  storyletCount: number;
}

export type NarrativeReactFlowNode = Node<NarrativeReactFlowNodeData>;
export type NarrativeReactFlowEdge = Edge;

function getEdgeColor(sourceType: string, targetType: string): string {
  if (sourceType === 'start' || targetType === 'end') return NARRATIVE_EDGE_COLORS.sequence;
  if (sourceType === 'act' && targetType === 'chapter') return NARRATIVE_EDGE_COLORS.actToChapter;
  if (sourceType === 'chapter' && targetType === 'page') return NARRATIVE_EDGE_COLORS.chapterToPage;
  if (sourceType === 'page' && targetType === 'page') return NARRATIVE_EDGE_COLORS.pageFlow;
  if (sourceType === 'page' && targetType === 'chapter') return NARRATIVE_EDGE_COLORS.chapterToPage;
  if (sourceType === 'chapter' && targetType === 'act') return NARRATIVE_EDGE_COLORS.actToChapter;
  if (sourceType === 'page' && targetType === 'act') return NARRATIVE_EDGE_COLORS.actToChapter;
  return NARRATIVE_EDGE_COLORS.sequence;
}

export function convertNarrativeThreadToReactFlow(thread: NarrativeThread): {
  nodes: NarrativeReactFlowNode[];
  edges: NarrativeReactFlowEdge[];
} {
  const nodes: NarrativeReactFlowNode[] = [];
  const edges: NarrativeReactFlowEdge[] = [];
  
  const sequence = buildLinearSequence(thread);
  
  sequence.forEach((item, index) => {
    const x = item.sequenceIndex * NODE_SPACING.horizontal;
    const y = NODE_SPACING.vertical[item.type] || 0;
    
    let hasDialogue = false;
    let storyletCount = 0;
    let chapterCount = 0;
    let pageCount = 0;
    
    if (item.type === 'act' && item.node) {
      const actNode = item.node as ActNode;
      hasDialogue = !!actNode.dialogueTreeId;
      storyletCount = actNode.storyletIds?.length || 0;
      chapterCount = actNode.chapterIds.length;
    } else if (item.type === 'chapter' && item.node) {
      const chapterNode = item.node as ChapterNode;
      hasDialogue = !!chapterNode.dialogueTreeId;
      storyletCount = chapterNode.storyletIds?.length || 0;
      pageCount = chapterNode.pageIds.length;
    } else if (item.type === 'page' && item.node) {
      const pageNode = item.node as PageNode;
      hasDialogue = !!pageNode.dialogueTreeId;
      storyletCount = pageNode.storyletIds?.length || 0;
    }
    
    const nodeType = item.type === 'start' || item.type === 'end' 
      ? item.type 
      : NARRATIVE_NODE_TYPE[item.type.toUpperCase() as keyof typeof NARRATIVE_NODE_TYPE];
    
    nodes.push({
      id: item.id,
      type: nodeType,
      position: { x, y },
      data: {
        node: item.node,
        sequenceItem: item,
        chapterCount,
        pageCount,
        hasDialogue,
        storyletCount,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    
    if (index < sequence.length - 1) {
      const nextItem = sequence[index + 1];
      edges.push({
        id: `${item.id}-${nextItem.id}`,
        source: item.id,
        target: nextItem.id,
        type: 'smoothstep',
        style: {
          stroke: getEdgeColor(item.type, nextItem.type),
          strokeWidth: 2,
        },
      });
    }
  });
  
  return { nodes, edges };
}

export function updateNarrativeThreadFromReactFlow(
  thread: NarrativeThread,
  nodes: Node[]
): NarrativeThread {
  const updatedActs = { ...thread.nodes.acts };
  const updatedChapters = { ...thread.nodes.chapters };
  const updatedPages = { ...thread.nodes.pages };

  nodes.forEach((rfNode) => {
    if (rfNode.id === '__start__' || rfNode.id === '__end__') return;
    
    if (updatedActs[rfNode.id]) {
      updatedActs[rfNode.id] = {
        ...updatedActs[rfNode.id],
        x: rfNode.position.x,
        y: rfNode.position.y,
      };
    } else if (updatedChapters[rfNode.id]) {
      updatedChapters[rfNode.id] = {
        ...updatedChapters[rfNode.id],
        x: rfNode.position.x,
        y: rfNode.position.y,
      };
    } else if (updatedPages[rfNode.id]) {
      updatedPages[rfNode.id] = {
        ...updatedPages[rfNode.id],
        x: rfNode.position.x,
        y: rfNode.position.y,
      };
    }
  });

  return {
    ...thread,
    nodes: {
      acts: updatedActs,
      chapters: updatedChapters,
      pages: updatedPages,
    },
  };
}

export function getStoryletsForPage(
  thread: NarrativeThread,
  pageId: string
): StoryletNode[] {
  const page = thread.nodes.pages[pageId];
  if (!page) return [];
  
  const storyletIds = page.storyletIds || [];
  const storyletNodes: StoryletNode[] = [];

  storyletIds.forEach((id) => {
    const storylet = thread.storylets[id];
    if (storylet) {
      storyletNodes.push({
        id: storylet.id,
        type: NARRATIVE_NODE_TYPE.STORYLET,
        title: storylet.title,
        description: storylet.description,
        x: 0,
        y: 0,
        order: 0,
        category: storylet.category,
        repeatable: storylet.repeatable,
        cooldown: storylet.cooldown,
        conditions: storylet.conditions,
      });
    }
  });

  return storyletNodes;
}
