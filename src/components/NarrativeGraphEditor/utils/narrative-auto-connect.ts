import {
  NARRATIVE_ELEMENT,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type StoryThread,
} from '../types/narrative';

/**
 * Finds the insertion position for a new act based on Y position
 */
export function findActInsertionPosition(
  thread: StoryThread,
  y: number
): { insertIndex: number; afterActId?: string } {
  const acts = thread.acts;
  if (acts.length === 0) {
    return { insertIndex: 0 };
  }

  // Find the act that should come after this one based on Y position
  // Acts are ordered by their Y position in the graph
  for (let i = 0; i < acts.length; i++) {
    // This is a simplified check - in reality, we'd need to check actual node positions
    // For now, we'll insert at the end or before the first act that comes after
    if (i === acts.length - 1) {
      return { insertIndex: i + 1, afterActId: acts[i].id };
    }
  }

  return { insertIndex: acts.length };
}

/**
 * Finds the insertion position for a new chapter within an act based on Y position
 */
export function findChapterInsertionPosition(
  act: NarrativeAct,
  y: number
): { insertIndex: number; afterChapterId?: string } {
  const chapters = act.chapters;
  if (chapters.length === 0) {
    return { insertIndex: 0 };
  }

  // Find the chapter that should come after this one
  for (let i = 0; i < chapters.length; i++) {
    if (i === chapters.length - 1) {
      return { insertIndex: i + 1, afterChapterId: chapters[i].id };
    }
  }

  return { insertIndex: chapters.length };
}

/**
 * Finds the insertion position for a new page within a chapter based on Y position
 */
export function findPageInsertionPosition(
  chapter: NarrativeChapter,
  y: number
): { insertIndex: number; afterPageId?: string } {
  const pages = chapter.pages;
  if (pages.length === 0) {
    return { insertIndex: 0 };
  }

  // Find the page that should come after this one
  for (let i = 0; i < pages.length; i++) {
    if (i === pages.length - 1) {
      return { insertIndex: i + 1, afterPageId: pages[i].id };
    }
  }

  return { insertIndex: pages.length };
}

/**
 * Auto-connects a new act to the thread in the correct sequence
 */
export function autoConnectAct(
  thread: StoryThread,
  newAct: NarrativeAct,
  insertIndex: number
): StoryThread {
  const acts = [...thread.acts];
  acts.splice(insertIndex, 0, newAct);
  return {
    ...thread,
    acts,
  };
}

/**
 * Auto-connects a new chapter to an act in the correct sequence
 */
export function autoConnectChapter(
  act: NarrativeAct,
  newChapter: NarrativeChapter,
  insertIndex: number
): NarrativeAct {
  const chapters = [...act.chapters];
  chapters.splice(insertIndex, 0, newChapter);
  return {
    ...act,
    chapters,
  };
}

/**
 * Auto-connects a new page to a chapter in the correct sequence
 */
export function autoConnectPage(
  chapter: NarrativeChapter,
  newPage: NarrativePage,
  insertIndex: number
): NarrativeChapter {
  const pages = [...chapter.pages];
  pages.splice(insertIndex, 0, newPage);
  return {
    ...chapter,
    pages,
  };
}

/**
 * Finds which act a chapter should be added to based on graph position
 * Returns the act ID and insertion index
 */
export function findActForChapter(
  thread: StoryThread,
  x: number,
  y: number
): { actId: string; insertIndex: number } | null {
  // Find the act that this chapter belongs to based on position
  // In the graph, chapters are positioned after their parent act
  // We'll find the closest act by Y position
  if (thread.acts.length === 0) {
    return null;
  }

  // For now, add to the last act or create logic based on actual positions
  // This is a simplified version - in production, you'd check actual node positions
  const lastAct = thread.acts[thread.acts.length - 1];
  return {
    actId: lastAct.id,
    insertIndex: lastAct.chapters.length,
  };
}

/**
 * Finds which chapter a page should be added to based on graph position
 * Returns the act ID, chapter ID, and insertion index
 */
export function findChapterForPage(
  thread: StoryThread,
  x: number,
  y: number
): { actId: string; chapterId: string; insertIndex: number } | null {
  // Find the chapter that this page belongs to
  for (const act of thread.acts) {
    for (const chapter of act.chapters) {
      // Simplified: check if position is within chapter's range
      // In production, check actual node positions
      return {
        actId: act.id,
        chapterId: chapter.id,
        insertIndex: chapter.pages.length,
      };
    }
  }

  // If no chapter found, add to first act's first chapter, or create one
  if (thread.acts.length > 0) {
    const firstAct = thread.acts[0];
    if (firstAct.chapters.length > 0) {
      const firstChapter = firstAct.chapters[0];
      return {
        actId: firstAct.id,
        chapterId: firstChapter.id,
        insertIndex: firstChapter.pages.length,
      };
    }
  }

  return null;
}
