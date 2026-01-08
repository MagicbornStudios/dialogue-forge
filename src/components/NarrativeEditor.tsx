import React, { useEffect, useMemo, useState } from 'react';
import {
  NARRATIVE_ELEMENT,
  STORYLET_SELECTION_MODE,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativeElement,
  type NarrativePage,
  type StoryThread,
  type StoryletPool,
  type StoryletPoolMember,
  type StoryletTemplate,
} from '../types/narrative';
import { createNarrativeThreadClient } from '../utils/narrative-client';
import { createUniqueId, moveItem } from '../utils/narrative-editor-utils';
import {
  ActPanel,
  ChapterPanel,
  PagePanel,
  StoryletPanel,
} from './narrative-editor';

export type NarrativeEditorAction =
  | { type: 'create'; element: NarrativeElement; id: string; parentId?: string }
  | { type: 'delete'; element: NarrativeElement; id: string; parentId?: string }
  | {
      type: 'reorder';
      element: NarrativeElement;
      id: string;
      parentId?: string;
      direction: 'up' | 'down';
    };

interface NarrativeEditorProps {
  thread: StoryThread;
  onChange: (thread: StoryThread) => void;
  onAction?: (action: NarrativeEditorAction) => void;
  selection?: NarrativeSelection;
  onSelectionChange?: (selection: NarrativeSelection) => void;
  className?: string;
}

export interface NarrativeSelection {
  actId?: string;
  chapterId?: string;
  pageId?: string;
  storyletKey?: string;
}

interface StoryletEntry {
  poolId: string;
  member: StoryletPoolMember;
  template: StoryletTemplate;
}

const DEFAULT_POOL_TITLE = 'Storylet Pool';

export function NarrativeEditor({
  thread,
  onChange,
  onAction,
  selection,
  onSelectionChange,
  className = '',
}: NarrativeEditorProps) {
  const isSelectionControlled = selection !== undefined;
  const [internalSelection, setInternalSelection] = useState<NarrativeSelection>(() => ({
    actId: thread.acts[0]?.id,
    chapterId: thread.acts[0]?.chapters[0]?.id,
    pageId: thread.acts[0]?.chapters[0]?.pages[0]?.id,
    storyletKey: undefined,
  }));
  const activeSelection = selection ?? internalSelection;
  const selectedActId = activeSelection.actId;
  const selectedChapterId = activeSelection.chapterId;
  const selectedPageId = activeSelection.pageId;
  const selectedStoryletKey = activeSelection.storyletKey;

  const updateSelection = (nextSelection: NarrativeSelection) => {
    if (!isSelectionControlled) {
      setInternalSelection(nextSelection);
    }
    onSelectionChange?.(nextSelection);
  };

  const selectedAct = useMemo(
    () => thread.acts.find(act => act.id === selectedActId),
    [thread.acts, selectedActId]
  );

  const selectedChapter = useMemo(
    () => selectedAct?.chapters.find(chapter => chapter.id === selectedChapterId),
    [selectedAct, selectedChapterId]
  );

  const selectedPage = useMemo(
    () => selectedChapter?.pages.find(page => page.id === selectedPageId),
    [selectedChapter, selectedPageId]
  );

  const storyletEntries = useMemo<StoryletEntry[]>(() => {
    const pools = selectedChapter?.storyletPools ?? [];
    const templates = selectedChapter?.storyletTemplates ?? [];
    return pools.flatMap(pool =>
      pool.members.map(member => ({
        poolId: pool.id,
        member,
        template: templates.find(item => item.id === member.templateId)
          ?? {
            id: member.templateId,
            dialogueId: '',
            type: NARRATIVE_ELEMENT.STORYLET,
          },
      }))
    );
  }, [selectedChapter]);

  const selectedStoryletEntry = useMemo(() => {
    if (!selectedStoryletKey) return storyletEntries[0];
    return storyletEntries.find(
      entry => `${entry.poolId}:${entry.template.id}` === selectedStoryletKey
    );
  }, [selectedStoryletKey, storyletEntries]);

  const threadClient = useMemo(() => createNarrativeThreadClient(thread), [thread]);

  useEffect(() => {
    const nextAct = selectedAct ?? thread.acts[0];
    const nextActId = nextAct?.id;

    const nextChapter = nextAct?.chapters.find(chapter => chapter.id === selectedChapterId)
      ?? nextAct?.chapters[0];
    const nextChapterId = nextChapter?.id;

    const nextPage = nextChapter?.pages.find(page => page.id === selectedPageId)
      ?? nextChapter?.pages[0];
    const nextPageId = nextPage?.id;

    const nextStoryletKey = selectedStoryletEntry
      ? `${selectedStoryletEntry.poolId}:${selectedStoryletEntry.template.id}`
      : storyletEntries[0]
        ? `${storyletEntries[0].poolId}:${storyletEntries[0].template.id}`
        : undefined;

    const nextSelection: NarrativeSelection = {
      actId: nextActId,
      chapterId: nextChapterId,
      pageId: nextPageId,
      storyletKey: nextStoryletKey,
    };

    if (
      nextSelection.actId !== selectedActId
      || nextSelection.chapterId !== selectedChapterId
      || nextSelection.pageId !== selectedPageId
      || nextSelection.storyletKey !== selectedStoryletKey
    ) {
      updateSelection(nextSelection);
    }
  }, [
    selectedAct,
    selectedActId,
    selectedChapterId,
    selectedPageId,
    selectedStoryletEntry,
    selectedStoryletKey,
    storyletEntries,
    thread.acts,
  ]);

  const updateThread = (nextThread: StoryThread) => {
    onChange({
      ...nextThread,
      type: nextThread.type ?? NARRATIVE_ELEMENT.THREAD,
    });
  };

  const updateAct = (actId: string, updates: Partial<NarrativeAct>) => {
    updateThread(threadClient.updateAct(actId, updates));
  };

  const updateChapter = (
    actId: string,
    chapterId: string,
    updates: Partial<NarrativeChapter>
  ) => {
    updateThread(threadClient.updateChapter(actId, chapterId, updates));
  };

  const updatePage = (
    actId: string,
    chapterId: string,
    pageId: string,
    updates: Partial<NarrativePage>
  ) => {
    updateThread(threadClient.updatePage(actId, chapterId, pageId, updates));
  };

  const updateStoryletMember = (
    actId: string,
    chapterId: string,
    poolId: string,
    templateId: string,
    updates: Partial<StoryletPoolMember>
  ) => {
    updateThread(threadClient.updateStoryletMember(actId, chapterId, poolId, templateId, updates));
  };

  const updateStoryletTemplate = (
    actId: string,
    chapterId: string,
    templateId: string,
    updates: Partial<StoryletTemplate>
  ) => {
    updateThread(threadClient.updateStoryletTemplate(actId, chapterId, templateId, updates));
  };

  const updateStoryletPool = (
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => {
    updateThread(threadClient.updateStoryletPool(actId, chapterId, poolId, updates));
  };

  const handleAddAct = () => {
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
    updateSelection({
      ...activeSelection,
      actId: nextAct.id,
      chapterId: nextAct.chapters[0]?.id,
      pageId: nextAct.chapters[0]?.pages[0]?.id,
    });
    onAction?.({ type: 'create', element: NARRATIVE_ELEMENT.ACT, id: nextAct.id });
  };

  const handleAddChapter = () => {
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

    updateAct(selectedAct.id, {
      chapters: [...selectedAct.chapters, nextChapter],
    });
    updateSelection({
      ...activeSelection,
      chapterId: nextChapter.id,
      pageId: nextChapter.pages[0]?.id,
    });
    onAction?.({
      type: 'create',
      element: NARRATIVE_ELEMENT.CHAPTER,
      id: nextChapter.id,
      parentId: selectedAct.id,
    });
  };

  const handleAddPage = () => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = createUniqueId(
      selectedChapter.pages.map(page => page.id),
      'page'
    );
    const nextPage: NarrativePage = {
      id: nextId,
      title: `Page ${selectedChapter.pages.length + 1}`,
      summary: '',
      dialogueId: '',
      type: NARRATIVE_ELEMENT.PAGE,
    };

    updateChapter(selectedAct.id, selectedChapter.id, {
      pages: [...selectedChapter.pages, nextPage],
    });
    updateSelection({
      ...activeSelection,
      pageId: nextPage.id,
    });
    onAction?.({
      type: 'create',
      element: NARRATIVE_ELEMENT.PAGE,
      id: nextPage.id,
      parentId: selectedChapter.id,
    });
  };

  const handleAddStoryletPool = () => {
    if (!selectedAct || !selectedChapter) return;
    const existingPools = selectedChapter.storyletPools ?? [];
    const nextId = createUniqueId(
      existingPools.map(pool => pool.id),
      'pool'
    );
    const nextPool: StoryletPool = {
      id: nextId,
      title: DEFAULT_POOL_TITLE,
      summary: '',
      selectionMode: STORYLET_SELECTION_MODE.WEIGHTED,
      members: [],
    };

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: [...existingPools, nextPool],
    });
  };

  const handleAddStorylet = () => {
    if (!selectedAct || !selectedChapter) return;
    const pools = selectedChapter.storyletPools ?? [];
    let targetPoolId = pools[0]?.id;

    if (!targetPoolId) {
      const nextPoolId = createUniqueId([], 'pool');
      targetPoolId = nextPoolId;
      updateChapter(selectedAct.id, selectedChapter.id, {
        storyletPools: [
          {
            id: nextPoolId,
            title: DEFAULT_POOL_TITLE,
            summary: '',
            selectionMode: STORYLET_SELECTION_MODE.WEIGHTED,
            members: [],
          },
        ],
      });
    }

    const templates = selectedChapter.storyletTemplates ?? [];
    const currentStoryletIds = templates.map(storylet => storylet.id);
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
    updateSelection({
      ...activeSelection,
      storyletKey: `${targetPoolId}:${nextStorylet.id}`,
    });
    onAction?.({
      type: 'create',
      element: NARRATIVE_ELEMENT.STORYLET,
      id: nextStorylet.id,
      parentId: targetPoolId,
    });
  };

  const handleDeleteAct = () => {
    if (!selectedAct) return;
    updateThread({
      ...thread,
      acts: thread.acts.filter(act => act.id !== selectedAct.id),
    });
    onAction?.({ type: 'delete', element: NARRATIVE_ELEMENT.ACT, id: selectedAct.id });
  };

  const handleDeleteChapter = () => {
    if (!selectedAct || !selectedChapter) return;
    updateAct(selectedAct.id, {
      chapters: selectedAct.chapters.filter(chapter => chapter.id !== selectedChapter.id),
    });
    onAction?.({
      type: 'delete',
      element: NARRATIVE_ELEMENT.CHAPTER,
      id: selectedChapter.id,
      parentId: selectedAct.id,
    });
  };

  const handleDeletePage = () => {
    if (!selectedAct || !selectedChapter || !selectedPage) return;
    updateChapter(selectedAct.id, selectedChapter.id, {
      pages: selectedChapter.pages.filter(page => page.id !== selectedPage.id),
    });
    onAction?.({
      type: 'delete',
      element: NARRATIVE_ELEMENT.PAGE,
      id: selectedPage.id,
      parentId: selectedChapter.id,
    });
  };

  const handleDeleteStorylet = () => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, template } = selectedStoryletEntry;
    const updatedPools = (selectedChapter.storyletPools ?? []).map(pool => {
      if (pool.id !== poolId) return pool;
      return {
        ...pool,
        members: pool.members.filter(member => member.templateId !== template.id),
      };
    });
    const remainingTemplateIds = new Set(
      updatedPools.flatMap(pool => pool.members.map(member => member.templateId))
    );
    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletTemplates: (selectedChapter.storyletTemplates ?? []).filter(item =>
        remainingTemplateIds.has(item.id)
      ),
      storyletPools: updatedPools,
    });
    onAction?.({
      type: 'delete',
      element: NARRATIVE_ELEMENT.STORYLET,
      id: template.id,
      parentId: poolId,
    });
  };

  const handleMoveAct = (direction: 'up' | 'down') => {
    if (!selectedAct) return;
    const index = thread.acts.findIndex(act => act.id === selectedAct.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= thread.acts.length) return;

    updateThread({
      ...thread,
      acts: moveItem(thread.acts, index, nextIndex),
    });
    onAction?.({
      type: 'reorder',
      element: NARRATIVE_ELEMENT.ACT,
      id: selectedAct.id,
      direction,
    });
  };

  const handleMoveChapter = (direction: 'up' | 'down') => {
    if (!selectedAct || !selectedChapter) return;
    const index = selectedAct.chapters.findIndex(chapter => chapter.id === selectedChapter.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= selectedAct.chapters.length) return;

    updateAct(selectedAct.id, {
      chapters: moveItem(selectedAct.chapters, index, nextIndex),
    });
    onAction?.({
      type: 'reorder',
      element: NARRATIVE_ELEMENT.CHAPTER,
      id: selectedChapter.id,
      parentId: selectedAct.id,
      direction,
    });
  };

  const handleMovePage = (direction: 'up' | 'down') => {
    if (!selectedAct || !selectedChapter || !selectedPage) return;
    const index = selectedChapter.pages.findIndex(page => page.id === selectedPage.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= selectedChapter.pages.length) return;

    updateChapter(selectedAct.id, selectedChapter.id, {
      pages: moveItem(selectedChapter.pages, index, nextIndex),
    });
    onAction?.({
      type: 'reorder',
      element: NARRATIVE_ELEMENT.PAGE,
      id: selectedPage.id,
      parentId: selectedChapter.id,
      direction,
    });
  };

  const handleMoveStorylet = (direction: 'up' | 'down') => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, template } = selectedStoryletEntry;
    const pool = (selectedChapter.storyletPools ?? []).find(item => item.id === poolId);
    if (!pool) return;
    const index = pool.members.findIndex(item => item.templateId === template.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= pool.members.length) return;

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: (selectedChapter.storyletPools ?? []).map(item =>
        item.id === poolId
          ? { ...item, members: moveItem(item.members, index, nextIndex) }
          : item
      ),
    });
    onAction?.({
      type: 'reorder',
      element: NARRATIVE_ELEMENT.STORYLET,
      id: template.id,
      parentId: poolId,
      direction,
    });
  };

  const storyletPools = selectedChapter?.storyletPools ?? [];
  const selectedPool = selectedStoryletEntry
    ? storyletPools.find(pool => pool.id === selectedStoryletEntry.poolId)
    : undefined;

  const handleStoryletPoolChange = (nextPoolId: string) => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;

    const { poolId, member, template } = selectedStoryletEntry;
    if (poolId === nextPoolId) return;

    const updatedPools = (selectedChapter.storyletPools ?? []).map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          members: pool.members.filter(item => item.templateId !== template.id),
        };
      }
      if (pool.id === nextPoolId) {
        return {
          ...pool,
          members: [...pool.members, member],
        };
      }
      return pool;
    });

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: updatedPools,
    });
    updateSelection({
      ...activeSelection,
      storyletKey: `${nextPoolId}:${template.id}`,
    });
  };

  const handleActUpdate = (updates: Partial<NarrativeAct>) => {
    if (!selectedAct) return;
    const nextId = updates.id ?? selectedAct.id;
    updateAct(selectedAct.id, updates);
    if (updates.id && nextId !== selectedAct.id) {
      updateSelection({
        ...activeSelection,
        actId: nextId,
      });
    }
  };

  const handleChapterUpdate = (updates: Partial<NarrativeChapter>) => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = updates.id ?? selectedChapter.id;
    updateChapter(selectedAct.id, selectedChapter.id, updates);
    if (updates.id && nextId !== selectedChapter.id) {
      updateSelection({
        ...activeSelection,
        chapterId: nextId,
      });
    }
  };

  const handlePageUpdate = (updates: Partial<NarrativePage>) => {
    if (!selectedAct || !selectedChapter || !selectedPage) return;
    const nextId = updates.id ?? selectedPage.id;
    updatePage(selectedAct.id, selectedChapter.id, selectedPage.id, updates);
    if (updates.id && nextId !== selectedPage.id) {
      updateSelection({
        ...activeSelection,
        pageId: nextId,
      });
    }
  };

  const handleStoryletTemplateUpdate = (updates: Partial<StoryletTemplate>) => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, template } = selectedStoryletEntry;
    const nextId = updates.id ?? template.id;
    updateStoryletTemplate(selectedAct.id, selectedChapter.id, template.id, updates);
    if (updates.id && nextId !== template.id) {
      updateSelection({
        ...activeSelection,
        storyletKey: `${poolId}:${nextId}`,
      });
    }
  };

  const handleStoryletMemberUpdate = (updates: Partial<StoryletPoolMember>) => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, template } = selectedStoryletEntry;
    updateStoryletMember(selectedAct.id, selectedChapter.id, poolId, template.id, updates);
  };

  const handleStoryletPoolUpdate = (updates: Partial<StoryletPool>) => {
    if (!selectedAct || !selectedChapter || !selectedPool) return;
    updateStoryletPool(selectedAct.id, selectedChapter.id, selectedPool.id, updates);
  };

  return (
    <div
      className={`bg-[#0b0b14] border border-[#1a1a2e] rounded-xl p-4 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Narrative Structure</p>
          <h2 className="text-lg font-semibold text-white">Story Thread Editor</h2>
        </div>
        <div className="text-xs text-gray-500">
          {thread.acts.length} acts • {selectedChapter?.pages.length ?? 0} pages
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <ActPanel
          acts={thread.acts}
          selectedActId={selectedActId}
          onSelect={actId =>
            updateSelection({
              ...activeSelection,
              actId,
            })
          }
          onAdd={handleAddAct}
          onMove={handleMoveAct}
          onDelete={handleDeleteAct}
          onUpdate={handleActUpdate}
        />

        <ChapterPanel
          chapters={selectedAct?.chapters ?? []}
          selectedChapterId={selectedChapterId}
          onSelect={chapterId =>
            updateSelection({
              ...activeSelection,
              chapterId,
            })
          }
          onAdd={handleAddChapter}
          onMove={handleMoveChapter}
          onDelete={handleDeleteChapter}
          onUpdate={handleChapterUpdate}
        />

        <PagePanel
          pages={selectedChapter?.pages ?? []}
          selectedPageId={selectedPageId}
          onSelect={pageId =>
            updateSelection({
              ...activeSelection,
              pageId,
            })
          }
          onAdd={handleAddPage}
          onMove={handleMovePage}
          onDelete={handleDeletePage}
          onUpdate={handlePageUpdate}
          onUpdateDialogueId={value => {
            if (!selectedAct || !selectedChapter || !selectedPage) return;
            updatePage(selectedAct.id, selectedChapter.id, selectedPage.id, {
              dialogueId: value,
            });
          }}
        />

        <StoryletPanel
          entries={storyletEntries}
          pools={storyletPools}
          selectedKey={selectedStoryletKey}
          selectedPool={selectedPool}
          onSelect={storyletKey =>
            updateSelection({
              ...activeSelection,
              storyletKey,
            })
          }
          onAddPool={handleAddStoryletPool}
          onAddStorylet={handleAddStorylet}
          onMove={handleMoveStorylet}
          onDelete={handleDeleteStorylet}
          onUpdateTemplate={handleStoryletTemplateUpdate}
          onUpdateMember={handleStoryletMemberUpdate}
          onUpdatePool={handleStoryletPoolUpdate}
          onChangePool={handleStoryletPoolChange}
        />
      </div>
    </div>
  );
}
