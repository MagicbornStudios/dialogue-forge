import { useMemo } from 'react';
import type { NarrativeSelection } from '../../../types/narrative';
import type { StoryThread } from '../../../types/narrative';
import { buildScopedDialogue } from '../utils/narrative-workspace-utils';
import type { DialogueTree } from '../../../types';
import type { NarrativePage } from '../../../types/narrative';

interface UseNarrativeSelectionProps {
  thread: StoryThread | undefined;
  dialogueTree: DialogueTree | undefined;
  selection: NarrativeSelection;
  dialogueScope: 'page' | 'storylet';
  storyletFocusId: string | null;
}

export function useNarrativeSelection({
  thread,
  dialogueTree,
  selection,
  dialogueScope,
  storyletFocusId,
}: UseNarrativeSelectionProps) {
  const selectedAct = useMemo(
    () => {
      if (!thread || !thread.acts || thread.acts.length === 0) return undefined;
      return thread.acts.find(act => act.id === selection.actId) ?? thread.acts[0];
    },
    [thread, selection.actId]
  );

  const selectedChapter = useMemo(
    () => {
      if (!selectedAct || !selectedAct.chapters || selectedAct.chapters.length === 0) return undefined;
      return selectedAct.chapters.find(chapter => chapter.id === selection.chapterId)
        ?? selectedAct.chapters[0];
    },
    [selectedAct, selection.chapterId]
  );

  const selectedPage = useMemo(
    () => {
      if (!selectedChapter || !selectedChapter.pages || selectedChapter.pages.length === 0) return undefined;
      return selectedChapter.pages.find(page => page.id === selection.pageId)
        ?? selectedChapter.pages[0];
    },
    [selectedChapter, selection.pageId]
  );

  const scopedDialogue = useMemo(
    () => {
      if (!dialogueTree) {
        return {
          id: '',
          title: '',
          startNodeId: '',
          nodes: {},
        } as DialogueTree;
      }
      return buildScopedDialogue(dialogueTree, selectedPage, storyletFocusId, dialogueScope);
    },
    [dialogueTree, dialogueScope, selectedPage, storyletFocusId]
  );

  return {
    selectedAct,
    selectedChapter,
    selectedPage,
    scopedDialogue,
  };
}
