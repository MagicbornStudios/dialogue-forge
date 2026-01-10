import type { Edge, Node } from 'reactflow';
import {
  NARRATIVE_ELEMENT,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativeElement,
  type NarrativePage,
  type StoryThread,
  type StoryletPool,
  type StoryletPoolMember,
  type StoryletTemplate,
} from '../types/narrative';

export interface NarrativeFlowNodeData {
  element: StoryThread | NarrativeAct | NarrativeChapter | NarrativePage;
  elementType: NarrativeElement;
  isDimmed?: boolean;
  isInPath?: boolean;
}

export type NarrativeFlowNode = Node<NarrativeFlowNodeData>;
export type NarrativeFlowEdge = Edge;

const LEVEL_X = {
  [NARRATIVE_ELEMENT.THREAD]: 0,
  [NARRATIVE_ELEMENT.ACT]: 260,
  [NARRATIVE_ELEMENT.CHAPTER]: 540,
  [NARRATIVE_ELEMENT.PAGE]: 820,
  [NARRATIVE_ELEMENT.STORYLET]: 1100,
} as const;

const PAGE_SPACING = 140;
const CHAPTER_GAP = 80;
const ACT_GAP = 140;

function normalizeStoryletTemplate(storylet: StoryletTemplate): StoryletTemplate {
  return {
    id: storylet.id,
    title: storylet.title,
    summary: storylet.summary,
    dialogueId: storylet.dialogueId,
    conditions: storylet.conditions ? [...storylet.conditions] : undefined,
    type: NARRATIVE_ELEMENT.STORYLET,
  };
}

function normalizeStoryletMember(member: StoryletPoolMember): StoryletPoolMember {
  return {
    templateId: member.templateId,
    weight: member.weight,
  };
}

function normalizeStoryletPool(pool: StoryletPool): StoryletPool {
  return {
    id: pool.id,
    title: pool.title,
    summary: pool.summary,
    selectionMode: pool.selectionMode,
    members: pool.members.map(normalizeStoryletMember),
    fallbackTemplateId: pool.fallbackTemplateId,
  };
}

function stripThread(thread: StoryThread): StoryThread {
  return {
    id: thread.id,
    title: thread.title,
    summary: thread.summary,
    acts: [],
    type: NARRATIVE_ELEMENT.THREAD,
  };
}

function stripAct(act: NarrativeAct): NarrativeAct {
  return {
    id: act.id,
    title: act.title,
    summary: act.summary,
    chapters: [],
    type: NARRATIVE_ELEMENT.ACT,
  };
}

function stripChapter(chapter: NarrativeChapter): NarrativeChapter {
  return {
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    pages: [],
    storyletTemplates: chapter.storyletTemplates
      ? chapter.storyletTemplates.map(normalizeStoryletTemplate)
      : undefined,
    storyletPools: chapter.storyletPools
      ? chapter.storyletPools.map(normalizeStoryletPool)
      : undefined,
    type: NARRATIVE_ELEMENT.CHAPTER,
  };
}

function stripPage(page: NarrativePage): NarrativePage {
  return {
    id: page.id,
    title: page.title,
    summary: page.summary,
    dialogueId: page.dialogueId,
    type: NARRATIVE_ELEMENT.PAGE,
  };
}

function edgeId(sourceId: string, targetId: string): string {
  return `narrative-${sourceId}-${targetId}`;
}

export function convertNarrativeToReactFlow(thread: StoryThread): {
  nodes: NarrativeFlowNode[];
  edges: NarrativeFlowEdge[];
} {
  const nodes: NarrativeFlowNode[] = [];
  const edges: NarrativeFlowEdge[] = [];

  nodes.push({
    id: thread.id,
    type: NARRATIVE_ELEMENT.THREAD,
    position: { x: LEVEL_X[NARRATIVE_ELEMENT.THREAD], y: 0 },
    data: {
      element: stripThread(thread),
      elementType: NARRATIVE_ELEMENT.THREAD,
    },
  });

  let currentY = 0;

  thread.acts.forEach((act, actIndex) => {
    const actY = currentY;

    nodes.push({
      id: act.id,
      type: NARRATIVE_ELEMENT.ACT,
      position: { x: LEVEL_X[NARRATIVE_ELEMENT.ACT], y: actY },
      data: {
        element: stripAct(act),
        elementType: NARRATIVE_ELEMENT.ACT,
      },
    });

    edges.push({
      id: edgeId(thread.id, act.id),
      source: thread.id,
      target: act.id,
      type: 'default',
    });

    let chapterY = actY;
    act.chapters.forEach((chapter, chapterIndex) => {
      nodes.push({
        id: chapter.id,
        type: NARRATIVE_ELEMENT.CHAPTER,
        position: { x: LEVEL_X[NARRATIVE_ELEMENT.CHAPTER], y: chapterY },
        data: {
          element: stripChapter(chapter),
          elementType: NARRATIVE_ELEMENT.CHAPTER,
        },
      });

      edges.push({
        id: edgeId(act.id, chapter.id),
        source: act.id,
        target: chapter.id,
        type: 'default',
      });

      const pageCount = Math.max(chapter.pages.length, 1);
      chapter.pages.forEach((page, pageIndex) => {
        const pageY = chapterY + pageIndex * PAGE_SPACING;
        nodes.push({
          id: page.id,
          type: NARRATIVE_ELEMENT.PAGE,
          position: { x: LEVEL_X[NARRATIVE_ELEMENT.PAGE], y: pageY },
          data: {
            element: stripPage(page),
            elementType: NARRATIVE_ELEMENT.PAGE,
          },
        });

        edges.push({
          id: edgeId(chapter.id, page.id),
          source: chapter.id,
          target: page.id,
          type: 'default',
        });
      });

      chapterY += pageCount * PAGE_SPACING + CHAPTER_GAP;
    });

    currentY = Math.max(chapterY, actY + PAGE_SPACING) + ACT_GAP;
  });

  return { nodes, edges };
}

function compareNodesByPosition(a: Node, b: Node): number {
  if (a.position.y !== b.position.y) {
    return a.position.y - b.position.y;
  }
  return a.position.x - b.position.x;
}

function coerceThread(node: Node<NarrativeFlowNodeData> | undefined): StoryThread {
  const element = node?.data?.element as StoryThread | undefined;
  return {
    id: element?.id ?? node?.id ?? 'thread',
    title: element?.title,
    summary: element?.summary,
    acts: [],
    type: NARRATIVE_ELEMENT.THREAD,
  };
}

function coerceAct(node: Node<NarrativeFlowNodeData>): NarrativeAct {
  const element = node.data?.element as NarrativeAct | undefined;
  return {
    id: element?.id ?? node.id,
    title: element?.title,
    summary: element?.summary,
    chapters: [],
    type: NARRATIVE_ELEMENT.ACT,
  };
}

function coerceChapter(node: Node<NarrativeFlowNodeData>): NarrativeChapter {
  const element = node.data?.element as NarrativeChapter | undefined;
  return {
    id: element?.id ?? node.id,
    title: element?.title,
    summary: element?.summary,
    pages: [],
    storyletTemplates: element?.storyletTemplates
      ? element.storyletTemplates.map(normalizeStoryletTemplate)
      : undefined,
    storyletPools: element?.storyletPools
      ? element.storyletPools.map(normalizeStoryletPool)
      : undefined,
    type: NARRATIVE_ELEMENT.CHAPTER,
  };
}

function coercePage(node: Node<NarrativeFlowNodeData>): NarrativePage {
  const element = node.data?.element as NarrativePage | undefined;
  return {
    id: element?.id ?? node.id,
    title: element?.title,
    summary: element?.summary,
    dialogueId: element?.dialogueId ?? '',
    type: NARRATIVE_ELEMENT.PAGE,
  };
}

export function convertReactFlowToNarrative(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[]
): StoryThread {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const threadNode = nodes.find(node => node.type === NARRATIVE_ELEMENT.THREAD);

  const actsByThread = new Map<string, Set<string>>();
  const chaptersByAct = new Map<string, Set<string>>();
  const pagesByChapter = new Map<string, Set<string>>();

  edges.forEach(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return;

    if (source.type === NARRATIVE_ELEMENT.THREAD && target.type === NARRATIVE_ELEMENT.ACT) {
      if (!actsByThread.has(source.id)) {
        actsByThread.set(source.id, new Set());
      }
      actsByThread.get(source.id)?.add(target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.ACT && target.type === NARRATIVE_ELEMENT.CHAPTER) {
      if (!chaptersByAct.has(source.id)) {
        chaptersByAct.set(source.id, new Set());
      }
      chaptersByAct.get(source.id)?.add(target.id);
    }

    if (source.type === NARRATIVE_ELEMENT.CHAPTER && target.type === NARRATIVE_ELEMENT.PAGE) {
      if (!pagesByChapter.has(source.id)) {
        pagesByChapter.set(source.id, new Set());
      }
      pagesByChapter.get(source.id)?.add(target.id);
    }
  });

  const actNodes = nodes
    .filter(node => node.type === NARRATIVE_ELEMENT.ACT)
    .sort(compareNodesByPosition);

  const chapterNodes = nodes
    .filter(node => node.type === NARRATIVE_ELEMENT.CHAPTER)
    .sort(compareNodesByPosition);

  const pageNodes = nodes
    .filter(node => node.type === NARRATIVE_ELEMENT.PAGE)
    .sort(compareNodesByPosition);

  const actIds = actsByThread.get(threadNode?.id ?? '')
    ? Array.from(actsByThread.get(threadNode?.id ?? '') ?? [])
    : actNodes.map(node => node.id);

  const acts = actIds
    .map(actId => nodeMap.get(actId))
    .filter((node): node is NarrativeFlowNode => Boolean(node))
    .sort(compareNodesByPosition)
    .map(actNode => {
      const chapterIds = chaptersByAct.get(actNode.id)
        ? Array.from(chaptersByAct.get(actNode.id) ?? [])
        : chapterNodes.map(node => node.id);

      const chapters = chapterIds
        .map(chapterId => nodeMap.get(chapterId))
        .filter((node): node is NarrativeFlowNode => Boolean(node))
        .sort(compareNodesByPosition)
        .map(chapterNode => {
          const pageIds = pagesByChapter.get(chapterNode.id)
            ? Array.from(pagesByChapter.get(chapterNode.id) ?? [])
            : pageNodes.map(node => node.id);

          const pages = pageIds
            .map(pageId => nodeMap.get(pageId))
            .filter((node): node is NarrativeFlowNode => Boolean(node))
            .sort(compareNodesByPosition)
            .map(coercePage);

          return {
            ...coerceChapter(chapterNode),
            pages,
          };
        });

      return {
        ...coerceAct(actNode),
        chapters,
      };
    });

  // Always ensure we have a thread node - if not found, create one from the first node or use defaults
  const threadData = threadNode 
    ? coerceThread(threadNode)
    : {
        id: nodes[0]?.id || 'empty-thread',
        title: nodes[0]?.data?.element?.title || 'Empty Thread',
        type: NARRATIVE_ELEMENT.THREAD,
      };

  return {
    ...threadData,
    acts,
  };
}
