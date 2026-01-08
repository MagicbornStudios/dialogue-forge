import {
  NARRATIVE_ELEMENT,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type StoryThread,
  type StoryletPool,
  type StoryletPoolMember,
  type StoryletTemplate,
} from '../types/narrative';

interface StoryletEntry {
  pool: StoryletPool;
  member: StoryletPoolMember;
  template: StoryletTemplate;
}

export interface NarrativeThreadClient {
  getAct: (actId: string) => NarrativeAct | undefined;
  getChapter: (actId: string, chapterId: string) => NarrativeChapter | undefined;
  getPage: (actId: string, chapterId: string, pageId: string) => NarrativePage | undefined;
  getStoryletPool: (actId: string, chapterId: string, poolId: string) => StoryletPool | undefined;
  getStoryletEntry: (
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string
  ) => StoryletEntry | undefined;
  updateAct: (actId: string, updates: Partial<NarrativeAct>) => StoryThread;
  updateChapter: (
    actId: string,
    chapterId: string,
    updates: Partial<NarrativeChapter>
  ) => StoryThread;
  updatePage: (
    actId: string,
    chapterId: string,
    pageId: string,
    updates: Partial<NarrativePage>
  ) => StoryThread;
  updateStoryletMember: (
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string,
    updates: Partial<StoryletPoolMember>
  ) => StoryThread;
  updateStoryletTemplate: (
    actId: string,
    chapterId: string,
    templateId: string,
    updates: Partial<StoryletTemplate>
  ) => StoryThread;
  updateStoryletPool: (
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => StoryThread;
}

export function createNarrativeThreadClient(thread: StoryThread): NarrativeThreadClient {
  const getAct = (actId: string) => thread.acts.find(act => act.id === actId);

  const getChapter = (actId: string, chapterId: string) =>
    getAct(actId)?.chapters.find(chapter => chapter.id === chapterId);

  const getPage = (actId: string, chapterId: string, pageId: string) =>
    getChapter(actId, chapterId)?.pages.find(page => page.id === pageId);

  const getStoryletPool = (actId: string, chapterId: string, poolId: string) =>
    getChapter(actId, chapterId)?.storyletPools?.find(pool => pool.id === poolId);

  const getStoryletEntry = (
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string
  ) => {
    const pool = getStoryletPool(actId, chapterId, poolId);
    if (!pool) return undefined;
    const member = pool.members.find(item => item.templateId === templateId);
    if (!member) return undefined;
    const template = getChapter(actId, chapterId)?.storyletTemplates?.find(
      item => item.id === templateId
    );
    if (!template) return undefined;
    return { pool, member, template };
  };

  const updateAct = (actId: string, updates: Partial<NarrativeAct>) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? { ...act, ...updates, type: act.type ?? NARRATIVE_ELEMENT.ACT }
        : act
    ),
  });

  const updateChapter = (actId: string, chapterId: string, updates: Partial<NarrativeChapter>) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? {
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === chapterId
                ? { ...chapter, ...updates, type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER }
                : chapter
            ),
            type: act.type ?? NARRATIVE_ELEMENT.ACT,
          }
        : act
    ),
  });

  const updatePage = (
    actId: string,
    chapterId: string,
    pageId: string,
    updates: Partial<NarrativePage>
  ) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? {
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === chapterId
                ? {
                    ...chapter,
                    pages: chapter.pages.map(page =>
                      page.id === pageId
                        ? { ...page, ...updates, type: page.type ?? NARRATIVE_ELEMENT.PAGE }
                        : page
                    ),
                    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
                  }
                : chapter
            ),
            type: act.type ?? NARRATIVE_ELEMENT.ACT,
          }
        : act
    ),
  });

  const updateStoryletMember = (
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string,
    updates: Partial<StoryletPoolMember>
  ) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? {
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === chapterId
                ? {
                    ...chapter,
                    storyletPools: (chapter.storyletPools ?? []).map(pool =>
                      pool.id === poolId
                        ? {
                            ...pool,
                            members: pool.members.map(member =>
                              member.templateId === templateId
                                ? {
                                    ...member,
                                    ...updates,
                                  }
                                : member
                            ),
                          }
                        : pool
                    ),
                    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
                  }
                : chapter
            ),
            type: act.type ?? NARRATIVE_ELEMENT.ACT,
          }
        : act
    ),
  });

  const updateStoryletTemplate = (
    actId: string,
    chapterId: string,
    templateId: string,
    updates: Partial<StoryletTemplate>
  ) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? {
            ...act,
            chapters: act.chapters.map(chapter => {
              if (chapter.id !== chapterId) {
                return chapter;
              }
              const nextTemplateId = updates.id ?? templateId;
              return {
                ...chapter,
                storyletTemplates: (chapter.storyletTemplates ?? []).map(template =>
                  template.id === templateId
                    ? {
                        ...template,
                        ...updates,
                        type: template.type ?? NARRATIVE_ELEMENT.STORYLET,
                      }
                    : template
                ),
                storyletPools: (chapter.storyletPools ?? []).map(pool => ({
                  ...pool,
                  members: pool.members.map(member =>
                    member.templateId === templateId
                      ? { ...member, templateId: nextTemplateId }
                      : member
                  ),
                })),
                type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
              };
            }),
            type: act.type ?? NARRATIVE_ELEMENT.ACT,
          }
        : act
    ),
  });

  const updateStoryletPool = (
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => ({
    ...thread,
    acts: thread.acts.map(act =>
      act.id === actId
        ? {
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === chapterId
                ? {
                    ...chapter,
                    storyletPools: (chapter.storyletPools ?? []).map(pool =>
                      pool.id === poolId
                        ? { ...pool, ...updates }
                        : pool
                    ),
                    type: chapter.type ?? NARRATIVE_ELEMENT.CHAPTER,
                  }
                : chapter
            ),
            type: act.type ?? NARRATIVE_ELEMENT.ACT,
          }
        : act
    ),
  });

  return {
    getAct,
    getChapter,
    getPage,
    getStoryletPool,
    getStoryletEntry,
    updateAct,
    updateChapter,
    updatePage,
    updateStoryletMember,
    updateStoryletTemplate,
    updateStoryletPool,
  };
}
