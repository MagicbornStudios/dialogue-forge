import {
  NarrativeAct,
  NarrativeChapter,
  NarrativePage,
  NarrativeStorylet,
  NarrativeThread,
} from '../types';

export interface LinearSequenceOptions {
  threadId: string;
  title: string;
  actCount: number;
  chaptersPerAct: number;
  pagesPerChapter: number;
  idPrefix?: string;
}

export function createEmptyNarrativeThread(id: string, title: string): NarrativeThread {
  return {
    id,
    title,
    actIds: [],
    acts: {},
    chapters: {},
    pages: {},
    storylets: {},
  };
}

function normalizeAct(act: NarrativeAct): NarrativeAct {
  return {
    ...act,
    chapterIds: act.chapterIds ?? [],
  };
}

function normalizeChapter(chapter: NarrativeChapter, actId: string): NarrativeChapter {
  return {
    ...chapter,
    actId,
    pageIds: chapter.pageIds ?? [],
  };
}

function normalizePage(page: NarrativePage, chapterId: string): NarrativePage {
  return {
    ...page,
    chapterId,
    storyletIds: page.storyletIds ?? [],
  };
}

function normalizeStorylet(storylet: NarrativeStorylet, pageId?: string): NarrativeStorylet {
  return {
    ...storylet,
    pageId,
    linkedStoryletIds: storylet.linkedStoryletIds ?? [],
  };
}

function insertId(ids: string[], id: string, index?: number): string[] {
  const nextIds = [...ids];
  const existingIndex = nextIds.indexOf(id);
  if (existingIndex !== -1) {
    return nextIds;
  }
  const safeIndex = index === undefined ? nextIds.length : Math.max(0, Math.min(index, nextIds.length));
  nextIds.splice(safeIndex, 0, id);
  return nextIds;
}

function removeIds(ids: string[], removed: Set<string>): string[] {
  return ids.filter(id => !removed.has(id));
}

export function insertAct(
  thread: NarrativeThread,
  act: NarrativeAct,
  index?: number
): NarrativeThread {
  const normalizedAct = normalizeAct(act);
  const actIds = insertId(thread.actIds, normalizedAct.id, index);
  return {
    ...thread,
    actIds,
    acts: {
      ...thread.acts,
      [normalizedAct.id]: normalizedAct,
    },
  };
}

export function removeAct(thread: NarrativeThread, actId: string): NarrativeThread {
  const act = thread.acts[actId];
  if (!act) {
    return thread;
  }

  const chapterIds = act.chapterIds;
  const pageIds = chapterIds.flatMap(chapterId => thread.chapters[chapterId]?.pageIds ?? []);
  const storyletIds = pageIds.flatMap(pageId => thread.pages[pageId]?.storyletIds ?? []);

  const removedChapters = new Set(chapterIds);
  const removedPages = new Set(pageIds);
  const removedStorylets = new Set(storyletIds);

  const nextActs = { ...thread.acts };
  delete nextActs[actId];

  const nextChapters = Object.fromEntries(
    Object.entries(thread.chapters).filter(([id]) => !removedChapters.has(id))
  );

  const nextPages = Object.fromEntries(
    Object.entries(thread.pages)
      .filter(([id]) => !removedPages.has(id))
      .map(([id, page]) => [
        id,
        {
          ...page,
          storyletIds: removeIds(page.storyletIds, removedStorylets),
        },
      ])
  );

  const nextStorylets = filterStorylets(thread.storylets, removedStorylets);

  return {
    ...thread,
    actIds: thread.actIds.filter(id => id !== actId),
    acts: nextActs,
    chapters: nextChapters,
    pages: nextPages,
    storylets: nextStorylets,
  };
}

export function insertChapter(
  thread: NarrativeThread,
  actId: string,
  chapter: NarrativeChapter,
  index?: number
): NarrativeThread {
  const act = thread.acts[actId];
  if (!act) {
    throw new Error(`Act ${actId} not found`);
  }

  const normalizedChapter = normalizeChapter(chapter, actId);
  const chapterIds = insertId(act.chapterIds, normalizedChapter.id, index);

  return {
    ...thread,
    acts: {
      ...thread.acts,
      [actId]: {
        ...act,
        chapterIds,
      },
    },
    chapters: {
      ...thread.chapters,
      [normalizedChapter.id]: normalizedChapter,
    },
  };
}

export function removeChapter(thread: NarrativeThread, chapterId: string): NarrativeThread {
  const chapter = thread.chapters[chapterId];
  if (!chapter) {
    return thread;
  }

  const pageIds = chapter.pageIds;
  const storyletIds = pageIds.flatMap(pageId => thread.pages[pageId]?.storyletIds ?? []);

  const removedPages = new Set(pageIds);
  const removedStorylets = new Set(storyletIds);

  const nextChapters = { ...thread.chapters };
  delete nextChapters[chapterId];

  const nextPages = Object.fromEntries(
    Object.entries(thread.pages)
      .filter(([id]) => !removedPages.has(id))
      .map(([id, page]) => [
        id,
        {
          ...page,
          storyletIds: removeIds(page.storyletIds, removedStorylets),
        },
      ])
  );

  const nextStorylets = filterStorylets(thread.storylets, removedStorylets);

  const nextActs = thread.acts[chapter.actId]
    ? {
        ...thread.acts,
        [chapter.actId]: {
          ...thread.acts[chapter.actId],
          chapterIds: thread.acts[chapter.actId].chapterIds.filter(id => id !== chapterId),
        },
      }
    : thread.acts;

  return {
    ...thread,
    acts: nextActs,
    chapters: nextChapters,
    pages: nextPages,
    storylets: nextStorylets,
  };
}

export function insertPage(
  thread: NarrativeThread,
  chapterId: string,
  page: NarrativePage,
  index?: number
): NarrativeThread {
  const chapter = thread.chapters[chapterId];
  if (!chapter) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  const normalizedPage = normalizePage(page, chapterId);
  const pageIds = insertId(chapter.pageIds, normalizedPage.id, index);

  return {
    ...thread,
    chapters: {
      ...thread.chapters,
      [chapterId]: {
        ...chapter,
        pageIds,
      },
    },
    pages: {
      ...thread.pages,
      [normalizedPage.id]: normalizedPage,
    },
  };
}

export function removePage(thread: NarrativeThread, pageId: string): NarrativeThread {
  const page = thread.pages[pageId];
  if (!page) {
    return thread;
  }

  const removedStorylets = new Set(page.storyletIds);

  const nextPages = { ...thread.pages };
  delete nextPages[pageId];

  const nextStorylets = filterStorylets(thread.storylets, removedStorylets);

  const nextChapters = thread.chapters[page.chapterId]
    ? {
        ...thread.chapters,
        [page.chapterId]: {
          ...thread.chapters[page.chapterId],
          pageIds: thread.chapters[page.chapterId].pageIds.filter(id => id !== pageId),
        },
      }
    : thread.chapters;

  return {
    ...thread,
    chapters: nextChapters,
    pages: nextPages,
    storylets: nextStorylets,
  };
}

export function attachDialogueToPage(
  thread: NarrativeThread,
  pageId: string,
  dialogueId?: string
): NarrativeThread {
  const page = thread.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} not found`);
  }

  return {
    ...thread,
    pages: {
      ...thread.pages,
      [pageId]: {
        ...page,
        dialogueId,
      },
    },
  };
}

export function addStorylet(
  thread: NarrativeThread,
  pageId: string,
  storylet: NarrativeStorylet,
  index?: number
): NarrativeThread {
  const page = thread.pages[pageId];
  if (!page) {
    throw new Error(`Page ${pageId} not found`);
  }

  const normalizedStorylet = normalizeStorylet(storylet, pageId);
  const storyletIds = insertId(page.storyletIds, normalizedStorylet.id, index);

  return {
    ...thread,
    pages: {
      ...thread.pages,
      [pageId]: {
        ...page,
        storyletIds,
      },
    },
    storylets: {
      ...thread.storylets,
      [normalizedStorylet.id]: normalizedStorylet,
    },
  };
}

export function removeStorylet(thread: NarrativeThread, storyletId: string): NarrativeThread {
  const storylet = thread.storylets[storyletId];
  if (!storylet) {
    return thread;
  }

  const removedStorylets = new Set([storyletId]);

  const nextStorylets = filterStorylets(thread.storylets, removedStorylets);
  const nextPages = Object.fromEntries(
    Object.entries(thread.pages).map(([id, page]) => [
      id,
      {
        ...page,
        storyletIds: removeIds(page.storyletIds, removedStorylets),
      },
    ])
  );

  return {
    ...thread,
    pages: nextPages,
    storylets: nextStorylets,
  };
}

function filterStorylets(
  storylets: Record<string, NarrativeStorylet>,
  removedStorylets: Set<string>
): Record<string, NarrativeStorylet> {
  return Object.fromEntries(
    Object.entries(storylets)
      .filter(([id]) => !removedStorylets.has(id))
      .map(([id, storylet]) => [
        id,
        {
          ...storylet,
          linkedStoryletIds: removeIds(storylet.linkedStoryletIds, removedStorylets),
        },
      ])
  );
}

export function buildLinearSequence(options: LinearSequenceOptions): NarrativeThread {
  const {
    threadId,
    title,
    actCount,
    chaptersPerAct,
    pagesPerChapter,
    idPrefix = threadId,
  } = options;

  let thread = createEmptyNarrativeThread(threadId, title);

  for (let actIndex = 0; actIndex < actCount; actIndex += 1) {
    const actId = `${idPrefix}-act-${actIndex + 1}`;
    thread = insertAct(thread, {
      id: actId,
      title: `Act ${actIndex + 1}`,
      chapterIds: [],
    });

    for (let chapterIndex = 0; chapterIndex < chaptersPerAct; chapterIndex += 1) {
      const chapterId = `${actId}-chapter-${chapterIndex + 1}`;
      thread = insertChapter(thread, actId, {
        id: chapterId,
        title: `Chapter ${chapterIndex + 1}`,
        actId,
        pageIds: [],
      });

      for (let pageIndex = 0; pageIndex < pagesPerChapter; pageIndex += 1) {
        const pageId = `${chapterId}-page-${pageIndex + 1}`;
        thread = insertPage(thread, chapterId, {
          id: pageId,
          title: `Page ${pageIndex + 1}`,
          chapterId,
          storyletIds: [],
        });
      }
    }
  }

  return thread;
}
