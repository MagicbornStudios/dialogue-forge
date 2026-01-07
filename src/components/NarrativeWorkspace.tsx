import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CircleDot,
  Download,
  FileText,
  Flag,
  HelpCircle,
  Info,
  LayoutPanelTop,
  ListTree,
  Map,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { DialogueEditorV2 } from './DialogueEditorV2';
import { NarrativeGraphView } from './NarrativeGraphView';
import { PlayView } from './PlayView';
import { FlagManager } from './FlagManager';
import { GuidePanel } from './GuidePanel';
import { YarnView } from './YarnView';
import type { DialogueTree, ViewMode } from '../types';
import type { GameFlagState } from '../types/game-state';
import type { Character } from '../types/characters';
import type { FlagSchema } from '../types/flags';
import {
  NARRATIVE_ELEMENT,
  STORYLET_SELECTION_MODE,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type StoryThread,
  type Storylet,
  type StoryletPool,
} from '../types/narrative';
import { VIEW_MODE } from '../types/constants';
import { exportToYarn } from '../lib/yarn-converter';
import { createNarrativeThreadClient } from '../utils/narrative-client';
import { createUniqueId, moveItem } from '../utils/narrative-editor-utils';
import type { NarrativeSelection } from './NarrativeEditor';

interface NarrativeWorkspaceProps {
  initialThread: StoryThread;
  initialDialogue: DialogueTree;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  gameStateFlags?: GameFlagState;
  className?: string;
  toolbarActions?: React.ReactNode;
}

const getInitialSelection = (thread: StoryThread): NarrativeSelection => ({
  actId: thread.acts[0]?.id,
  chapterId: thread.acts[0]?.chapters[0]?.id,
  pageId: thread.acts[0]?.chapters[0]?.pages[0]?.id,
  storyletKey: undefined,
});

const buildScopedDialogue = (dialogue: DialogueTree, page?: NarrativePage): DialogueTree => {
  if (!page) return dialogue;
  const scopedNodes = page.nodeIds.reduce<Record<string, DialogueTree['nodes'][string]>>(
    (acc, nodeId) => {
      const node = dialogue.nodes[nodeId];
      if (node) {
        acc[nodeId] = node;
      }
      return acc;
    },
    {}
  );
  const fallbackStartNodeId = page.nodeIds.find(nodeId => scopedNodes[nodeId]) ?? '';
  const startNodeId = scopedNodes[dialogue.startNodeId]
    ? dialogue.startNodeId
    : fallbackStartNodeId;

  return {
    ...dialogue,
    nodes: scopedNodes,
    startNodeId,
  };
};

export function NarrativeWorkspace({
  initialThread,
  initialDialogue,
  flagSchema,
  characters,
  gameStateFlags,
  className = '',
  toolbarActions,
}: NarrativeWorkspaceProps) {
  const [thread, setThread] = useState<StoryThread>(initialThread);
  const [dialogueTree, setDialogueTree] = useState<DialogueTree>(initialDialogue);
  const [activeFlagSchema, setActiveFlagSchema] = useState<FlagSchema | undefined>(flagSchema);
  const [selection, setSelection] = useState<NarrativeSelection>(() => getInitialSelection(initialThread));
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showFlagManager, setShowFlagManager] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [narrativeViewMode, setNarrativeViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
  const [dialogueViewMode, setDialogueViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);
  const [showNarrativeMiniMap, setShowNarrativeMiniMap] = useState(true);
  const [showDialogueMiniMap, setShowDialogueMiniMap] = useState(true);
  const [storyletTab, setStoryletTab] = useState<'storylets' | 'pools'>('storylets');
  const [storyletSearch, setStoryletSearch] = useState('');
  const [poolSearch, setPoolSearch] = useState('');
  const [activePoolId, setActivePoolId] = useState<string | undefined>(undefined);
  const [editingStoryletId, setEditingStoryletId] = useState<string | null>(null);
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null);

  const selectedAct = useMemo(
    () => thread.acts.find(act => act.id === selection.actId) ?? thread.acts[0],
    [thread.acts, selection.actId]
  );
  const selectedChapter = useMemo(
    () => selectedAct?.chapters.find(chapter => chapter.id === selection.chapterId)
      ?? selectedAct?.chapters[0],
    [selectedAct, selection.chapterId]
  );
  const selectedPage = useMemo(
    () => selectedChapter?.pages.find(page => page.id === selection.pageId)
      ?? selectedChapter?.pages[0],
    [selectedChapter, selection.pageId]
  );

  const scopedDialogue = useMemo(
    () => buildScopedDialogue(dialogueTree, selectedPage),
    [dialogueTree, selectedPage]
  );

  const storyletEntries = useMemo(() => {
    const pools = selectedChapter?.storyletPools ?? [];
    return pools.flatMap(pool =>
      pool.storylets.map(storylet => ({ poolId: pool.id, storylet }))
    );
  }, [selectedChapter]);

  const selectedStoryletEntry = useMemo(() => {
    if (!selection.storyletKey) return storyletEntries[0];
    return storyletEntries.find(
      entry => `${entry.poolId}:${entry.storylet.id}` === selection.storyletKey
    );
  }, [selection.storyletKey, storyletEntries]);

  const selectedPool = selectedStoryletEntry
    ? (selectedChapter?.storyletPools ?? []).find(pool => pool.id === selectedStoryletEntry.poolId)
    : undefined;
  const activePool = (selectedChapter?.storyletPools ?? []).find(pool => pool.id === activePoolId)
    ?? selectedPool
    ?? selectedChapter?.storyletPools?.[0];

  useEffect(() => {
    if (!selectedChapter) return;
    const pools = selectedChapter.storyletPools ?? [];
    if (!activePoolId && pools[0]) {
      setActivePoolId(pools[0].id);
    }
  }, [activePoolId, selectedChapter]);

  useEffect(() => {
    setActiveFlagSchema(flagSchema);
  }, [flagSchema]);

  const filteredStoryletEntries = useMemo(() => {
    const query = storyletSearch.trim().toLowerCase();
    if (!query) return storyletEntries;
    return storyletEntries.filter(entry => {
      const title = entry.storylet.title ?? entry.storylet.id;
      return title.toLowerCase().includes(query) || entry.storylet.id.toLowerCase().includes(query);
    });
  }, [storyletEntries, storyletSearch]);

  const filteredPools = useMemo(() => {
    const pools = selectedChapter?.storyletPools ?? [];
    const query = poolSearch.trim().toLowerCase();
    if (!query) return pools;
    return pools.filter(pool => {
      const title = pool.title ?? pool.id;
      return title.toLowerCase().includes(query) || pool.id.toLowerCase().includes(query);
    });
  }, [selectedChapter, poolSearch]);

  const handleDialogueChange = useCallback((nextScopedDialogue: DialogueTree) => {
    if (!selectedPage || !selectedAct || !selectedChapter) {
      setDialogueTree(nextScopedDialogue);
      return;
    }

    setDialogueTree(prevDialogue => {
      const updatedNodes = { ...prevDialogue.nodes };
      selectedPage.nodeIds.forEach(nodeId => {
        if (!nextScopedDialogue.nodes[nodeId]) {
          delete updatedNodes[nodeId];
        }
      });
      Object.entries(nextScopedDialogue.nodes).forEach(([nodeId, node]) => {
        updatedNodes[nodeId] = node;
      });

      const fallbackStartNodeId = Object.keys(updatedNodes)[0] ?? '';
      const nextStartNodeId = updatedNodes[prevDialogue.startNodeId]
        ? prevDialogue.startNodeId
        : nextScopedDialogue.startNodeId || fallbackStartNodeId;

      return {
        ...prevDialogue,
        nodes: updatedNodes,
        startNodeId: nextStartNodeId,
      };
    });

    const scopedNodeIds = Object.keys(nextScopedDialogue.nodes);
    const retainedNodeIds = selectedPage.nodeIds.filter(nodeId => nextScopedDialogue.nodes[nodeId]);
    const addedNodeIds = scopedNodeIds.filter(nodeId => !selectedPage.nodeIds.includes(nodeId));
    const nextNodeIds = [...retainedNodeIds, ...addedNodeIds];

    setThread(prevThread =>
      createNarrativeThreadClient(prevThread).updatePage(
        selectedAct.id,
        selectedChapter.id,
        selectedPage.id,
        { nodeIds: nextNodeIds }
      )
    );
  }, [selectedAct, selectedChapter, selectedPage]);

  const handleExportYarn = useCallback((dialogue: DialogueTree) => {
    const yarn = exportToYarn(dialogue);
    const blob = new Blob([yarn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dialogue.title.replace(/\s+/g, '_')}.yarn`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const updateThread = useCallback((nextThread: StoryThread) => {
    setThread({
      ...nextThread,
      type: nextThread.type ?? NARRATIVE_ELEMENT.THREAD,
    });
  }, []);

  const updateChapter = useCallback((
    actId: string,
    chapterId: string,
    updates: Partial<StoryThread['acts'][number]['chapters'][number]>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateChapter(actId, chapterId, updates));
  }, [thread, updateThread]);

  const updateStorylet = useCallback((
    actId: string,
    chapterId: string,
    poolId: string,
    storyletId: string,
    updates: Partial<Storylet>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateStorylet(actId, chapterId, poolId, storyletId, updates));
  }, [thread, updateThread]);

  const updateStoryletPool = useCallback((
    actId: string,
    chapterId: string,
    poolId: string,
    updates: Partial<StoryletPool>
  ) => {
    updateThread(createNarrativeThreadClient(thread).updateStoryletPool(actId, chapterId, poolId, updates));
  }, [thread, updateThread]);

  const handleAddStoryletPool = () => {
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
      storylets: [],
    };

    updateChapter(selectedAct.id, selectedChapter.id, {
      storyletPools: [...existingPools, nextPool],
    });
  };

  const handleAddStorylet = () => {
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
    setSelection(prev => ({
      ...prev,
      storyletKey: `${targetPoolId}:${nextStorylet.id}`,
    }));
    setActivePoolId(targetPoolId);
    setEditingStoryletId(nextStorylet.id);
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
  };

  const handleStoryletUpdate = (entry: { poolId: string; storylet: Storylet }, updates: Partial<Storylet>) => {
    if (!selectedAct || !selectedChapter) return;
    const nextId = updates.id ?? entry.storylet.id;
    updateStorylet(selectedAct.id, selectedChapter.id, entry.poolId, entry.storylet.id, updates);
    if (updates.id && nextId !== entry.storylet.id) {
      setSelection(prev => ({
        ...prev,
        storyletKey: `${entry.poolId}:${nextId}`,
      }));
      if (editingStoryletId === entry.storylet.id) {
        setEditingStoryletId(nextId);
      }
    }
  };

  const handleStoryletPoolUpdate = (poolId: string, updates: Partial<StoryletPool>) => {
    if (!selectedAct || !selectedChapter) return;
    updateStoryletPool(selectedAct.id, selectedChapter.id, poolId, updates);
    if (updates.id && updates.id !== poolId) {
      if (activePoolId === poolId) {
        setActivePoolId(updates.id);
      }
      if (editingPoolId === poolId) {
        setEditingPoolId(updates.id);
      }
    }
  };

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
    setSelection(prev => ({
      ...prev,
      storyletKey: `${nextPoolId}:${storylet.id}`,
    }));
    setActivePoolId(nextPoolId);
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
    setSelection(prev => ({
      ...prev,
      actId: nextAct.id,
      chapterId: nextAct.chapters[0]?.id,
      pageId: nextAct.chapters[0]?.pages[0]?.id,
    }));
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
  };

  const playTitle = selectedPage?.title ?? 'Play Page';
  const playSubtitle = selectedPage?.summary ?? 'Preview the dialogue for this page.';
  const editingStoryletEntry = storyletEntries.find(entry => entry.storylet.id === editingStoryletId) ?? null;
  const editingPool = (selectedChapter?.storyletPools ?? []).find(pool => pool.id === editingPoolId) ?? null;

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <div className="flex items-center justify-between border-b border-df-sidebar-border bg-df-base/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
            onClick={() => setShowPlayModal(true)}
            title="Play selected page"
          >
            <Play size={16} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
            onClick={() => {
              if (activeFlagSchema) {
                setShowFlagManager(true);
              }
            }}
            title="Game state"
          >
            <Flag size={16} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
            onClick={() => setShowGuide(true)}
            title="Open guide"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">{toolbarActions}</div>
      </div>

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
              <CircleDot size={12} />
              Narrative Graph
              <span title="Shows act/chapter/page hierarchy.">
                <Info size={12} />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] text-df-text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <CircleDot size={12} />
                  Act
                </span>
                <select
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-primary"
                  value={selectedAct?.id ?? ''}
                  onChange={event => {
                    const actId = event.target.value;
                    const act = thread.acts.find(item => item.id === actId);
                    setSelection(prev => ({
                      ...prev,
                      actId,
                      chapterId: act?.chapters[0]?.id,
                      pageId: act?.chapters[0]?.pages[0]?.id,
                    }));
                  }}
                  title="Select act"
                >
                  {thread.acts.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.title ?? act.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                  onClick={handleAddAct}
                  title="Add act"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-df-text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <BookOpen size={12} />
                  Chapter
                </span>
                <select
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-primary"
                  value={selectedChapter?.id ?? ''}
                  onChange={event => {
                    const chapterId = event.target.value;
                    const chapter = selectedAct?.chapters.find(item => item.id === chapterId);
                    setSelection(prev => ({
                      ...prev,
                      chapterId,
                      pageId: chapter?.pages[0]?.id,
                    }));
                  }}
                  title="Select chapter"
                >
                  {(selectedAct?.chapters ?? []).map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title ?? chapter.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                  onClick={handleAddChapter}
                  title="Add chapter"
                >
                  <Plus size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-df-text-tertiary">
                <span className="inline-flex items-center gap-1">
                  <LayoutPanelTop size={12} />
                  Page
                </span>
                <select
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-primary"
                  value={selectedPage?.id ?? ''}
                  onChange={event => setSelection(prev => ({ ...prev, pageId: event.target.value }))}
                  title="Select page"
                >
                  {(selectedChapter?.pages ?? []).map(page => (
                    <option key={page.id} value={page.id}>
                      {page.title ?? page.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                  onClick={handleAddPage}
                  title="Add page"
                >
                  <Plus size={12} />
                </button>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setNarrativeViewMode(VIEW_MODE.GRAPH)}
                title="Graph view"
              >
                <ListTree size={12} />
                Graph
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setNarrativeViewMode(VIEW_MODE.YARN)}
                title="Yarn view"
              >
                <FileText size={12} />
                Yarn
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setShowNarrativeMiniMap(prev => !prev)}
                title={showNarrativeMiniMap ? 'Hide minimap' : 'Show minimap'}
              >
                <Map size={12} />
                Mini
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => handleExportYarn(dialogueTree)}
                title="Export yarn"
              >
                <Download size={12} />
                Export
              </button>
            </div>
          </div>
          <div className="h-[220px] min-h-[200px] rounded-lg border border-df-node-border bg-df-editor-bg p-1">
            {narrativeViewMode === VIEW_MODE.GRAPH ? (
              <NarrativeGraphView
                thread={thread}
                className="h-full"
                showMiniMap={showNarrativeMiniMap}
                onSelectElement={(elementType, elementId) => {
                  if (elementType === NARRATIVE_ELEMENT.ACT) {
                    const act = thread.acts.find(item => item.id === elementId);
                    setSelection(prev => ({
                      ...prev,
                      actId: elementId,
                      chapterId: act?.chapters[0]?.id,
                      pageId: act?.chapters[0]?.pages[0]?.id,
                    }));
                  }
                  if (elementType === NARRATIVE_ELEMENT.CHAPTER) {
                    const actForChapter = thread.acts.find(act =>
                      act.chapters.some(item => item.id === elementId)
                    );
                    const chapter = actForChapter?.chapters.find(item => item.id === elementId);
                    setSelection(prev => ({
                      ...prev,
                      actId: actForChapter?.id ?? prev.actId,
                      chapterId: elementId,
                      pageId: chapter?.pages[0]?.id,
                    }));
                  }
                  if (elementType === NARRATIVE_ELEMENT.PAGE) {
                    const actForPage = thread.acts.find(act =>
                      act.chapters.some(chapter => chapter.pages.some(page => page.id === elementId))
                    );
                    const chapterForPage = actForPage?.chapters.find(chapter =>
                      chapter.pages.some(page => page.id === elementId)
                    );
                    setSelection(prev => ({
                      ...prev,
                      actId: actForPage?.id ?? prev.actId,
                      chapterId: chapterForPage?.id ?? prev.chapterId,
                      pageId: elementId,
                    }));
                  }
                }}
              />
            ) : (
              <YarnView dialogue={dialogueTree} onExport={() => handleExportYarn(dialogueTree)} />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
              <LayoutPanelTop size={12} />
              Dialogue Graph
              <span
                title={selectedPage?.title ? `Editing page: ${selectedPage.title}` : 'Editing page scope.'}
              >
                <Info size={12} />
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-df-text-tertiary">
              <span className="inline-flex items-center gap-1 rounded-full border border-df-control-border bg-df-control-bg px-2 py-1">
                {selectedPage?.title ?? 'Page'}
              </span>
              {selectedStoryletEntry && (
                <span className="inline-flex items-center gap-1 rounded-full border border-df-control-border bg-df-control-bg px-2 py-1">
                  Storylet: {selectedStoryletEntry.storylet.title ?? selectedStoryletEntry.storylet.id}
                </span>
              )}
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setDialogueViewMode(VIEW_MODE.GRAPH)}
                title="Graph view"
              >
                <ListTree size={12} />
                Graph
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setDialogueViewMode(VIEW_MODE.YARN)}
                title="Yarn view"
              >
                <FileText size={12} />
                Yarn
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setShowDialogueMiniMap(prev => !prev)}
                title={showDialogueMiniMap ? 'Hide minimap' : 'Show minimap'}
              >
                <Map size={12} />
                Mini
              </button>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                onClick={() => handleExportYarn(scopedDialogue)}
                title="Export yarn"
              >
                <Download size={12} />
                Export
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-1">
            {dialogueViewMode === VIEW_MODE.GRAPH ? (
              <DialogueEditorV2
                dialogue={scopedDialogue}
                onChange={handleDialogueChange}
                flagSchema={activeFlagSchema}
                characters={characters}
                viewMode={VIEW_MODE.GRAPH}
                className="h-full"
                showMiniMap={showDialogueMiniMap}
              />
            ) : (
              <YarnView dialogue={scopedDialogue} onExport={() => handleExportYarn(scopedDialogue)} />
            )}
          </div>
        </div>

        <div className="flex w-[320px] min-w-[280px] flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
              <BookOpen size={12} />
              Storylets
              <span title="Manage storylets and pools for the selected chapter.">
                <Info size={12} />
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                className={`rounded-md px-2 py-1 ${storyletTab === 'storylets' ? 'bg-df-control-active text-df-text-primary' : 'text-df-text-secondary'}`}
                onClick={() => setStoryletTab('storylets')}
                title="Storylets tab"
              >
                Storylets
              </button>
              <button
                type="button"
                className={`rounded-md px-2 py-1 ${storyletTab === 'pools' ? 'bg-df-control-active text-df-text-primary' : 'text-df-text-secondary'}`}
                onClick={() => setStoryletTab('pools')}
                title="Pools tab"
              >
                Pools
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-2">
            {storyletTab === 'storylets' ? (
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-2 top-2.5 text-df-text-tertiary" />
                    <input
                      value={storyletSearch}
                      onChange={event => setStoryletSearch(event.target.value)}
                      placeholder="Search storylets..."
                      className="w-full rounded-md border border-df-control-border bg-df-control-bg py-2 pl-7 pr-2 text-xs text-df-text-primary"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
                    onClick={handleAddStorylet}
                    title="Add storylet"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredStoryletEntries.map(entry => {
                    const isSelected = selection.storyletKey === `${entry.poolId}:${entry.storylet.id}`;
                    return (
                      <button
                        key={entry.storylet.id}
                        type="button"
                        onClick={() => {
                          setSelection(prev => ({ ...prev, storyletKey: `${entry.poolId}:${entry.storylet.id}` }));
                          setActivePoolId(entry.poolId);
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                          isSelected ? 'border-df-node-selected bg-df-control-active/30 text-df-text-primary' : 'border-df-node-border text-df-text-secondary hover:border-df-node-selected'
                        }`}
                        title="Select storylet"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{entry.storylet.title ?? entry.storylet.id}</div>
                          <button
                            type="button"
                            className="text-df-text-tertiary hover:text-df-text-primary"
                            onClick={event => {
                              event.stopPropagation();
                              setEditingStoryletId(entry.storylet.id);
                              setActivePoolId(entry.poolId);
                            }}
                            title="Edit storylet"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                        <div className="text-[10px] text-df-text-tertiary">{entry.storylet.id}</div>
                      </button>
                    );
                  })}
                  {filteredStoryletEntries.length === 0 && (
                    <div className="rounded-lg border border-df-node-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
                      No storylets found.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-2 top-2.5 text-df-text-tertiary" />
                    <input
                      value={poolSearch}
                      onChange={event => setPoolSearch(event.target.value)}
                      placeholder="Search pools..."
                      className="w-full rounded-md border border-df-control-border bg-df-control-bg py-2 pl-7 pr-2 text-xs text-df-text-primary"
                    />
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
                    onClick={handleAddStoryletPool}
                    title="Add pool"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {filteredPools.map(pool => {
                    const isSelected = activePool?.id === pool.id;
                    return (
                      <button
                        key={pool.id}
                        type="button"
                        onClick={() => setActivePoolId(pool.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                          isSelected ? 'border-df-node-selected bg-df-control-active/30 text-df-text-primary' : 'border-df-node-border text-df-text-secondary hover:border-df-node-selected'
                        }`}
                        title="Select pool"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{pool.title ?? pool.id}</div>
                          <button
                            type="button"
                            className="text-df-text-tertiary hover:text-df-text-primary"
                            onClick={event => {
                              event.stopPropagation();
                              setEditingPoolId(pool.id);
                            }}
                            title="Edit pool"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                        <div className="text-[10px] text-df-text-tertiary">{pool.storylets.length} storylets</div>
                      </button>
                    );
                  })}
                  {filteredPools.length === 0 && (
                    <div className="rounded-lg border border-df-node-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
                      No pools found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
            <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Play</div>
                <div className="text-sm font-semibold text-df-text-primary">{playTitle}</div>
                <div className="text-xs text-df-text-secondary">{playSubtitle}</div>
              </div>
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setShowPlayModal(false)}
                title="Close play view"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <PlayView
                dialogue={scopedDialogue}
                startNodeId={scopedDialogue.startNodeId}
                flagSchema={activeFlagSchema}
                gameStateFlags={gameStateFlags}
                narrativeThread={thread}
              />
            </div>
          </div>
        </div>
      )}
      {showFlagManager && activeFlagSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
            <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
              <div className="text-sm font-semibold text-df-text-primary">Game State</div>
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setShowFlagManager(false)}
                title="Close flag manager"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_280px]">
              <div className="min-h-0">
                <FlagManager
                  flagSchema={activeFlagSchema}
                  dialogue={dialogueTree}
                  onUpdate={setActiveFlagSchema}
                  onClose={() => setShowFlagManager(false)}
                />
              </div>
              <div className="border-l border-df-node-border bg-df-base/60 p-4 space-y-4 text-xs text-df-text-secondary">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
                    <CircleDot size={12} />
                    Player
                  </div>
                  <div className="mt-2 rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px] text-df-text-secondary">
                    Player profile settings coming soon.
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
                    <BookOpen size={12} />
                    Characters
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {characters && Object.values(characters).length > 0 ? (
                      Object.values(characters).map(character => (
                        <div
                          key={character.id}
                          className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px]"
                        >
                          <div className="text-df-text-primary font-semibold">{character.name}</div>
                          <div className="text-df-text-tertiary">{character.id}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px] text-df-text-tertiary">
                        No characters loaded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GuidePanel isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {editingStoryletEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
            <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
              <div className="text-sm font-semibold text-df-text-primary">Storylet Details</div>
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setEditingStoryletId(null)}
                title="Close storylet editor"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 p-4 text-xs text-df-text-secondary">
              <label className="flex flex-col gap-1">
                <span>ID</span>
                <input
                  value={editingStoryletEntry.storylet.id}
                  onChange={event =>
                    handleStoryletUpdate(editingStoryletEntry, { id: event.target.value })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Title</span>
                <input
                  value={editingStoryletEntry.storylet.title ?? ''}
                  onChange={event =>
                    handleStoryletUpdate(editingStoryletEntry, { title: event.target.value })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Summary</span>
                <textarea
                  value={editingStoryletEntry.storylet.summary ?? ''}
                  onChange={event =>
                    handleStoryletUpdate(editingStoryletEntry, { summary: event.target.value })
                  }
                  className="min-h-[80px] rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Weight</span>
                <input
                  type="number"
                  value={editingStoryletEntry.storylet.weight ?? 1}
                  onChange={event =>
                    handleStoryletUpdate(editingStoryletEntry, { weight: Number(event.target.value) })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {editingPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
            <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
              <div className="text-sm font-semibold text-df-text-primary">Pool Details</div>
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setEditingPoolId(null)}
                title="Close pool editor"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 p-4 text-xs text-df-text-secondary">
              <label className="flex flex-col gap-1">
                <span>ID</span>
                <input
                  value={editingPool.id}
                  onChange={event =>
                    handleStoryletPoolUpdate(editingPool.id, { id: event.target.value })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Title</span>
                <input
                  value={editingPool.title ?? ''}
                  onChange={event =>
                    handleStoryletPoolUpdate(editingPool.id, { title: event.target.value })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Summary</span>
                <textarea
                  value={editingPool.summary ?? ''}
                  onChange={event =>
                    handleStoryletPoolUpdate(editingPool.id, { summary: event.target.value })
                  }
                  className="min-h-[80px] rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Selection Mode</span>
                <select
                  value={editingPool.selectionMode ?? STORYLET_SELECTION_MODE.WEIGHTED}
                  onChange={event =>
                    handleStoryletPoolUpdate(editingPool.id, {
                      selectionMode: event.target.value as StoryletPool['selectionMode'],
                    })
                  }
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
                >
                  {Object.values(STORYLET_SELECTION_MODE).map(mode => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
