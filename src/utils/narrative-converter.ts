import type { Edge, Node, Position } from 'reactflow';
import { Position as ReactFlowPosition } from 'reactflow';
import {
  NARRATIVE_ELEMENT,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativeElement,
  type NarrativePage,
  type StoryThread,
  type NarrativeDetour,
  type NarrativeConditional,
  type NarrativeEdge,
} from '../types/narrative';

export type LayoutDirection = 'TB' | 'LR';

export interface NarrativeFlowNodeData {
  label: string;
  type: NarrativeElement;
  meta: {
    actId?: string;
    chapterId?: string;
    pageId?: string;
  };
  description?: string;
  isDimmed?: boolean;
  isInPath?: boolean;
  // Context menu callbacks
  onAddPage?: () => void;
  onAddChapter?: () => void;
  onAddAct?: () => void;
  onEditDialogue?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canAddChapter?: boolean;
  canAddAct?: boolean;
}

export type NarrativeFlowNode = Node<NarrativeFlowNodeData>;
export type NarrativeFlowEdge = Edge;

interface IndexTracker {
  chapter: number;
  page: number;
}

function basePosition(index: number, depth: number, direction: LayoutDirection): { x: number; y: number } {
  const spacingX = 320;
  const spacingY = 220;
  if (direction === 'LR') {
    return { x: depth * spacingX, y: index * spacingY };
  }
  return { x: index * spacingX, y: depth * spacingY };
}

function addThreadNode(
  nodes: NarrativeFlowNode[],
  thread: StoryThread,
  direction: LayoutDirection
): void {
  nodes.push({
    id: thread.id,
    type: NARRATIVE_ELEMENT.THREAD,
    position: thread.position || basePosition(0, 0, direction),
    data: {
      label: thread.title || 'Untitled Thread',
      type: NARRATIVE_ELEMENT.THREAD,
      description: thread.summary,
      meta: {},
    },
    sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
    targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
  });
}

function addActNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  thread: StoryThread,
  direction: LayoutDirection,
  tracker: IndexTracker
): void {
  thread.acts.forEach((act, actIdx) => {
    nodes.push({
      id: act.id,
      type: NARRATIVE_ELEMENT.ACT,
      position: act.position || basePosition(actIdx, 1, direction),
      data: {
        label: act.title || `Act ${actIdx + 1}`,
        type: NARRATIVE_ELEMENT.ACT,
        description: act.summary,
        meta: { actId: act.id },
      },
      sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
      targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
    });

    addChapterNodes(nodes, edges, thread, act, direction, tracker);
  });
}

function addChapterNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  thread: StoryThread,
  act: NarrativeAct,
  direction: LayoutDirection,
  tracker: IndexTracker
): void {
  act.chapters.forEach((chapter, chapterIdx) => {
    const fallbackPosition = basePosition(tracker.chapter, 2, direction);
    tracker.chapter += 1;

    nodes.push({
      id: chapter.id,
      type: NARRATIVE_ELEMENT.CHAPTER,
      position: chapter.position || fallbackPosition,
      data: {
        label: chapter.title || 'Untitled Chapter',
        type: NARRATIVE_ELEMENT.CHAPTER,
        description: chapter.summary,
        meta: { actId: act.id, chapterId: chapter.id },
      },
      sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
      targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
    });

    addPageNodes(nodes, edges, thread, act, chapter, direction, tracker);
  });
}

function addPageNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  thread: StoryThread,
  act: NarrativeAct,
  chapter: NarrativeChapter,
  direction: LayoutDirection,
  tracker: IndexTracker
): void {
  chapter.pages.forEach((page, pageIndex) => {
    const fallbackPosition = basePosition(tracker.page, 3, direction);
    tracker.page += 1;

    nodes.push({
      id: page.id,
      type: NARRATIVE_ELEMENT.PAGE,
      position: page.position || fallbackPosition,
      data: {
        label: page.title || `Page ${pageIndex + 1}`,
        type: NARRATIVE_ELEMENT.PAGE,
        description: page.summary,
        meta: { actId: act.id, chapterId: chapter.id, pageId: page.id },
      },
      sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
      targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
    });
  });
}

export function convertNarrativeToReactFlow(
  thread: StoryThread,
  direction: LayoutDirection = 'TB'
): { nodes: NarrativeFlowNode[]; edges: NarrativeFlowEdge[] } {
  const nodes: NarrativeFlowNode[] = [];
  const edges: NarrativeFlowEdge[] = [];
  const tracker: IndexTracker = {
    chapter: 0,
    page: 0,
  };

  addThreadNode(nodes, thread, direction);
  addActNodes(nodes, edges, thread, direction, tracker);
  
  addDetourNodes(nodes, thread, direction, tracker);
  addConditionalNodes(nodes, thread, direction, tracker);
  
  if (thread.edges && thread.edges.length > 0) {
    thread.edges.forEach(edge => {
      edges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: edge.animated,
        data: {},
      });
    });
  } else {
    addInferredEdges(edges, thread);
  }

  return { nodes, edges };
}

function addDetourNodes(
  nodes: NarrativeFlowNode[],
  thread: StoryThread,
  direction: LayoutDirection,
  tracker: IndexTracker
): void {
  if (!thread.detours) return;
  
  thread.detours.forEach((detour, idx) => {
    const fallbackPosition = basePosition(tracker.page + idx, 4, direction);
    
    nodes.push({
      id: detour.id,
      type: NARRATIVE_ELEMENT.DETOUR,
      position: detour.position || fallbackPosition,
      data: {
        id: detour.id,
        label: detour.title || 'Detour',
        type: NARRATIVE_ELEMENT.DETOUR,
        description: detour.summary,
        storyletId: detour.storyletId,
        returnNodeId: detour.returnNodeId,
        meta: {},
      } as NarrativeFlowNodeData,
      sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
      targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
    });
  });
}

function addConditionalNodes(
  nodes: NarrativeFlowNode[],
  thread: StoryThread,
  direction: LayoutDirection,
  tracker: IndexTracker
): void {
  if (!thread.conditionals) return;
  
  thread.conditionals.forEach((conditional, idx) => {
    const fallbackPosition = basePosition(tracker.page + idx, 4, direction);
    
    nodes.push({
      id: conditional.id,
      type: NARRATIVE_ELEMENT.CONDITIONAL,
      position: conditional.position || fallbackPosition,
      data: {
        label: conditional.title || 'Conditional',
        type: NARRATIVE_ELEMENT.CONDITIONAL,
        conditions: conditional.conditions,
        trueBranchNodeId: conditional.trueBranchNodeId,
        falseBranchNodeId: conditional.falseBranchNodeId,
        meta: {},
      } as NarrativeFlowNodeData,
      sourcePosition: direction === 'LR' ? ReactFlowPosition.Right : ReactFlowPosition.Bottom,
      targetPosition: direction === 'LR' ? ReactFlowPosition.Left : ReactFlowPosition.Top,
    });
  });
}

function addInferredEdges(edges: NarrativeFlowEdge[], thread: StoryThread): void {
  edges.push({
    id: `thread-act-start`,
    source: thread.id,
    target: thread.startActId || thread.acts[0]?.id,
    animated: true,
    data: {
      sourceType: NARRATIVE_ELEMENT.THREAD,
      targetType: NARRATIVE_ELEMENT.ACT,
    },
  });
  
  thread.acts.forEach(act => {
    if (act.startChapterId || act.chapters[0]) {
      edges.push({
        id: `act-chapter-${act.id}`,
        source: act.id,
        target: act.startChapterId || act.chapters[0]?.id,
        animated: true,
        data: {
          sourceType: NARRATIVE_ELEMENT.ACT,
          targetType: NARRATIVE_ELEMENT.CHAPTER,
        },
      });
    }
    
    act.chapters.forEach(chapter => {
      if (chapter.startPageId || chapter.pages[0]) {
        edges.push({
          id: `chapter-page-${chapter.id}`,
          source: chapter.id,
          target: chapter.startPageId || chapter.pages[0]?.id,
          animated: true,
          data: {
            sourceType: NARRATIVE_ELEMENT.CHAPTER,
            targetType: NARRATIVE_ELEMENT.PAGE,
          },
        });
      }
      
      chapter.pages.forEach(page => {
        if (page.nextPageId) {
          edges.push({
            id: `page-page-${page.id}-${page.nextPageId}`,
            source: page.id,
            target: page.nextPageId,
            data: {
              sourceType: NARRATIVE_ELEMENT.PAGE,
              targetType: NARRATIVE_ELEMENT.PAGE,
            },
          });
        }
        if (page.nextChapterId) {
          edges.push({
            id: `page-chapter-${page.id}-${page.nextChapterId}`,
            source: page.id,
            target: page.nextChapterId,
            data: {
              sourceType: NARRATIVE_ELEMENT.PAGE,
              targetType: NARRATIVE_ELEMENT.CHAPTER,
            },
          });
        }
        if (page.nextActId) {
          edges.push({
            id: `page-act-${page.id}-${page.nextActId}`,
            source: page.id,
            target: page.nextActId,
            data: {
              sourceType: NARRATIVE_ELEMENT.PAGE,
              targetType: NARRATIVE_ELEMENT.ACT,
            },
          });
        }
      });
    });
  });
}

function compareNodesByPosition(a: Node, b: Node): number {
  if (a.position.y !== b.position.y) {
    return a.position.y - b.position.y;
  }
  return a.position.x - b.position.x;
}

export function convertReactFlowToNarrative(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[]
): StoryThread {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const threadNode = nodes.find(node => node.type === NARRATIVE_ELEMENT.THREAD);

  const threadToActs = new Map<string, Set<string>>();
  const actToChapters = new Map<string, Set<string>>();
  const chapterToPages = new Map<string, Set<string>>();
  const pageToPage = new Map<string, string>();
  const pageToChapter = new Map<string, string>();
  const pageToAct = new Map<string, string>();
  const animatedEdges = new Set<string>();

  edges.forEach(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;

    if (edge.animated) {
      animatedEdges.add(edge.id);
    }

    if (source.type === NARRATIVE_ELEMENT.THREAD && target.type === NARRATIVE_ELEMENT.ACT) {
      if (!threadToActs.has(source.id)) {
        threadToActs.set(source.id, new Set());
      }
      threadToActs.get(source.id)?.add(target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.ACT && target.type === NARRATIVE_ELEMENT.CHAPTER) {
      if (!actToChapters.has(source.id)) {
        actToChapters.set(source.id, new Set());
      }
      actToChapters.get(source.id)?.add(target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.CHAPTER && target.type === NARRATIVE_ELEMENT.PAGE) {
      if (!chapterToPages.has(source.id)) {
        chapterToPages.set(source.id, new Set());
      }
      chapterToPages.get(source.id)?.add(target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.PAGE && target.type === NARRATIVE_ELEMENT.PAGE) {
      pageToPage.set(source.id, target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.PAGE && target.type === NARRATIVE_ELEMENT.CHAPTER) {
      pageToChapter.set(source.id, target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.PAGE && target.type === NARRATIVE_ELEMENT.ACT) {
      pageToAct.set(source.id, target.id);
    }
  });

  const actNodes = nodes
    .filter(node => node.type === NARRATIVE_ELEMENT.ACT)
    .sort(compareNodesByPosition);

  const threadId = threadNode?.id || 'empty-thread';
  const actIds = threadToActs.get(threadId)
    ? Array.from(threadToActs.get(threadId) ?? [])
    : actNodes.map(node => node.id);

  let startActId: string | undefined = undefined;

  const acts = actIds
    .map(actId => nodeMap.get(actId))
    .filter((node): node is NarrativeFlowNode => Boolean(node))
    .sort(compareNodesByPosition)
    .map((actNode, actIndex) => {
      const chapterIds = actToChapters.get(actNode.id)
        ? Array.from(actToChapters.get(actNode.id) ?? [])
        : [];

      let startChapterId: string | undefined = undefined;

      const chapters = chapterIds
        .map(chapterId => nodeMap.get(chapterId))
        .filter((node): node is NarrativeFlowNode => Boolean(node))
        .sort(compareNodesByPosition)
        .map((chapterNode, chapterIndex) => {
          const pageIds = chapterToPages.get(chapterNode.id)
            ? Array.from(chapterToPages.get(chapterNode.id) ?? [])
            : [];

          let startPageId: string | undefined = undefined;

          const pages = pageIds
            .map(pageId => nodeMap.get(pageId))
            .filter((node): node is NarrativeFlowNode => Boolean(node))
            .sort(compareNodesByPosition)
            .map((pageNode, pageIndex) => {
              const page: NarrativePage = {
                id: pageNode.id,
                title: pageNode.data.label,
                summary: pageNode.data.description,
                dialogueId: '',
                type: NARRATIVE_ELEMENT.PAGE,
                position: { x: pageNode.position.x, y: pageNode.position.y },
              };

              const nextPageId = pageToPage.get(pageNode.id);
              if (nextPageId) {
                page.nextPageId = nextPageId;
              }

              const nextChapterId = pageToChapter.get(pageNode.id);
              if (nextChapterId) {
                page.nextChapterId = nextChapterId;
              }

              const nextActId = pageToAct.get(pageNode.id);
              if (nextActId) {
                page.nextActId = nextActId;
              }

              const edgeId = `chapter-page-${page.id}`;
              if (animatedEdges.has(edgeId) || pageIndex === 0) {
                startPageId = startPageId || page.id;
              }

              return page;
            });

          const chapter: NarrativeChapter = {
            id: chapterNode.id,
            title: chapterNode.data.label,
            summary: chapterNode.data.description,
            pages,
            type: NARRATIVE_ELEMENT.CHAPTER,
            startPageId: startPageId || pages[0]?.id,
            position: { x: chapterNode.position.x, y: chapterNode.position.y },
          };

          const edgeId = `act-chapter-${chapter.id}`;
          if (animatedEdges.has(edgeId) || chapterIndex === 0) {
            startChapterId = startChapterId || chapter.id;
          }

          return chapter;
        });

      const act: NarrativeAct = {
        id: actNode.id,
        title: actNode.data.label,
        summary: actNode.data.description,
        chapters,
        type: NARRATIVE_ELEMENT.ACT,
        startChapterId: startChapterId || chapters[0]?.id,
        position: { x: actNode.position.x, y: actNode.position.y },
      };

      const edgeId = `thread-act-${act.id}`;
      if (animatedEdges.has(edgeId) || actIndex === 0) {
        startActId = startActId || act.id;
      }

      return act;
    });

  const detourNodes = nodes.filter(node => node.type === NARRATIVE_ELEMENT.DETOUR);
  const detours: NarrativeDetour[] = detourNodes.map(node => ({
    id: node.id,
    title: node.data.label,
    summary: node.data.description,
    storyletId: (node.data as unknown as { storyletId?: string }).storyletId || '',
    returnNodeId: (node.data as unknown as { returnNodeId?: string }).returnNodeId,
type: NARRATIVE_ELEMENT.DETOUR,
    position: { x: node.position.x, y: node.position.y },
  }));

  const conditionalNodes = nodes.filter(node => node.type === NARRATIVE_ELEMENT.CONDITIONAL);
  const conditionals: NarrativeConditional[] = conditionalNodes.map(node => ({
    id: node.id,
    title: node.data.label,
    conditions: (node.data as unknown as { conditions?: NarrativeConditional['conditions'] }).conditions || [],
    trueBranchNodeId: (node.data as unknown as { trueBranchNodeId?: string }).trueBranchNodeId,
    falseBranchNodeId: (node.data as unknown as { falseBranchNodeId?: string }).falseBranchNodeId,
    type: NARRATIVE_ELEMENT.CONDITIONAL,
    position: { x: node.position.x, y: node.position.y },
  }));

  const narrativeEdges: NarrativeEdge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || undefined,
    targetHandle: edge.targetHandle || undefined,
    label: typeof edge.label === 'string' ? edge.label : undefined,
    animated: edge.animated,
  }));

  return {
    id: threadId,
    title: threadNode?.data.label || 'Empty Thread',
    summary: threadNode?.data.description,
    acts,
    type: NARRATIVE_ELEMENT.THREAD,
    startActId: startActId || acts[0]?.id,
    position: threadNode ? { x: threadNode.position.x, y: threadNode.position.y } : undefined,
    edges: narrativeEdges,
    detours: detours.length > 0 ? detours : undefined,
    conditionals: conditionals.length > 0 ? conditionals : undefined,
  };
}
