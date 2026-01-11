import type {
  NarrativeAct,
  NarrativeChapter,
  NarrativePage,
  StoryThread,
  StoryletPool,
  StoryletPoolMember,
  StoryletTemplate,
} from '../types/narrative';
import {
  addAct,
  addChapter,
  addPage,
} from './narrative-helpers';

/**
 * Client for updating narrative thread structures immutably.
 * Provides a fluent API for making updates to acts, chapters, pages, and storylets.
 */
export function createNarrativeThreadClient(thread: StoryThread) {
  return {
    /**
     * Update an act in the thread
     */
    updateAct(actId: string, updates: Partial<NarrativeAct>): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const updatedAct = {
        ...thread.acts[actIndex],
        ...updates,
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },

    /**
     * Update a chapter within an act
     */
    updateChapter(
      actId: string,
      chapterId: string,
      updates: Partial<NarrativeChapter>
    ): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const act = thread.acts[actIndex];
      const chapterIndex = act.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) return thread;

      const updatedChapter = {
        ...act.chapters[chapterIndex],
        ...updates,
      };

      const updatedAct = {
        ...act,
        chapters: [
          ...act.chapters.slice(0, chapterIndex),
          updatedChapter,
          ...act.chapters.slice(chapterIndex + 1),
        ],
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },

    /**
     * Update a page within a chapter
     */
    updatePage(
      actId: string,
      chapterId: string,
      pageId: string,
      updates: Partial<NarrativePage>
    ): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const act = thread.acts[actIndex];
      const chapterIndex = act.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) return thread;

      const chapter = act.chapters[chapterIndex];
      const pageIndex = chapter.pages.findIndex(p => p.id === pageId);
      if (pageIndex === -1) return thread;

      const updatedPage = {
        ...chapter.pages[pageIndex],
        ...updates,
      };

      const updatedChapter = {
        ...chapter,
        pages: [
          ...chapter.pages.slice(0, pageIndex),
          updatedPage,
          ...chapter.pages.slice(pageIndex + 1),
        ],
      };

      const updatedAct = {
        ...act,
        chapters: [
          ...act.chapters.slice(0, chapterIndex),
          updatedChapter,
          ...act.chapters.slice(chapterIndex + 1),
        ],
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },

    /**
     * Update a storylet template within a chapter
     */
    updateStoryletTemplate(
      actId: string,
      chapterId: string,
      templateId: string,
      updates: Partial<StoryletTemplate>
    ): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const act = thread.acts[actIndex];
      const chapterIndex = act.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) return thread;

      const chapter = act.chapters[chapterIndex];
      const templates = chapter.storyletTemplates ?? [];
      const templateIndex = templates.findIndex(t => t.id === templateId);
      if (templateIndex === -1) return thread;

      const updatedTemplate = {
        ...templates[templateIndex],
        ...updates,
      };

      const updatedChapter = {
        ...chapter,
        storyletTemplates: [
          ...templates.slice(0, templateIndex),
          updatedTemplate,
          ...templates.slice(templateIndex + 1),
        ],
      };

      const updatedAct = {
        ...act,
        chapters: [
          ...act.chapters.slice(0, chapterIndex),
          updatedChapter,
          ...act.chapters.slice(chapterIndex + 1),
        ],
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },

    /**
     * Update a storylet pool within a chapter
     */
    updateStoryletPool(
      actId: string,
      chapterId: string,
      poolId: string,
      updates: Partial<StoryletPool>
    ): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const act = thread.acts[actIndex];
      const chapterIndex = act.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) return thread;

      const chapter = act.chapters[chapterIndex];
      const pools = chapter.storyletPools ?? [];
      const poolIndex = pools.findIndex(p => p.id === poolId);
      if (poolIndex === -1) return thread;

      const updatedPool = {
        ...pools[poolIndex],
        ...updates,
      };

      const updatedChapter = {
        ...chapter,
        storyletPools: [
          ...pools.slice(0, poolIndex),
          updatedPool,
          ...pools.slice(poolIndex + 1),
        ],
      };

      const updatedAct = {
        ...act,
        chapters: [
          ...act.chapters.slice(0, chapterIndex),
          updatedChapter,
          ...act.chapters.slice(chapterIndex + 1),
        ],
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },

    /**
     * Update a storylet pool member
     */
    updateStoryletMember(
      actId: string,
      chapterId: string,
      poolId: string,
      templateId: string,
      updates: Partial<StoryletPoolMember>
    ): StoryThread {
      const actIndex = thread.acts.findIndex(act => act.id === actId);
      if (actIndex === -1) return thread;

      const act = thread.acts[actIndex];
      const chapterIndex = act.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) return thread;

      const chapter = act.chapters[chapterIndex];
      const pools = chapter.storyletPools ?? [];
      const poolIndex = pools.findIndex(p => p.id === poolId);
      if (poolIndex === -1) return thread;

      const pool = pools[poolIndex];
      const memberIndex = pool.members.findIndex(m => m.templateId === templateId);
      if (memberIndex === -1) return thread;

      const updatedMember = {
        ...pool.members[memberIndex],
        ...updates,
      };

      const updatedPool = {
        ...pool,
        members: [
          ...pool.members.slice(0, memberIndex),
          updatedMember,
          ...pool.members.slice(memberIndex + 1),
        ],
      };

      const updatedChapter = {
        ...chapter,
        storyletPools: [
          ...pools.slice(0, poolIndex),
          updatedPool,
          ...pools.slice(poolIndex + 1),
        ],
      };

      const updatedAct = {
        ...act,
        chapters: [
          ...act.chapters.slice(0, chapterIndex),
          updatedChapter,
          ...act.chapters.slice(chapterIndex + 1),
        ],
      };

      return {
        ...thread,
        acts: [
          ...thread.acts.slice(0, actIndex),
          updatedAct,
          ...thread.acts.slice(actIndex + 1),
        ],
      };
    },
  };
}
