import { NARRATIVE_ENTITY_TYPE } from '../types/constants';
import {
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativeEntityMeta,
  type NarrativePage,
  type NarrativeStorylet,
  type NarrativeStoryletExit,
  type NarrativeStructure,
  DEFAULT_NARRATIVE_ENTITY_LABELS,
} from '../types/narrative';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createEmptyNarrative(title = 'Untitled Narrative'): NarrativeStructure {
  const actId = createId(NARRATIVE_ENTITY_TYPE.ACT);
  const chapterId = createId(NARRATIVE_ENTITY_TYPE.CHAPTER);
  const pageId = createId(NARRATIVE_ENTITY_TYPE.PAGE);
  const storyletId = createId(NARRATIVE_ENTITY_TYPE.STORYLET);

  const starterStorylet: NarrativeStorylet = {
    id: storyletId,
    title: 'First Storylet',
    summary: 'Use storylets to reference dialogue graphs or beats.',
    exits: [],
  };

  const starterPage: NarrativePage = {
    id: pageId,
    title: 'Page 1',
    storylets: [starterStorylet],
    startStoryletId: storyletId,
  };

  const starterChapter: NarrativeChapter = {
    id: chapterId,
    title: 'Chapter 1',
    pages: [starterPage],
    startPageId: pageId,
  };

  const starterAct: NarrativeAct = {
    id: actId,
    title: 'Act 1',
    chapters: [starterChapter],
    startChapterId: chapterId,
  };

  return {
    id: createId('narrative'),
    title,
    acts: [starterAct],
    startActId: actId,
    startChapterId: chapterId,
    startPageId: pageId,
  };
}

export function addAct(narrative: NarrativeStructure, title = 'New Act'): NarrativeStructure {
  const actId = createId(NARRATIVE_ENTITY_TYPE.ACT);
  const chapterId = createId(NARRATIVE_ENTITY_TYPE.CHAPTER);
  const pageId = createId(NARRATIVE_ENTITY_TYPE.PAGE);
  const storyletId = createId(NARRATIVE_ENTITY_TYPE.STORYLET);

  const starterStorylet: NarrativeStorylet = {
    id: storyletId,
    title: 'Storylet',
    exits: [],
  };

  const starterPage: NarrativePage = {
    id: pageId,
    title: 'Page',
    storylets: [starterStorylet],
    startStoryletId: storyletId,
  };

  const starterChapter: NarrativeChapter = {
    id: chapterId,
    title: 'Chapter',
    pages: [starterPage],
    startPageId: pageId,
  };

  const newAct: NarrativeAct = {
    id: actId,
    title,
    chapters: [starterChapter],
    startChapterId: chapterId,
  };

  return {
    ...narrative,
    acts: [...narrative.acts, newAct],
    startActId: narrative.startActId ?? actId,
  };
}

export function addChapter(
  narrative: NarrativeStructure,
  actId: string,
  title = 'New Chapter'
): NarrativeStructure {
  const chapterId = createId(NARRATIVE_ENTITY_TYPE.CHAPTER);
  const pageId = createId(NARRATIVE_ENTITY_TYPE.PAGE);
  const storyletId = createId(NARRATIVE_ENTITY_TYPE.STORYLET);

  const starterStorylet: NarrativeStorylet = {
    id: storyletId,
    title: 'Storylet',
    exits: [],
  };

  const starterPage: NarrativePage = {
    id: pageId,
    title: 'Page',
    storylets: [starterStorylet],
    startStoryletId: storyletId,
  };

  const updatedActs = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const newChapter: NarrativeChapter = {
      id: chapterId,
      title,
      pages: [starterPage],
      startPageId: pageId,
    };
    return {
      ...act,
      chapters: [...act.chapters, newChapter],
      startChapterId: act.startChapterId ?? chapterId,
    };
  });

  return {
    ...narrative,
    acts: updatedActs,
  };
}

export function addPage(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  title = 'New Page'
): NarrativeStructure {
  const pageId = createId(NARRATIVE_ENTITY_TYPE.PAGE);
  const storyletId = createId(NARRATIVE_ENTITY_TYPE.STORYLET);

  const starterStorylet: NarrativeStorylet = {
    id: storyletId,
    title: 'Storylet',
    exits: [],
  };

  const starterPage: NarrativePage = {
    id: pageId,
    title,
    storylets: [starterStorylet],
    startStoryletId: storyletId,
  };

  const updatedActs = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      return {
        ...chapter,
        pages: [...chapter.pages, starterPage],
        startPageId: chapter.startPageId ?? pageId,
      };
    });
    return { ...act, chapters };
  });

  return {
    ...narrative,
    acts: updatedActs,
  };
}

export function addStorylet(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string,
  title = 'New Storylet'
): NarrativeStructure {
  const storyletId = createId(NARRATIVE_ENTITY_TYPE.STORYLET);
  const storylet: NarrativeStorylet = {
    id: storyletId,
    title,
    exits: [],
  };

  const acts = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const pages = chapter.pages.map(page => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          storylets: [...page.storylets, storylet],
          startStoryletId: page.startStoryletId ?? storyletId,
        };
      });
      return { ...chapter, pages };
    });
    return { ...act, chapters };
  });

  return {
    ...narrative,
    acts,
  };
}

export function updateStorylet(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string,
  storyletId: string,
  updates: Partial<NarrativeStorylet>
): NarrativeStructure {
  const acts = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const pages = chapter.pages.map(page => {
        if (page.id !== pageId) return page;
        const storylets = page.storylets.map(storylet =>
          storylet.id === storyletId ? { ...storylet, ...updates } : storylet
        );
        return { ...page, storylets };
      });
      return { ...chapter, pages };
    });
    return { ...act, chapters };
  });

  return { ...narrative, acts };
}

export function updateStoryletExit(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string,
  storyletId: string,
  exitId: string,
  updates: Partial<NarrativeStoryletExit>
): NarrativeStructure {
  const storylet = getStorylet(narrative, { actId, chapterId, pageId, storyletId });
  if (!storylet) return narrative;

  const exits = storylet.exits?.map(exit =>
    exit.id === exitId ? { ...exit, ...updates } : exit
  ) ?? [];

  return updateStorylet(narrative, actId, chapterId, pageId, storyletId, {
    exits,
  });
}

export function removeStorylet(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string,
  storyletId: string
): NarrativeStructure {
  const acts = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const pages = chapter.pages.map(page => {
        if (page.id !== pageId) return page;
        const storylets = page.storylets.filter(s => s.id !== storyletId);
        const startStoryletId = page.startStoryletId === storyletId ? storylets[0]?.id : page.startStoryletId;
        return { ...page, storylets, startStoryletId };
      });
      return { ...chapter, pages };
    });
    return { ...act, chapters };
  });

  return { ...narrative, acts };
}

export function removePage(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string
): NarrativeStructure {
  const acts = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.map(chapter => {
      if (chapter.id !== chapterId) return chapter;
      const pages = chapter.pages.filter(p => p.id !== pageId);
      const startPageId = chapter.startPageId === pageId ? pages[0]?.id : chapter.startPageId;
      return { ...chapter, pages, startPageId };
    });
    return { ...act, chapters };
  });

  return { ...narrative, acts };
}

export function removeChapter(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string
): NarrativeStructure {
  const acts = narrative.acts.map(act => {
    if (act.id !== actId) return act;
    const chapters = act.chapters.filter(ch => ch.id !== chapterId);
    const startChapterId = act.startChapterId === chapterId ? chapters[0]?.id : act.startChapterId;
    return { ...act, chapters, startChapterId };
  });

  return { ...narrative, acts };
}

export function removeAct(narrative: NarrativeStructure, actId: string): NarrativeStructure {
  const acts = narrative.acts.filter(act => act.id !== actId);
  const startActId = narrative.startActId === actId ? acts[0]?.id : narrative.startActId;
  return { ...narrative, acts, startActId };
}

export function addStoryletExit(
  narrative: NarrativeStructure,
  actId: string,
  chapterId: string,
  pageId: string,
  storyletId: string,
  label = 'Outcome'
): NarrativeStructure {
  const storylet = getStorylet(narrative, { actId, chapterId, pageId, storyletId });
  if (!storylet) return narrative;

  const exit: NarrativeStoryletExit = {
    id: createId('exit'),
    label,
    weight: 1,
  };

  const exits = [...(storylet.exits ?? []), exit];

  return updateStorylet(narrative, actId, chapterId, pageId, storyletId, { exits });
}

export function getStorylet(
  narrative: NarrativeStructure,
  meta: Pick<NarrativeEntityMeta, 'actId' | 'chapterId' | 'pageId' | 'storyletId'>
): NarrativeStorylet | undefined {
  const act = narrative.acts.find(a => a.id === meta.actId);
  const chapter = act?.chapters.find(c => c.id === meta.chapterId);
  const page = chapter?.pages.find(p => p.id === meta.pageId);
  return page?.storylets.find(s => s.id === meta.storyletId);
}

export function getEntityLabel(meta: NarrativeEntityMeta): string {
  return DEFAULT_NARRATIVE_ENTITY_LABELS[meta.type] ?? 'Entity';
}

export function flattenNarrative(narrative: NarrativeStructure): NarrativeEntityMeta[] {
  const entities: NarrativeEntityMeta[] = [];
  narrative.acts.forEach(act => {
    entities.push({ id: act.id, type: NARRATIVE_ENTITY_TYPE.ACT, actId: act.id });
    act.chapters.forEach(chapter => {
      entities.push({ id: chapter.id, type: NARRATIVE_ENTITY_TYPE.CHAPTER, actId: act.id, chapterId: chapter.id });
      chapter.pages.forEach(page => {
        entities.push({
          id: page.id,
          type: NARRATIVE_ENTITY_TYPE.PAGE,
          actId: act.id,
          chapterId: chapter.id,
          pageId: page.id,
        });
        page.storylets.forEach(storylet => {
          entities.push({
            id: storylet.id,
            type: NARRATIVE_ENTITY_TYPE.STORYLET,
            actId: act.id,
            chapterId: chapter.id,
            pageId: page.id,
            storyletId: storylet.id,
          });
        });
      });
    });
  });
  return entities;
}
