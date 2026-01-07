import React, { useEffect, useMemo, useState } from 'react';
import {
  NARRATIVE_ELEMENT,
  STORYLET_SELECTION_MODE,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativeElement,
  type NarrativePage,
  type StoryThread,
  type Storylet,
  type StoryletPool,
} from '../types/narrative';
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
  className?: string;
}

interface StoryletEntry {
  poolId: string;
  storylet: Storylet;
}

const DEFAULT_POOL_TITLE = 'Storylet Pool';

function createUniqueId(existingIds: string[], prefix: string): string {
  let index = Math.max(existingIds.length, 0) + 1;
  let nextId = `${prefix}-${index}`;
  while (existingIds.includes(nextId)) {
    index += 1;
    nextId = `${prefix}-${index}`;
  }
  return nextId;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function parseDelimitedList(input: string): string[] {
  return input
    .split(/\s*,\s*|\n/g)
    .map(value => value.trim())
    .filter(Boolean);
}

export function NarrativeEditor({ thread, onChange, onAction, className = '' }: NarrativeEditorProps) {
  const [selectedActId, setSelectedActId] = useState<string | undefined>(
    thread.acts[0]?.id
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(
    thread.acts[0]?.chapters[0]?.id
  );
  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(
    thread.acts[0]?.chapters[0]?.pages[0]?.id
  );
  const [selectedStoryletKey, setSelectedStoryletKey] = useState<string | undefined>();

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
    return pools.flatMap(pool =>
      pool.storylets.map(storylet => ({ poolId: pool.id, storylet }))
    );
  }, [selectedChapter]);

  const selectedStoryletEntry = useMemo(() => {
    if (!selectedStoryletKey) return storyletEntries[0];
    return storyletEntries.find(
      entry => `${entry.poolId}:${entry.storylet.id}` === selectedStoryletKey
    );
  }, [selectedStoryletKey, storyletEntries]);

  useEffect(() => {
    const nextAct = selectedAct ?? thread.acts[0];
    if (nextAct?.id !== selectedActId) {
      setSelectedActId(nextAct?.id);
    }

    const nextChapter = nextAct?.chapters.find(chapter => chapter.id === selectedChapterId)
      ?? nextAct?.chapters[0];
    if (nextChapter?.id !== selectedChapterId) {
      setSelectedChapterId(nextChapter?.id);
    }

    const nextPage = nextChapter?.pages.find(page => page.id === selectedPageId)
      ?? nextChapter?.pages[0];
    if (nextPage?.id !== selectedPageId) {
      setSelectedPageId(nextPage?.id);
    }

    const nextStoryletKey = selectedStoryletEntry
      ? `${selectedStoryletEntry.poolId}:${selectedStoryletEntry.storylet.id}`
      : storyletEntries[0]
        ? `${storyletEntries[0].poolId}:${storyletEntries[0].storylet.id}`
        : undefined;

    if (nextStoryletKey !== selectedStoryletKey) {
      setSelectedStoryletKey(nextStoryletKey);
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
    updateThread({
      ...thread,
      acts: thread.acts.map(act =>
        act.id === actId
          ? { ...act, ...updates, type: act.type ?? NARRATIVE_ELEMENT.ACT }
          : act
      ),
    });
  };

  const updateChapter = (
    actId: string,
    chapterId: string,
    updates: Partial<NarrativeChapter>
  ) => {
    updateThread({
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
  };

  const updatePage = (
    actId: string,
    chapterId: string,
    pageId: string,
    updates: Partial<NarrativePage>
  ) => {
    updateThread({
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
  };

  const updateStorylet = (
    actId: string,
    chapterId: string,
    poolId: string,
    storyletId: string,
    updates: Partial<Storylet>
  ) => {
    updateThread({
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
                              storylets: pool.storylets.map(storylet =>
                                storylet.id === storyletId
                                  ? { ...storylet, ...updates, type: storylet.type ?? NARRATIVE_ELEMENT.STORYLET }
                                  : storylet
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
  };

  const updateStoryletPool = (
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => {
    updateThread({
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
    setSelectedActId(nextAct.id);
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
      storyletPools: [],
      type: NARRATIVE_ELEMENT.CHAPTER,
    };

    updateAct(selectedAct.id, {
      chapters: [...selectedAct.chapters, nextChapter],
    });
    setSelectedChapterId(nextChapter.id);
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
      nodeIds: [],
      type: NARRATIVE_ELEMENT.PAGE,
    };

    updateChapter(selectedAct.id, selectedChapter.id, {
      pages: [...selectedChapter.pages, nextPage],
    });
    setSelectedPageId(nextPage.id);
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
      storylets: [],
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
            storylets: [],
          },
        ],
      });
    }

    const currentStoryletIds = pools.flatMap(pool => pool.storylets.map(storylet => storylet.id));
    const nextId = createUniqueId(currentStoryletIds, 'storylet');
    const nextStorylet: Storylet = {
      id: nextId,
      title: 'New Storylet',
      summary: '',
      weight: 1,
      type: NARRATIVE_ELEMENT.STORYLET,
    };

    const updatedPools = (selectedChapter.storyletPools ?? []).map(pool =>
      pool.id === targetPoolId
        ? { ...pool, storylets: [...pool.storylets, nextStorylet] }
        : pool
    );

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: updatedPools,
    });
    setSelectedStoryletKey(`${targetPoolId}:${nextStorylet.id}`);
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
    const { poolId, storylet } = selectedStoryletEntry;
    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: (selectedChapter.storyletPools ?? []).map(pool =>
        pool.id === poolId
          ? { ...pool, storylets: pool.storylets.filter(item => item.id !== storylet.id) }
          : pool
      ),
    });
    onAction?.({
      type: 'delete',
      element: NARRATIVE_ELEMENT.STORYLET,
      id: storylet.id,
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
    const { poolId, storylet } = selectedStoryletEntry;
    const pool = (selectedChapter.storyletPools ?? []).find(item => item.id === poolId);
    if (!pool) return;
    const index = pool.storylets.findIndex(item => item.id === storylet.id);
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= pool.storylets.length) return;

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: (selectedChapter.storyletPools ?? []).map(item =>
        item.id === poolId
          ? { ...item, storylets: moveItem(item.storylets, index, nextIndex) }
          : item
      ),
    });
    onAction?.({
      type: 'reorder',
      element: NARRATIVE_ELEMENT.STORYLET,
      id: storylet.id,
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

    const { poolId, storylet } = selectedStoryletEntry;
    if (poolId === nextPoolId) return;

    const updatedPools = (selectedChapter.storyletPools ?? []).map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          storylets: pool.storylets.filter(item => item.id !== storylet.id),
        };
      }
      if (pool.id === nextPoolId) {
        return {
          ...pool,
          storylets: [...pool.storylets, storylet],
        };
      }
      return pool;
    });

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: updatedPools,
    });
    setSelectedStoryletKey(`${nextPoolId}:${storylet.id}`);
  };

  const handleActUpdate = (updates: Partial<NarrativeAct>) => {
    if (!selectedAct) return;
    const nextId = updates.id ?? selectedAct.id;
    updateAct(selectedAct.id, updates);
    if (updates.id && nextId !== selectedAct.id) {
      setSelectedActId(nextId);
    }
  };

  const handleChapterUpdate = (updates: Partial<NarrativeChapter>) => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = updates.id ?? selectedChapter.id;
    updateChapter(selectedAct.id, selectedChapter.id, updates);
    if (updates.id && nextId !== selectedChapter.id) {
      setSelectedChapterId(nextId);
    }
  };

  const handlePageUpdate = (updates: Partial<NarrativePage>) => {
    if (!selectedAct || !selectedChapter || !selectedPage) return;
    const nextId = updates.id ?? selectedPage.id;
    updatePage(selectedAct.id, selectedChapter.id, selectedPage.id, updates);
    if (updates.id && nextId !== selectedPage.id) {
      setSelectedPageId(nextId);
    }
  };

  const handleStoryletUpdate = (updates: Partial<Storylet>) => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, storylet } = selectedStoryletEntry;
    const nextId = updates.id ?? storylet.id;
    updateStorylet(selectedAct.id, selectedChapter.id, poolId, storylet.id, updates);
    if (updates.id && nextId !== storylet.id) {
      setSelectedStoryletKey(`${poolId}:${nextId}`);
    }
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
          onSelect={setSelectedActId}
          onAdd={handleAddAct}
          onMove={handleMoveAct}
          onDelete={handleDeleteAct}
          onUpdate={handleActUpdate}
        />

        <ChapterPanel
          chapters={selectedAct?.chapters ?? []}
          selectedChapterId={selectedChapterId}
          onSelect={setSelectedChapterId}
          onAdd={handleAddChapter}
          onMove={handleMoveChapter}
          onDelete={handleDeleteChapter}
          onUpdate={handleChapterUpdate}
        />

        <PagePanel
          pages={selectedChapter?.pages ?? []}
          selectedPageId={selectedPageId}
          onSelect={setSelectedPageId}
          onAdd={handleAddPage}
          onMove={handleMovePage}
          onDelete={handleDeletePage}
          onUpdate={handlePageUpdate}
          onUpdateNodeIds={value => {
            if (!selectedAct || !selectedChapter || !selectedPage) return;
            updatePage(selectedAct.id, selectedChapter.id, selectedPage.id, {
              nodeIds: parseDelimitedList(value),
            });
          }}
        />

        <StoryletPanel
          entries={storyletEntries}
          pools={storyletPools}
          selectedKey={selectedStoryletKey}
          selectedPool={selectedPool}
          onSelect={setSelectedStoryletKey}
          onAddPool={handleAddStoryletPool}
          onAddStorylet={handleAddStorylet}
          onMove={handleMoveStorylet}
          onDelete={handleDeleteStorylet}
          onUpdateStorylet={handleStoryletUpdate}
          onUpdatePool={handleStoryletPoolUpdate}
          onChangePool={handleStoryletPoolChange}
        />
      </div>
    </div>
  );
}
