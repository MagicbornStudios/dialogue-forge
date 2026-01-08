import {
  NARRATIVE_ELEMENT,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type StoryThread,
  type Storylet,
  type StoryletPool,
} from '../types/narrative';

export interface NarrativeSequenceStep {
  act: NarrativeAct;
  chapter: NarrativeChapter;
  page: NarrativePage;
  actIndex: number;
  chapterIndex: number;
  pageIndex: number;
}

type NarrativeActInput = Omit<NarrativeAct, 'chapters' | 'type'> & {
  chapters?: NarrativeChapter[];
};

type NarrativeChapterInput = Omit<NarrativeChapter, 'pages' | 'type'> & {
  pages?: NarrativePage[];
};

type NarrativePageInput = Omit<NarrativePage, 'dialogueId' | 'type'> & {
  dialogueId?: string;
};

function normalizeStorylet(storylet: Storylet): Storylet {
  return {
    id: storylet.id,
    title: storylet.title,
    summary: storylet.summary,
    conditions: storylet.conditions ? [...storylet.conditions] : undefined,
    weight: storylet.weight,
    nextNodeId: storylet.nextNodeId,
    type: NARRATIVE_ELEMENT.STORYLET,
  };
}

function normalizeStoryletPool(pool: StoryletPool): StoryletPool {
  return {
    id: pool.id,
    title: pool.title,
    summary: pool.summary,
    selectionMode: pool.selectionMode,
    storylets: pool.storylets.map(normalizeStorylet),
    fallbackNodeId: pool.fallbackNodeId,
  };
}

function normalizePage(page: NarrativePageInput): NarrativePage {
  return {
    id: page.id,
    title: page.title,
    summary: page.summary,
    dialogueId: page.dialogueId ?? '',
    type: NARRATIVE_ELEMENT.PAGE,
  };
}

function normalizeChapter(chapter: NarrativeChapterInput): NarrativeChapter {
  return {
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    pages: chapter.pages ? chapter.pages.map(normalizePage) : [],
    storyletPools: chapter.storyletPools
      ? chapter.storyletPools.map(normalizeStoryletPool)
      : undefined,
    type: NARRATIVE_ELEMENT.CHAPTER,
  };
}

function normalizeAct(act: NarrativeActInput): NarrativeAct {
  return {
    id: act.id,
    title: act.title,
    summary: act.summary,
    chapters: act.chapters ? act.chapters.map(normalizeChapter) : [],
    type: NARRATIVE_ELEMENT.ACT,
  };
}

export function createEmptyNarrativeThread(
  id: string,
  options?: { title?: string; summary?: string }
): StoryThread {
  return {
    id,
    title: options?.title,
    summary: options?.summary,
    acts: [],
    type: NARRATIVE_ELEMENT.THREAD,
  };
}

export function addAct(thread: StoryThread, act: NarrativeActInput): StoryThread {
  const nextAct = normalizeAct(act);
  return {
    ...thread,
    acts: [...thread.acts, nextAct],
    type: thread.type ?? NARRATIVE_ELEMENT.THREAD,
  };
}

export function addChapter(act: NarrativeAct, chapter: NarrativeChapterInput): NarrativeAct {
  const nextChapter = normalizeChapter(chapter);
  return {
    ...act,
    chapters: [...act.chapters, nextChapter],
    type: act.type ?? NARRATIVE_ELEMENT.ACT,
  };
}

export function addPage(chapter: NarrativeChapter, page: NarrativePageInput): NarrativeChapter {
  const nextPage = normalizePage(page);
  return {
    ...chapter,
    pages: [...chapter.pages, nextPage],
    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
  };
}

export function addStorylet(
  chapter: NarrativeChapter,
  poolId: string,
  storylet: Storylet
): NarrativeChapter {
  const normalizedStorylet = normalizeStorylet(storylet);
  const existingPools = chapter.storyletPools ?? [];
  const poolIndex = existingPools.findIndex(pool => pool.id === poolId);

  const updatedPools = [...existingPools];
  if (poolIndex >= 0) {
    const pool = existingPools[poolIndex];
    updatedPools[poolIndex] = {
      ...pool,
      storylets: [...pool.storylets.map(normalizeStorylet), normalizedStorylet],
    };
  } else {
    updatedPools.push({
      id: poolId,
      storylets: [normalizedStorylet],
    });
  }

  return {
    ...chapter,
    storyletPools: updatedPools,
    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
  };
}

export function removeStorylet(
  chapter: NarrativeChapter,
  storyletId: string,
  poolId?: string
): NarrativeChapter {
  const existingPools = chapter.storyletPools ?? [];

  const updatedPools = existingPools.map(pool => {
    if (poolId && pool.id !== poolId) {
      return pool;
    }

    return {
      ...pool,
      storylets: pool.storylets.filter(storylet => storylet.id !== storyletId),
    };
  });

  return {
    ...chapter,
    storyletPools: updatedPools,
    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
  };
}

export function attachDialogueToPage(
  page: NarrativePage,
  dialogueId: string
): NarrativePage {
  return {
    ...page,
    dialogueId,
    type: page.type ?? NARRATIVE_ELEMENT.PAGE,
  };
}

export function buildLinearSequence(thread: StoryThread): NarrativeSequenceStep[] {
  const steps: NarrativeSequenceStep[] = [];

  thread.acts.forEach((act, actIndex) => {
    act.chapters.forEach((chapter, chapterIndex) => {
      chapter.pages.forEach((page, pageIndex) => {
        steps.push({
          act,
          chapter,
          page,
          actIndex,
          chapterIndex,
          pageIndex,
        });
      });
    });
  });

  return steps;
}
