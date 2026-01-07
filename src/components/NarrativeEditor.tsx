import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
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
        <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Acts</p>
              <h3 className="text-sm font-semibold text-white">Acts</h3>
            </div>
            <button
              type="button"
              onClick={handleAddAct}
              className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
              title="Add Act"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {thread.acts.map((act, index) => (
              <div
                key={act.id}
                className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
                  act.id === selectedActId
                    ? 'border-[#e94560] bg-[#1a1a2a]'
                    : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedActId(act.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm text-white font-medium truncate">
                    {act.title || `Act ${index + 1}`}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono truncate">{act.id}</div>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveAct('up')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move act up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveAct('down')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move act down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
            {thread.acts.length === 0 && (
              <p className="text-xs text-gray-500">No acts yet. Add your first act.</p>
            )}
          </div>
          <div className="border-t border-[#1f1f2e] p-3 space-y-2">
            {selectedAct ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Act Details</span>
                  <button
                    type="button"
                    onClick={handleDeleteAct}
                    className="text-gray-500 hover:text-[#e94560]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="text-[10px] text-gray-500 uppercase">ID</label>
                <input
                  value={selectedAct.id}
                  onChange={event => {
                    const nextId = event.target.value;
                    updateAct(selectedAct.id, { id: nextId });
                    setSelectedActId(nextId);
                  }}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Title</label>
                <input
                  value={selectedAct.title ?? ''}
                  onChange={event => updateAct(selectedAct.id, { title: event.target.value })}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Summary</label>
                <textarea
                  value={selectedAct.summary ?? ''}
                  onChange={event => updateAct(selectedAct.id, { summary: event.target.value })}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
                />
              </>
            ) : (
              <p className="text-xs text-gray-500">Select an act to edit details.</p>
            )}
          </div>
        </section>

        <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Chapters</p>
              <h3 className="text-sm font-semibold text-white">Chapters</h3>
            </div>
            <button
              type="button"
              onClick={handleAddChapter}
              className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
              title="Add Chapter"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(selectedAct?.chapters ?? []).map((chapter, index) => (
              <div
                key={chapter.id}
                className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
                  chapter.id === selectedChapterId
                    ? 'border-[#e94560] bg-[#1a1a2a]'
                    : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm text-white font-medium truncate">
                    {chapter.title || `Chapter ${index + 1}`}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono truncate">{chapter.id}</div>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveChapter('up')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move chapter up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveChapter('down')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move chapter down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
            {(selectedAct?.chapters.length ?? 0) === 0 && (
              <p className="text-xs text-gray-500">Select an act and add chapters.</p>
            )}
          </div>
          <div className="border-t border-[#1f1f2e] p-3 space-y-2">
            {selectedChapter ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Chapter Details</span>
                  <button
                    type="button"
                    onClick={handleDeleteChapter}
                    className="text-gray-500 hover:text-[#e94560]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="text-[10px] text-gray-500 uppercase">ID</label>
                <input
                  value={selectedChapter.id}
                  onChange={event => {
                    const nextId = event.target.value;
                    updateChapter(selectedAct?.id ?? '', selectedChapter.id, { id: nextId });
                    setSelectedChapterId(nextId);
                  }}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Title</label>
                <input
                  value={selectedChapter.title ?? ''}
                  onChange={event =>
                    updateChapter(selectedAct?.id ?? '', selectedChapter.id, {
                      title: event.target.value,
                    })
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Summary</label>
                <textarea
                  value={selectedChapter.summary ?? ''}
                  onChange={event =>
                    updateChapter(selectedAct?.id ?? '', selectedChapter.id, {
                      summary: event.target.value,
                    })
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
                />
              </>
            ) : (
              <p className="text-xs text-gray-500">Select a chapter to edit details.</p>
            )}
          </div>
        </section>

        <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Pages</p>
              <h3 className="text-sm font-semibold text-white">Pages</h3>
            </div>
            <button
              type="button"
              onClick={handleAddPage}
              className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
              title="Add Page"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(selectedChapter?.pages ?? []).map((page, index) => (
              <div
                key={page.id}
                className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
                  page.id === selectedPageId
                    ? 'border-[#e94560] bg-[#1a1a2a]'
                    : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm text-white font-medium truncate">
                    {page.title || `Page ${index + 1}`}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono truncate">{page.id}</div>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMovePage('up')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move page up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePage('down')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move page down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
            {(selectedChapter?.pages.length ?? 0) === 0 && (
              <p className="text-xs text-gray-500">Select a chapter and add pages.</p>
            )}
          </div>
          <div className="border-t border-[#1f1f2e] p-3 space-y-2">
            {selectedPage ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Page Details</span>
                  <button
                    type="button"
                    onClick={handleDeletePage}
                    className="text-gray-500 hover:text-[#e94560]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="text-[10px] text-gray-500 uppercase">ID</label>
                <input
                  value={selectedPage.id}
                  onChange={event => {
                    const nextId = event.target.value;
                    updatePage(selectedAct?.id ?? '', selectedChapter?.id ?? '', selectedPage.id, {
                      id: nextId,
                    });
                    setSelectedPageId(nextId);
                  }}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Title</label>
                <input
                  value={selectedPage.title ?? ''}
                  onChange={event =>
                    updatePage(selectedAct?.id ?? '', selectedChapter?.id ?? '', selectedPage.id, {
                      title: event.target.value,
                    })
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Summary</label>
                <textarea
                  value={selectedPage.summary ?? ''}
                  onChange={event =>
                    updatePage(selectedAct?.id ?? '', selectedChapter?.id ?? '', selectedPage.id, {
                      summary: event.target.value,
                    })
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
                />
                <label className="text-[10px] text-gray-500 uppercase">Node IDs</label>
                <textarea
                  value={selectedPage.nodeIds.join(', ')}
                  onChange={event =>
                    updatePage(selectedAct?.id ?? '', selectedChapter?.id ?? '', selectedPage.id, {
                      nodeIds: parseDelimitedList(event.target.value),
                    })
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
                />
              </>
            ) : (
              <p className="text-xs text-gray-500">Select a page to edit details.</p>
            )}
          </div>
        </section>

        <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Storylets</p>
              <h3 className="text-sm font-semibold text-white">Storylets</h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddStoryletPool}
                className="px-2 py-1 bg-[#1a1a2a] hover:bg-[#242438] text-xs text-gray-200 rounded"
              >
                New Pool
              </button>
              <button
                type="button"
                onClick={handleAddStorylet}
                className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
                title="Add Storylet"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {storyletEntries.map((entry, index) => (
              <div
                key={`${entry.poolId}-${entry.storylet.id}`}
                className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
                  selectedStoryletKey === `${entry.poolId}:${entry.storylet.id}`
                    ? 'border-[#e94560] bg-[#1a1a2a]'
                    : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedStoryletKey(`${entry.poolId}:${entry.storylet.id}`)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm text-white font-medium truncate">
                    {entry.storylet.title || `Storylet ${index + 1}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono truncate">
                      {entry.storylet.id}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0f0f18] border border-[#2a2a3e] text-gray-400">
                      {entry.poolId}
                    </span>
                  </div>
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveStorylet('up')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move storylet up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveStorylet('down')}
                    className="text-gray-500 hover:text-white"
                    aria-label="Move storylet down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
            {storyletEntries.length === 0 && (
              <p className="text-xs text-gray-500">Add storylet pools and storylets.</p>
            )}
          </div>
          <div className="border-t border-[#1f1f2e] p-3 space-y-2">
            {selectedStoryletEntry ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Storylet Details</span>
                  <button
                    type="button"
                    onClick={handleDeleteStorylet}
                    className="text-gray-500 hover:text-[#e94560]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <label className="text-[10px] text-gray-500 uppercase">ID</label>
                <input
                  value={selectedStoryletEntry.storylet.id}
                  onChange={event => {
                    const nextId = event.target.value;
                    updateStorylet(
                      selectedAct?.id ?? '',
                      selectedChapter?.id ?? '',
                      selectedStoryletEntry.poolId,
                      selectedStoryletEntry.storylet.id,
                      { id: nextId }
                    );
                    setSelectedStoryletKey(`${selectedStoryletEntry.poolId}:${nextId}`);
                  }}
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Title</label>
                <input
                  value={selectedStoryletEntry.storylet.title ?? ''}
                  onChange={event =>
                    updateStorylet(
                      selectedAct?.id ?? '',
                      selectedChapter?.id ?? '',
                      selectedStoryletEntry.poolId,
                      selectedStoryletEntry.storylet.id,
                      { title: event.target.value }
                    )
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Summary</label>
                <textarea
                  value={selectedStoryletEntry.storylet.summary ?? ''}
                  onChange={event =>
                    updateStorylet(
                      selectedAct?.id ?? '',
                      selectedChapter?.id ?? '',
                      selectedStoryletEntry.poolId,
                      selectedStoryletEntry.storylet.id,
                      { summary: event.target.value }
                    )
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
                />
                <label className="text-[10px] text-gray-500 uppercase">Weight</label>
                <input
                  type="number"
                  value={selectedStoryletEntry.storylet.weight ?? 1}
                  onChange={event =>
                    updateStorylet(
                      selectedAct?.id ?? '',
                      selectedChapter?.id ?? '',
                      selectedStoryletEntry.poolId,
                      selectedStoryletEntry.storylet.id,
                      { weight: Number(event.target.value) }
                    )
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />
                <label className="text-[10px] text-gray-500 uppercase">Next Node ID</label>
                <input
                  value={selectedStoryletEntry.storylet.nextNodeId ?? ''}
                  onChange={event =>
                    updateStorylet(
                      selectedAct?.id ?? '',
                      selectedChapter?.id ?? '',
                      selectedStoryletEntry.poolId,
                      selectedStoryletEntry.storylet.id,
                      { nextNodeId: event.target.value }
                    )
                  }
                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                />

                <div className="pt-2 border-t border-[#1f1f2e] space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase">Storylet Pool</span>
                  <select
                    value={selectedStoryletEntry.poolId}
                    onChange={event => handleStoryletPoolChange(event.target.value)}
                    className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                  >
                    {storyletPools.map(pool => (
                      <option key={pool.id} value={pool.id}>
                        {pool.title || pool.id}
                      </option>
                    ))}
                  </select>
                  {selectedPool && (
                    <>
                      <label className="text-[10px] text-gray-500 uppercase">Pool Title</label>
                      <input
                        value={selectedPool.title ?? ''}
                        onChange={event =>
                          updateStoryletPool(
                            selectedAct?.id ?? '',
                            selectedChapter?.id ?? '',
                            selectedPool.id,
                            { title: event.target.value }
                          )
                        }
                        className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                      />
                      <label className="text-[10px] text-gray-500 uppercase">Selection Mode</label>
                      <select
                        value={selectedPool.selectionMode ?? STORYLET_SELECTION_MODE.WEIGHTED}
                        onChange={event =>
                          updateStoryletPool(
                            selectedAct?.id ?? '',
                            selectedChapter?.id ?? '',
                            selectedPool.id,
                            { selectionMode: event.target.value as StoryletPool['selectionMode'] }
                          )
                        }
                        className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                      >
                        <option value={STORYLET_SELECTION_MODE.WEIGHTED}>Weighted</option>
                        <option value={STORYLET_SELECTION_MODE.SEQUENTIAL}>Sequential</option>
                        <option value={STORYLET_SELECTION_MODE.RANDOM}>Random</option>
                      </select>
                      <label className="text-[10px] text-gray-500 uppercase">Fallback Node ID</label>
                      <input
                        value={selectedPool.fallbackNodeId ?? ''}
                        onChange={event =>
                          updateStoryletPool(
                            selectedAct?.id ?? '',
                            selectedChapter?.id ?? '',
                            selectedPool.id,
                            { fallbackNodeId: event.target.value }
                          )
                        }
                        className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                      />
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Select a storylet to edit details.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
