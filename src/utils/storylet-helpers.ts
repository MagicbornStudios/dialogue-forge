import type {
  StoryThread,
  StoryletTemplate,
  StoryletPool,
  StoryletPoolMember,
  StoryletSelectionMode,
} from '../types/narrative';
import { NARRATIVE_ELEMENT, STORYLET_SELECTION_MODE } from '../types/narrative';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createStoryletTemplate(
  dialogueId: string,
  title = 'Untitled Storylet',
  summary = ''
): StoryletTemplate {
  return {
    id: createId(NARRATIVE_ELEMENT.STORYLET),
    title,
    summary,
    dialogueId,
    conditions: [],
    type: NARRATIVE_ELEMENT.STORYLET,
  };
}

export function addStoryletToChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  storyletTemplate: StoryletTemplate
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      return {
        ...chapter,
        storyletTemplates: [...(chapter.storyletTemplates || []), storyletTemplate],
      };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function createStoryletPool(
  title = 'Untitled Pool',
  selectionMode: StoryletSelectionMode = STORYLET_SELECTION_MODE.WEIGHTED
): StoryletPool {
  return {
    id: createId('pool'),
    title,
    selectionMode,
    members: [],
  };
}

export function addStoryletPoolToChapter(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  pool: StoryletPool
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      return {
        ...chapter,
        storyletPools: [...(chapter.storyletPools || []), pool],
      };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function addMemberToPool(
  pool: StoryletPool,
  templateId: string,
  weight = 1
): StoryletPool {
  const member: StoryletPoolMember = { templateId, weight };
  return {
    ...pool,
    members: [...pool.members, member],
  };
}

export function updateStoryletTemplate(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  templateId: string,
  updates: Partial<StoryletTemplate>
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const storyletTemplates = (chapter.storyletTemplates || []).map(template =>
        template.id === templateId ? { ...template, ...updates } : template
      );
      return { ...chapter, storyletTemplates };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function updateStoryletPool(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  poolId: string,
  updates: Partial<StoryletPool>
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const storyletPools = (chapter.storyletPools || []).map(pool =>
        pool.id === poolId ? { ...pool, ...updates } : pool
      );
      return { ...chapter, storyletPools };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function removeStoryletTemplate(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  templateId: string
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const storyletTemplates = (chapter.storyletTemplates || []).filter(
        template => template.id !== templateId
      );
      return { ...chapter, storyletTemplates };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function removeStoryletPool(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  poolId: string
): StoryThread {
  const acts = thread.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const storyletPools = (chapter.storyletPools || []).filter(
        pool => pool.id !== poolId
      );
      return { ...chapter, storyletPools };
    });
    return { ...act, chapters };
  });
  return { ...thread, acts };
}

export function getStoryletTemplate(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  templateId: string
): StoryletTemplate | undefined {
  const act = thread.acts.find(a => a.id === actId);
  const chapter = act?.chapters.find(c => c.id === chapterId);
  return chapter?.storyletTemplates?.find(t => t.id === templateId);
}

export function getStoryletPool(
  thread: StoryThread,
  actId: string,
  chapterId: string,
  poolId: string
): StoryletPool | undefined {
  const act = thread.acts.find(a => a.id === actId);
  const chapter = act?.chapters.find(c => c.id === chapterId);
  return chapter?.storyletPools?.find(p => p.id === poolId);
}
