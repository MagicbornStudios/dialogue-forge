import React, { useCallback, useMemo, useState } from 'react';
import { DialogueEditorV2 } from './DialogueEditorV2';
import { NarrativeEditor, type NarrativeSelection } from './NarrativeEditor';
import { NarrativeGraphView } from './NarrativeGraphView';
import { PlayView } from './PlayView';
import type { DialogueTree } from '../types';
import type { GameFlagState } from '../types/game-state';
import type { Character } from '../types/characters';
import type { FlagSchema } from '../types/flags';
import type { NarrativePage, StoryThread } from '../types/narrative';
import { VIEW_MODE } from '../types/constants';
import { createNarrativeThreadClient } from '../utils/narrative-client';

interface NarrativeWorkspaceProps {
  initialThread: StoryThread;
  initialDialogue: DialogueTree;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
  gameStateFlags?: GameFlagState;
  className?: string;
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
}: NarrativeWorkspaceProps) {
  const [thread, setThread] = useState<StoryThread>(initialThread);
  const [dialogueTree, setDialogueTree] = useState<DialogueTree>(initialDialogue);
  const [selection, setSelection] = useState<NarrativeSelection>(() => getInitialSelection(initialThread));

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

  const playTitle = selectedPage?.title ?? 'Play Page';
  const playSubtitle = selectedPage?.summary ?? 'Preview the dialogue for this page.';

  return (
    <div className={`flex h-full w-full gap-4 p-4 ${className}`}>
      <div className="flex w-[320px] min-w-[280px] flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-df-sidebar-border bg-df-sidebar-bg px-4 py-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Narrative</div>
            <div className="text-sm font-semibold text-df-text-primary">Acts • Chapters • Pages</div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <NarrativeEditor
            thread={thread}
            onChange={setThread}
            selection={selection}
            onSelectionChange={setSelection}
            className="h-full"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-df-editor-border bg-df-editor-bg px-4 py-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Dialogue</div>
            <div className="text-sm font-semibold text-df-text-primary">Page Editing & Narrative Context</div>
          </div>
        </div>
        <div className="h-[240px] min-h-[200px]">
          <NarrativeGraphView thread={thread} className="h-full" />
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

      <div className="flex w-[360px] min-w-[300px] flex-col gap-4">
        <div className="rounded-xl border border-df-editor-border bg-df-editor-bg px-4 py-2">
          <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Play</div>
          <div className="text-sm font-semibold text-df-text-primary">{playTitle}</div>
          <div className="text-xs text-df-text-secondary">{playSubtitle}</div>
        </div>
        <div className="flex-1 min-h-0 rounded-xl border border-df-editor-border bg-df-editor-bg">
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
  );
}
