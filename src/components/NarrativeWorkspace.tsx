import React, { useCallback, useMemo, useState } from 'react';
import { BookOpen, CircleDot, LayoutPanelTop, Play, Settings, X } from 'lucide-react';
import { DialogueEditorV2 } from './DialogueEditorV2';
import { NarrativeEditor, type NarrativeSelection } from './NarrativeEditor';
import { NarrativeGraphView } from './NarrativeGraphView';
import { PlayView } from './PlayView';
import type { DialogueTree } from '../types';
import type { GameFlagState } from '../types/game-state';
import type { Character } from '../types/characters';
import type { FlagSchema } from '../types/flags';
import {
  NARRATIVE_ELEMENT,
  STORYLET_SELECTION_MODE,
  type NarrativePage,
  type StoryThread,
  type Storylet,
  type StoryletPool,
} from '../types/narrative';
import { VIEW_MODE } from '../types/constants';
import { createNarrativeThreadClient } from '../utils/narrative-client';
import { createUniqueId, moveItem } from '../utils/narrative-editor-utils';
import { StoryletPanel } from './narrative-editor';

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
  const [selection, setSelection] = useState<NarrativeSelection>(() => getInitialSelection(initialThread));
  const [showStructureEditor, setShowStructureEditor] = useState(false);
  const [showPlayModal, setShowPlayModal] = useState(false);

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
    let targetPoolId = pools[0]?.id;

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

  const handleStoryletUpdate = (updates: Partial<Storylet>) => {
    if (!selectedAct || !selectedChapter || !selectedStoryletEntry) return;
    const { poolId, storylet } = selectedStoryletEntry;
    const nextId = updates.id ?? storylet.id;
    updateStorylet(selectedAct.id, selectedChapter.id, poolId, storylet.id, updates);
    if (updates.id && nextId !== storylet.id) {
      setSelection(prev => ({
        ...prev,
        storyletKey: `${poolId}:${nextId}`,
      }));
    }
  };

  const handleStoryletPoolUpdate = (updates: Partial<StoryletPool>) => {
    if (!selectedAct || !selectedChapter || !selectedPool) return;
    updateStoryletPool(selectedAct.id, selectedChapter.id, selectedPool.id, updates);
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
  };

  const playTitle = selectedPage?.title ?? 'Play Page';
  const playSubtitle = selectedPage?.summary ?? 'Preview the dialogue for this page.';

  return (
    <div className={`flex h-full w-full flex-col ${className}`}>
      <div className="flex items-center justify-between border-b border-df-sidebar-border bg-df-base/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
            onClick={() => setShowStructureEditor(true)}
            title="Open narrative structure"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
            onClick={() => setShowPlayModal(true)}
            title="Play selected page"
          >
            <Play size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-df-text-tertiary">
          <span className="inline-flex items-center gap-1">
            <CircleDot size={12} />
            {selectedAct?.title ?? 'Act'}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={12} />
            {selectedChapter?.title ?? 'Chapter'}
          </span>
          <span className="inline-flex items-center gap-1">
            <LayoutPanelTop size={12} />
            {selectedPage?.title ?? 'Page'}
          </span>
        </div>
        <div className="flex items-center gap-2">{toolbarActions}</div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
            <CircleDot size={12} />
            Narrative Graph
          </div>
          <div className="h-[220px] min-h-[200px]">
            <NarrativeGraphView thread={thread} className="h-full" />
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
            <LayoutPanelTop size={12} />
            Dialogue Graph
          </div>
          <div className="flex-1 min-h-0">
            <DialogueEditorV2
              dialogue={scopedDialogue}
              onChange={handleDialogueChange}
              flagSchema={flagSchema}
              characters={characters}
              viewMode={VIEW_MODE.GRAPH}
              className="h-full"
            />
          </div>
        </div>

        <div className="flex w-[320px] min-w-[280px] flex-col gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
            <BookOpen size={12} />
            Storylets
          </div>
          <div className="flex-1 min-h-0">
            <StoryletPanel
              entries={storyletEntries}
              pools={selectedChapter?.storyletPools ?? []}
              selectedKey={selection.storyletKey}
              selectedPool={selectedPool}
              onSelect={storyletKey =>
                setSelection(prev => ({
                  ...prev,
                  storyletKey,
                }))
              }
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
      </div>

      {showStructureEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
            <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
              <div className="text-sm font-semibold text-df-text-primary">Narrative Structure</div>
              <button
                type="button"
                className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
                onClick={() => setShowStructureEditor(false)}
                title="Close narrative structure"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              <NarrativeEditor
                thread={thread}
                onChange={setThread}
                selection={selection}
                onSelectionChange={setSelection}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

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
                flagSchema={flagSchema}
                gameStateFlags={gameStateFlags}
                narrativeThread={thread}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
