import type {
  StoryThread,
  NarrativeAct,
  NarrativeChapter,
  NarrativePage,
} from '../types/narrative';
import { NARRATIVE_ELEMENT } from '../types/narrative';

export interface NarrativeSequenceStep {
  act: NarrativeAct;
  chapter: NarrativeChapter;
  page: NarrativePage;
  actIndex: number;
  chapterIndex: number;
  pageIndex: number;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createEmptyThread(title = 'Untitled Narrative'): StoryThread {
  const actId = createId(NARRATIVE_ELEMENT.ACT);
  const chapterId = createId(NARRATIVE_ELEMENT.CHAPTER);
  const pageId = createId(NARRATIVE_ELEMENT.PAGE);

  const starterPage: NarrativePage = {
    id: pageId,
    title: 'Page 1',
    dialogueId: '',
    type: NARRATIVE_ELEMENT.PAGE,
  };

  const starterChapter: NarrativeChapter = {
    id: chapterId,
    title: 'Chapter 1',
    pages: [starterPage],
    startPageId: pageId,
    type: NARRATIVE_ELEMENT.CHAPTER,
  };

  const starterAct: NarrativeAct = {
    id: actId,
    title: 'Act 1',
    chapters: [starterChapter],
    startChapterId: chapterId,
    type: NARRATIVE_ELEMENT.ACT,
  };

  return {
    id: createId('thread'),
    title,
    acts: [starterAct],
    startActId: actId,
    type: NARRATIVE_ELEMENT.THREAD,
  };
}

export function addAct(thread: StoryThread, title = 'New Act'): StoryThread {
  const actId = createId(NARRATIVE_ELEMENT.ACT);

  const newAct: NarrativeAct = {
    id: actId,
    title,
    chapters: [],
    type: NARRATIVE_ELEMENT.ACT,
  };

  return {
    ...thread,
    acts: [...thread.acts, newAct],
    startActId: thread.startActId ?? actId,
  };
}

export function addChapter(
  thread: StoryThread,
  actId: string,
  title = 'New Chapter'
): StoryThread {
  const chapterId = createId(NARRATIVE_ELEMENT.CHAPTER);

  const newChapter: NarrativeChapter = {
    id: chapterId,
    title,
    pages: [],
    type: NARRATIVE_ELEMENT.CHAPTER,
  };

  const updatedActs = thread.acts.map(act => {
    if (act.id !== actId) return act;
    return {
      ...act,
      chapters: [...act.chapters, newChapter],
      startChapterId: act.startChapterId ?? chapterId,
    };
  });

  return {
    ...thread,
    acts: updatedActs,
  };
}

export function addPage(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  title = 'New Page',
  dialogueId = ''
): StoryThread {
  const pageId = createId(NARRATIVE_ELEMENT.PAGE);

  const newPage: NarrativePage = {
    id: pageId,
    title,
    dialogueId,
    type: NARRATIVE_ELEMENT.PAGE,
  };

  const updatedActs = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      
      return {
        ...chapter,
        pages: [...chapter.pages, newPage],
        startPageId: chapter.startPageId ?? pageId,
      };
    });
    return { ...act, chapters };
  });

  return {
    ...thread,
    acts: updatedActs,
  };
}

export function updateThread(thread: StoryThread, updates: Partial<StoryThread>): StoryThread {
  return {
    ...thread,
    ...updates,
    id: thread.id,
  };
}

export function updateAct(
  thread: StoryThread,
  actId: string,
  updates: Partial<NarrativeAct>
): StoryThread {
  const acts = thread.acts.map(act =>
    act.id === actId ? { ...act, ...updates } : act
  );
  return { ...thread, acts };
}

export function updateChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  updates: Partial<NarrativeChapter>
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    );
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function updatePage(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  pageId: string,
  updates: Partial<NarrativePage>
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const pages = chapter.pages.map(page =>
        page.id === pageId ? { ...page, ...updates } : page
      );
      return { ...chapter, pages };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function removeAct(thread: StoryThread, actId: string): StoryThread {
  const acts = thread.acts.filter(act => act.id !== actId);
  const startActId = thread.startActId === actId ? acts[0]?.id : thread.startActId;
  return { ...thread, acts, startActId };
}

export function removeChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.filter(ch => ch.id !== chapterId);
    const startChapterId = act.startChapterId === chapterId ? chapters[0]?.id : act.startChapterId;
    return { ...act, chapters, startChapterId };
  });
  return { ...thread, acts };
}

export function removePage(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  pageId: string
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      
      const pageToRemove = chapter.pages.find(p => p.id === pageId);
      const pages = chapter.pages.filter(p => p.id !== pageId);
      
      const updatedPages = pages.map(page => {
        if (page.nextPageId === pageId) {
          return {
            ...page,
            nextPageId: pageToRemove?.nextPageId,
          };
        }
        return page;
      });
      
      const startPageId = chapter.startPageId === pageId ? updatedPages[0]?.id : chapter.startPageId;
      return { ...chapter, pages: updatedPages, startPageId };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function linkPages(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  fromPageId: string,
  toPageId: string
): StoryThread {
  return updatePage(thread, actId, chapterId, fromPageId, {
    nextPageId: toPageId,
    nextChapterId: undefined,
    nextActId: undefined,
  });
}

export function linkPageToChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  fromPageId: string,
  toChapterId: string
): StoryThread {
  return updatePage(thread, actId, chapterId, fromPageId, {
    nextPageId: undefined,
    nextChapterId: toChapterId,
    nextActId: undefined,
  });
}

export function linkPageToAct(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  fromPageId: string,
  toActId: string
): StoryThread {
  return updatePage(thread, actId, chapterId, fromPageId, {
    nextPageId: undefined,
    nextChapterId: undefined,
    nextActId: toActId,
  });
}

export function unlinkPage(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  pageId: string
): StoryThread {
  return updatePage(thread, actId, chapterId, pageId, {
    nextPageId: undefined,
    nextChapterId: undefined,
    nextActId: undefined,
  });
}

export function getAct(thread: StoryThread, actId: string): NarrativeAct | undefined {
  return thread.acts.find(a => a.id === actId);
}

export function getChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string
): NarrativeChapter | undefined {
  const act = thread.acts.find(a => a.id === actId);
  return act?.chapters.find(c => c.id === chapterId);
}

export function getPage(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  pageId: string
): NarrativePage | undefined {
  const act = thread.acts.find(a => a.id === actId);
  const chapter = act?.chapters.find(c => c.id === chapterId);
  return chapter?.pages.find(p => p.id === pageId);
}

export function findPageParent(
  thread: StoryThread,
  pageId: string
): { act: NarrativeAct; chapter: NarrativeChapter } | undefined {
  for (const act of thread.acts) {
    for (const chapter of act.chapters) {
      if (chapter.pages.some(p => p.id === pageId)) {
        return { act, chapter };
      }
    }
  }
  return undefined;
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
