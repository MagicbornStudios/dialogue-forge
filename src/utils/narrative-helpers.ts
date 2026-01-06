import {
  NarrativeThread,
  ActNode,
  ChapterNode,
  PageNode,
  StoryletNode,
  Storylet,
  NarrativeNode,
  NARRATIVE_NODE_TYPE,
  STORYLET_CATEGORY,
  StoryletCategory,
} from '../types/narrative';
import { DialogueTree } from '../types';

export function createEmptyNarrativeThread(
  id: string,
  title: string
): NarrativeThread {
  return {
    id,
    title,
    description: '',
    actIds: [],
    nodes: {
      acts: {},
      chapters: {},
      pages: {},
    },
    dialogueTrees: {},
    storylets: {},
  };
}

export function createActNode(
  id: string,
  title: string,
  x: number,
  y: number,
  order: number
): ActNode {
  return {
    id,
    type: NARRATIVE_NODE_TYPE.ACT,
    title,
    description: '',
    x,
    y,
    order,
    chapterIds: [],
  };
}

export function createChapterNode(
  id: string,
  actId: string,
  title: string,
  x: number,
  y: number,
  order: number
): ChapterNode {
  return {
    id,
    type: NARRATIVE_NODE_TYPE.CHAPTER,
    title,
    description: '',
    x,
    y,
    order,
    actId,
    pageIds: [],
  };
}

export function createPageNode(
  id: string,
  chapterId: string,
  title: string,
  x: number,
  y: number,
  order: number
): PageNode {
  return {
    id,
    type: NARRATIVE_NODE_TYPE.PAGE,
    title,
    description: '',
    x,
    y,
    order,
    chapterId,
    mainContent: '',
  };
}

export function createStoryletNode(
  id: string,
  title: string,
  category: StoryletCategory,
  x: number,
  y: number,
  order: number
): StoryletNode {
  return {
    id,
    type: NARRATIVE_NODE_TYPE.STORYLET,
    title,
    description: '',
    x,
    y,
    order,
    category,
    repeatable: true,
    cooldown: undefined,
    conditions: [],
    priority: 0,
  };
}

export function createEmptyDialogueTree(id: string, title: string): DialogueTree {
  const startNodeId = `node_${Date.now()}`;
  return {
    id,
    title,
    startNodeId,
    nodes: {
      [startNodeId]: {
        id: startNodeId,
        type: 'npc',
        content: 'Start of dialogue...',
        speaker: 'Narrator',
        x: 0,
        y: 0,
      },
    },
  };
}

export function createStorylet(
  id: string,
  title: string,
  category: StoryletCategory
): Storylet {
  return {
    id,
    title,
    description: '',
    category,
    dialogueTree: createEmptyDialogueTree(`dt_${id}`, title),
    conditions: [],
    repeatable: true,
    cooldown: undefined,
    tags: [],
  };
}

export function addActToThread(
  thread: NarrativeThread,
  act: ActNode
): NarrativeThread {
  return {
    ...thread,
    actIds: [...thread.actIds, act.id],
    nodes: {
      ...thread.nodes,
      acts: {
        ...thread.nodes.acts,
        [act.id]: act,
      },
    },
  };
}

export function addChapterToAct(
  thread: NarrativeThread,
  actId: string,
  chapter: ChapterNode
): NarrativeThread {
  const act = thread.nodes.acts[actId];
  if (!act) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      acts: {
        ...thread.nodes.acts,
        [actId]: {
          ...act,
          chapterIds: [...act.chapterIds, chapter.id],
        },
      },
      chapters: {
        ...thread.nodes.chapters,
        [chapter.id]: chapter,
      },
    },
  };
}

export function addPageToChapter(
  thread: NarrativeThread,
  chapterId: string,
  page: PageNode
): NarrativeThread {
  const chapter = thread.nodes.chapters[chapterId];
  if (!chapter) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      chapters: {
        ...thread.nodes.chapters,
        [chapterId]: {
          ...chapter,
          pageIds: [...chapter.pageIds, page.id],
        },
      },
      pages: {
        ...thread.nodes.pages,
        [page.id]: page,
      },
    },
  };
}

export function addStoryletToThread(
  thread: NarrativeThread,
  storylet: Storylet
): NarrativeThread {
  return {
    ...thread,
    storylets: {
      ...thread.storylets,
      [storylet.id]: storylet,
    },
  };
}

export function attachDialogueTreeToNode(
  thread: NarrativeThread,
  nodeType: 'act' | 'chapter' | 'page',
  nodeId: string,
  dialogueTree: DialogueTree
): NarrativeThread {
  const nodeMap = thread.nodes[`${nodeType}s` as keyof typeof thread.nodes] as Record<string, NarrativeNode>;
  const node = nodeMap[nodeId];
  if (!node) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      [`${nodeType}s`]: {
        ...nodeMap,
        [nodeId]: {
          ...node,
          dialogueTreeId: dialogueTree.id,
        },
      },
    },
    dialogueTrees: {
      ...thread.dialogueTrees,
      [dialogueTree.id]: dialogueTree,
    },
  };
}

export function attachStoryletToNode(
  thread: NarrativeThread,
  nodeType: 'act' | 'chapter' | 'page',
  nodeId: string,
  storyletId: string
): NarrativeThread {
  const nodeMap = thread.nodes[`${nodeType}s` as keyof typeof thread.nodes] as Record<string, NarrativeNode>;
  const node = nodeMap[nodeId];
  if (!node) return thread;

  const existingStoryletIds = node.storyletIds || [];
  if (existingStoryletIds.includes(storyletId)) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      [`${nodeType}s`]: {
        ...nodeMap,
        [nodeId]: {
          ...node,
          storyletIds: [...existingStoryletIds, storyletId],
        },
      },
    },
  };
}

export function removeActFromThread(
  thread: NarrativeThread,
  actId: string
): NarrativeThread {
  const act = thread.nodes.acts[actId];
  if (!act) return thread;

  const chapterIdsToRemove = act.chapterIds;
  const pageIdsToRemove: string[] = [];
  const dialogueTreeIdsToRemove: string[] = [];

  if (act.dialogueTreeId) {
    dialogueTreeIdsToRemove.push(act.dialogueTreeId);
  }

  chapterIdsToRemove.forEach((chapterId) => {
    const chapter = thread.nodes.chapters[chapterId];
    if (chapter) {
      pageIdsToRemove.push(...chapter.pageIds);
      if (chapter.dialogueTreeId) {
        dialogueTreeIdsToRemove.push(chapter.dialogueTreeId);
      }
    }
  });

  pageIdsToRemove.forEach((pageId) => {
    const page = thread.nodes.pages[pageId];
    if (page?.dialogueTreeId) {
      dialogueTreeIdsToRemove.push(page.dialogueTreeId);
    }
  });

  const { [actId]: _, ...remainingActs } = thread.nodes.acts;
  const remainingChapters = { ...thread.nodes.chapters };
  chapterIdsToRemove.forEach((id) => delete remainingChapters[id]);
  const remainingPages = { ...thread.nodes.pages };
  pageIdsToRemove.forEach((id) => delete remainingPages[id]);
  const remainingDialogueTrees = { ...thread.dialogueTrees };
  dialogueTreeIdsToRemove.forEach((id) => delete remainingDialogueTrees[id]);

  return {
    ...thread,
    actIds: thread.actIds.filter((id) => id !== actId),
    nodes: {
      acts: remainingActs,
      chapters: remainingChapters,
      pages: remainingPages,
    },
    dialogueTrees: remainingDialogueTrees,
  };
}

export function removeChapterFromAct(
  thread: NarrativeThread,
  chapterId: string
): NarrativeThread {
  const chapter = thread.nodes.chapters[chapterId];
  if (!chapter) return thread;

  const act = chapter.actId ? thread.nodes.acts[chapter.actId] : null;
  if (!act) return thread;

  const pageIdsToRemove = chapter.pageIds;
  const dialogueTreeIdsToRemove: string[] = [];

  if (chapter.dialogueTreeId) {
    dialogueTreeIdsToRemove.push(chapter.dialogueTreeId);
  }

  pageIdsToRemove.forEach((pageId) => {
    const page = thread.nodes.pages[pageId];
    if (page?.dialogueTreeId) {
      dialogueTreeIdsToRemove.push(page.dialogueTreeId);
    }
  });

  const { [chapterId]: _, ...remainingChapters } = thread.nodes.chapters;
  const remainingPages = { ...thread.nodes.pages };
  pageIdsToRemove.forEach((id) => delete remainingPages[id]);
  const remainingDialogueTrees = { ...thread.dialogueTrees };
  dialogueTreeIdsToRemove.forEach((id) => delete remainingDialogueTrees[id]);

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      acts: {
        ...thread.nodes.acts,
        [act.id]: {
          ...act,
          chapterIds: act.chapterIds.filter((id: string) => id !== chapterId),
        },
      },
      chapters: remainingChapters,
      pages: remainingPages,
    },
    dialogueTrees: remainingDialogueTrees,
  };
}

export function removePageFromChapter(
  thread: NarrativeThread,
  pageId: string
): NarrativeThread {
  const page = thread.nodes.pages[pageId];
  if (!page) return thread;

  const chapter = thread.nodes.chapters[page.chapterId];
  if (!chapter) return thread;

  const { [pageId]: _, ...remainingPages } = thread.nodes.pages;
  const remainingDialogueTrees = { ...thread.dialogueTrees };
  if (page.dialogueTreeId) {
    delete remainingDialogueTrees[page.dialogueTreeId];
  }

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      chapters: {
        ...thread.nodes.chapters,
        [chapter.id]: {
          ...chapter,
          pageIds: chapter.pageIds.filter((id) => id !== pageId),
        },
      },
      pages: remainingPages,
    },
    dialogueTrees: remainingDialogueTrees,
  };
}

export function removeStoryletFromThread(
  thread: NarrativeThread,
  storyletId: string
): NarrativeThread {
  const { [storyletId]: _, ...remainingStorylets } = thread.storylets;

  const updatedActs = { ...thread.nodes.acts };
  Object.keys(updatedActs).forEach((actId) => {
    const act = updatedActs[actId];
    if (act.storyletIds?.includes(storyletId)) {
      updatedActs[actId] = {
        ...act,
        storyletIds: act.storyletIds.filter((id) => id !== storyletId),
      };
    }
  });

  const updatedChapters = { ...thread.nodes.chapters };
  Object.keys(updatedChapters).forEach((chapterId) => {
    const chapter = updatedChapters[chapterId];
    if (chapter.storyletIds?.includes(storyletId)) {
      updatedChapters[chapterId] = {
        ...chapter,
        storyletIds: chapter.storyletIds.filter((id) => id !== storyletId),
      };
    }
  });

  const updatedPages = { ...thread.nodes.pages };
  Object.keys(updatedPages).forEach((pageId) => {
    const page = updatedPages[pageId];
    if (page.storyletIds?.includes(storyletId)) {
      updatedPages[pageId] = {
        ...page,
        storyletIds: page.storyletIds.filter((id) => id !== storyletId),
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
    storylets: remainingStorylets,
  };
}

export function updateActNode(
  thread: NarrativeThread,
  actId: string,
  updates: Partial<ActNode>
): NarrativeThread {
  const act = thread.nodes.acts[actId];
  if (!act) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      acts: {
        ...thread.nodes.acts,
        [actId]: { ...act, ...updates },
      },
    },
  };
}

export function updateChapterNode(
  thread: NarrativeThread,
  chapterId: string,
  updates: Partial<ChapterNode>
): NarrativeThread {
  const chapter = thread.nodes.chapters[chapterId];
  if (!chapter) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      chapters: {
        ...thread.nodes.chapters,
        [chapterId]: { ...chapter, ...updates },
      },
    },
  };
}

export function updatePageNode(
  thread: NarrativeThread,
  pageId: string,
  updates: Partial<PageNode>
): NarrativeThread {
  const page = thread.nodes.pages[pageId];
  if (!page) return thread;

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      pages: {
        ...thread.nodes.pages,
        [pageId]: { ...page, ...updates },
      },
    },
  };
}

export function updateStorylet(
  thread: NarrativeThread,
  storyletId: string,
  updates: Partial<Storylet>
): NarrativeThread {
  const storylet = thread.storylets[storyletId];
  if (!storylet) return thread;

  return {
    ...thread,
    storylets: {
      ...thread.storylets,
      [storyletId]: { ...storylet, ...updates },
    },
  };
}

export function updateDialogueTree(
  thread: NarrativeThread,
  dialogueTreeId: string,
  dialogueTree: DialogueTree
): NarrativeThread {
  if (!thread.dialogueTrees[dialogueTreeId]) return thread;

  return {
    ...thread,
    dialogueTrees: {
      ...thread.dialogueTrees,
      [dialogueTreeId]: dialogueTree,
    },
  };
}

export function getActsInOrder(thread: NarrativeThread): ActNode[] {
  return thread.actIds
    .map((id) => thread.nodes.acts[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function getChaptersInOrder(
  thread: NarrativeThread,
  actId: string
): ChapterNode[] {
  const act = thread.nodes.acts[actId];
  if (!act) return [];

  return act.chapterIds
    .map((id) => thread.nodes.chapters[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function getPagesInOrder(
  thread: NarrativeThread,
  chapterId: string
): PageNode[] {
  const chapter = thread.nodes.chapters[chapterId];
  if (!chapter) return [];

  return chapter.pageIds
    .map((id) => thread.nodes.pages[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function getStoryletsByCategory(
  thread: NarrativeThread,
  category?: StoryletCategory
): Storylet[] {
  const allStorylets = Object.values(thread.storylets);
  if (!category) return allStorylets;
  return allStorylets.filter((s) => s.category === category);
}

export interface LinearSequenceItem {
  id: string;
  type: 'start' | 'act' | 'chapter' | 'page' | 'end';
  node: ActNode | ChapterNode | PageNode | null;
  title: string;
  sequenceIndex: number;
}

export function buildLinearSequence(thread: NarrativeThread): LinearSequenceItem[] {
  const sequence: LinearSequenceItem[] = [];
  let index = 0;

  sequence.push({
    id: '__start__',
    type: 'start',
    node: null,
    title: 'Start',
    sequenceIndex: index++,
  });

  const acts = getActsInOrder(thread);

  for (const act of acts) {
    sequence.push({
      id: act.id,
      type: 'act',
      node: act,
      title: act.title,
      sequenceIndex: index++,
    });

    const chapters = getChaptersInOrder(thread, act.id);

    for (const chapter of chapters) {
      sequence.push({
        id: chapter.id,
        type: 'chapter',
        node: chapter,
        title: chapter.title,
        sequenceIndex: index++,
      });

      const pages = getPagesInOrder(thread, chapter.id);

      for (const page of pages) {
        sequence.push({
          id: page.id,
          type: 'page',
          node: page,
          title: page.title,
          sequenceIndex: index++,
        });
      }
    }
  }

  sequence.push({
    id: '__end__',
    type: 'end',
    node: null,
    title: 'End',
    sequenceIndex: index,
  });

  return sequence;
}

export function generateNodeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== Reorder helpers (DB-agnostic) =====

export function reorderActs(thread: NarrativeThread, orderedActIds: string[]): NarrativeThread {
  // Preserve only known ids; ignore unknowns; append any missing at end in original order
  const known = orderedActIds.filter((id) => !!thread.nodes.acts[id]);
  const missing = thread.actIds.filter((id) => !known.includes(id));
  const newOrder = [...known, ...missing];

  const updatedActs: Record<string, ActNode> = { ...thread.nodes.acts };
  newOrder.forEach((id, idx) => {
    const act = updatedActs[id];
    if (act && act.order !== idx) updatedActs[id] = { ...act, order: idx };
  });

  return { ...thread, actIds: newOrder, nodes: { ...thread.nodes, acts: updatedActs } };
}

export function reorderChapters(
  thread: NarrativeThread,
  actId: string,
  orderedChapterIds: string[]
): NarrativeThread {
  const act = thread.nodes.acts[actId];
  if (!act) return thread;
  const known = orderedChapterIds.filter((id) => !!thread.nodes.chapters[id]);
  const missing = act.chapterIds.filter((id) => !known.includes(id));
  const newOrder = [...known, ...missing];

  const updatedChapters: Record<string, ChapterNode> = { ...thread.nodes.chapters };
  newOrder.forEach((id, idx) => {
    const ch = updatedChapters[id];
    if (ch && ch.order !== idx) updatedChapters[id] = { ...ch, order: idx };
  });

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      acts: { ...thread.nodes.acts, [actId]: { ...act, chapterIds: newOrder } },
      chapters: updatedChapters,
    },
  };
}

export function reorderPages(
  thread: NarrativeThread,
  chapterId: string,
  orderedPageIds: string[]
): NarrativeThread {
  const chapter = thread.nodes.chapters[chapterId];
  if (!chapter) return thread;
  const known = orderedPageIds.filter((id) => !!thread.nodes.pages[id]);
  const missing = chapter.pageIds.filter((id) => !known.includes(id));
  const newOrder = [...known, ...missing];

  const updatedPages: Record<string, PageNode> = { ...thread.nodes.pages };
  newOrder.forEach((id, idx) => {
    const p = updatedPages[id];
    if (p && p.order !== idx) updatedPages[id] = { ...p, order: idx };
  });

  return {
    ...thread,
    nodes: {
      ...thread.nodes,
      chapters: { ...thread.nodes.chapters, [chapterId]: { ...chapter, pageIds: newOrder } },
      pages: updatedPages,
    },
  };
}
