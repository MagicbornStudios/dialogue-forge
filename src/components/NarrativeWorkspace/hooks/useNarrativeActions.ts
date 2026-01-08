import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { NARRATIVE_ELEMENT, STORYLET_SELECTION_MODE } from '../../../types/narrative';
import type {
  NarrativeAct,
  NarrativeChapter,
  NarrativePage,
  StoryThread,
  StoryletPool,
  StoryletPoolMember,
  StoryletTemplate,
} from '../../../types/narrative';
import { createNarrativeThreadClient } from '../../../utils/narrative-client';
import { createUniqueId } from '../../../utils/narrative-editor-utils';
import type { DialogueTree } from '../../../types';

interface UseNarrativeActionsProps {
  thread: StoryThread;
  setThread: (thread: StoryThread) => void;
  dialogueTree: DialogueTree;
  selectedAct: NarrativeAct | undefined;
  selectedChapter: NarrativeChapter | undefined;
  selectedPage: NarrativePage | undefined;
  activePool: StoryletPool | undefined;
  setSelection: (updater: (prev: any) => any) => void;
  setDialogueScope: (scope: 'page' | 'storylet') => void;
  setStoryletFocusId: (id: string | null) => void;
  setActivePoolId: (id: string | undefined) => void;
  setEditingStoryletId: Dispatch<SetStateAction<string | null>>;
}

export function useNarrativeActions({
  thread,
  setThread,
  dialogueTree,
  selectedAct,
  selectedChapter,
  selectedPage,
  activePool,
  setSelection,
  setDialogueScope,
  setStoryletFocusId,
  setActivePoolId,
  setEditingStoryletId,
}: UseNarrativeActionsProps) {
  const updateThread = useCallback((nextThread: StoryThread) => {
    setThread({
      ...nextThread,
      type: nextThread.type ?? NARRATIVE_ELEMENT.THREAD,
    });
  }, [setThread]);

  const updateChapter = useCallback((
    actId: string,
    chapterId: string,
    updates: Partial<StoryThread['acts'][number]['chapters'][number]>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateChapter(actId, chapterId, updates));
  }, [thread, updateThread]);

  const updateStoryletMember = useCallback((
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string,
    updates: Partial<StoryletPoolMember>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateStoryletMember(actId, chapterId, poolId, templateId, updates));
  }, [thread, updateThread]);

  const updateStoryletTemplate = useCallback((
    actId: string,
    chapterId: string,
    templateId: string,
    updates: Partial<StoryletTemplate>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateStoryletTemplate(actId, chapterId, templateId, updates));
  }, [thread, updateThread]);

  const updateStoryletPool = useCallback((
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateStoryletPool(actId, chapterId, poolId, updates));
  }, [thread, updateThread]);

  const handleAddStoryletPool = useCallback(() => {
    if (!selectedAct || !selectedChapter) return;
    const existingPools = selectedChapter.storyletPools ?? [];
    const nextId = createUniqueId(
      existingPools.map(pool => pool.id),
      'pool'
    );
    const nextPool: StoryletPool = {
      id: nextId,
      title: 'Storylet Pool',
      summary: '',
      selectionMode: STORYLET_SELECTION_MODE.WEIGHTED,
      members: [],
    };

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: [...existingPools, nextPool],
    });
  }, [selectedAct, selectedChapter, updateChapter]);

  const handleAddStorylet = useCallback(() => {
    if (!selectedAct || !selectedChapter) return;
    const pools = selectedChapter.storyletPools ?? [];
    let targetPoolId = activePool?.id ?? pools[0]?.id;

    if (!targetPoolId) {
      const nextPoolId = createUniqueId([], 'pool');
      targetPoolId = nextPoolId;
      updateChapter(selectedAct.id, selectedChapter.id, {
        storyletPools: [
          {
            id: nextPoolId,
            title: 'Storylet Pool',
            summary: '',
            selectionMode: STORYLET_SELECTION_MODE.WEIGHTED,
            members: [],
          },
        ],
      });
    }

    const templates = selectedChapter.storyletTemplates ?? [];
    const currentStoryletIds = templates.map(template => template.id);
    const nextId = createUniqueId(currentStoryletIds, 'storylet');
    const nextStorylet: StoryletTemplate = {
      id: nextId,
      title: 'New Storylet',
      summary: '',
      dialogueId: selectedPage?.dialogueId ?? '',
      type: NARRATIVE_ELEMENT.STORYLET,
    };
    const nextMember: StoryletPoolMember = {
      templateId: nextId,
      weight: 1,
    };

    const updatedPools = (selectedChapter.storyletPools ?? []).map(pool =>
      pool.id === targetPoolId
        ? { ...pool, members: [...pool.members, nextMember] }
        : pool
    );

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletTemplates: [...templates, nextStorylet],
      storyletPools: updatedPools,
    });
    setSelection(prev => ({
      ...prev,
      storyletKey: `${targetPoolId}:${nextStorylet.id}`,
    }));
    setActivePoolId(targetPoolId);
    setEditingStoryletId(nextStorylet.id);
  }, [selectedAct, selectedChapter, selectedPage, activePool, updateChapter, setSelection, setActivePoolId, setEditingStoryletId]);

  const handleStoryletTemplateUpdate = useCallback((
    entry: { poolId: string; template: StoryletTemplate },
    updates: Partial<StoryletTemplate>
  ) => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = updates.id ?? entry.template.id;
    updateStoryletTemplate(selectedAct.id, selectedChapter.id, entry.template.id, updates);
    if (updates.id && nextId !== entry.template.id) {
      setSelection(prev => ({
        ...prev,
        storyletKey: `${entry.poolId}:${nextId}`,
      }));
      setEditingStoryletId((prev: string | null) => prev === entry.template.id ? nextId : prev);
    }
  }, [selectedAct, selectedChapter, updateStoryletTemplate, setSelection, setEditingStoryletId]);

  const handleStoryletMemberUpdate = useCallback((
    entry: { poolId: string; template: StoryletTemplate },
    updates: Partial<StoryletPoolMember>
  ) => {
    if (!selectedAct || !selectedChapter) return;
    updateStoryletMember(selectedAct.id, selectedChapter.id, entry.poolId, entry.template.id, updates);
  }, [selectedAct, selectedChapter, updateStoryletMember]);

  const handleStoryletPoolUpdate = useCallback((poolId: string, updates: Partial<StoryletPool>) => {
    if (!selectedAct || !selectedChapter) return;
    updateStoryletPool(selectedAct.id, selectedChapter.id, poolId, updates);
  }, [selectedAct, selectedChapter, updateStoryletPool]);

  const resolveStoryletTemplate = useCallback((templateId: string) => {
    return selectedChapter?.storyletTemplates?.find(template => template.id === templateId);
  }, [selectedChapter]);

  const handleOpenStoryletTemplate = useCallback((templateId: string) => {
    const template = resolveStoryletTemplate(templateId);
    if (!template) return;
    setStoryletFocusId(template.dialogueId);
    setDialogueScope('storylet');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('storyletTemplate.openRequested', {
          detail: { templateId, dialogueId: template.dialogueId },
        })
      );
    }
  }, [resolveStoryletTemplate, setStoryletFocusId, setDialogueScope]);

  const handleAddAct = useCallback(() => {
    const nextId = createUniqueId(
      thread.acts.map(act => act.id),
      'act'
    );
    const nextAct: NarrativeAct = {
      id: nextId,
      title: `Act ${thread.acts.length + 1}`,
      summary: '',
      chapters: [],
      type: NARRATIVE_ELEMENT.ACT,
    };
    updateThread({
      ...thread,
      acts: [...thread.acts, nextAct],
    });
    setSelection(prev => ({
      ...prev,
      actId: nextAct.id,
      chapterId: nextAct.chapters[0]?.id,
      pageId: nextAct.chapters[0]?.pages[0]?.id,
    }));
    setDialogueScope('page');
    setStoryletFocusId(null);
  }, [thread, updateThread, setSelection, setDialogueScope, setStoryletFocusId]);

  const handleAddChapter = useCallback(() => {
    if (!selectedAct) return;
    const nextId = createUniqueId(
      selectedAct.chapters.map(chapter => chapter.id),
      'chapter'
    );
    const nextChapter: NarrativeChapter = {
      id: nextId,
      title: `Chapter ${selectedAct.chapters.length + 1}`,
      summary: '',
      pages: [],
      storyletTemplates: [],
      storyletPools: [],
      type: NARRATIVE_ELEMENT.CHAPTER,
    };
    updateThread({
      ...thread,
      acts: thread.acts.map(act =>
        act.id === selectedAct.id
          ? { ...act, chapters: [...act.chapters, nextChapter] }
          : act
      ),
    });
    setSelection(prev => ({
      ...prev,
      chapterId: nextChapter.id,
      pageId: nextChapter.pages[0]?.id,
    }));
    setDialogueScope('page');
    setStoryletFocusId(null);
  }, [selectedAct, thread, updateThread, setSelection, setDialogueScope, setStoryletFocusId]);

  const handleAddPage = useCallback(() => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = createUniqueId(
      selectedChapter.pages.map(page => page.id),
      'page'
    );
    const nextPage: NarrativePage = {
      id: nextId,
      title: `Page ${selectedChapter.pages.length + 1}`,
      summary: '',
      dialogueId: dialogueTree.id,
      type: NARRATIVE_ELEMENT.PAGE,
    };
    updateThread({
      ...thread,
      acts: thread.acts.map(act =>
        act.id === selectedAct.id
          ? {
              ...act,
              chapters: act.chapters.map(chapter =>
                chapter.id === selectedChapter.id
                  ? { ...chapter, pages: [...chapter.pages, nextPage] }
                  : chapter
              ),
            }
          : act
      ),
    });
    setSelection(prev => ({
      ...prev,
      pageId: nextPage.id,
    }));
    setDialogueScope('page');
    setStoryletFocusId(null);
  }, [selectedAct, selectedChapter, dialogueTree, thread, updateThread, setSelection, setDialogueScope, setStoryletFocusId]);

  return {
    updateThread,
    updateChapter,
    updateStoryletMember,
    updateStoryletTemplate,
    updateStoryletPool,
    handleAddStoryletPool,
    handleAddStorylet,
    handleStoryletTemplateUpdate,
    handleStoryletMemberUpdate,
    handleStoryletPoolUpdate,
    resolveStoryletTemplate,
    handleOpenStoryletTemplate,
    handleAddAct,
    handleAddChapter,
    handleAddPage,
  };
}
