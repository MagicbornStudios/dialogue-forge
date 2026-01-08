import { useMemo } from 'react';
import type { NarrativeSelection } from '../../NarrativeEditor';
import type { StoryThread } from '../../../types/narrative';
import { buildScopedDialogue } from '../utils/narrative-workspace-utils';
import type { DialogueTree } from '../../../types';
import type { NarrativePage } from '../../../types/narrative';

interface UseNarrativeSelectionProps {
  thread: StoryThread;
  dialogueTree: DialogueTree;
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
    () => buildScopedDialogue(dialogueTree, selectedPage, storyletFocusId, dialogueScope),
    [dialogueTree, dialogueScope, selectedPage, storyletFocusId]
  );

  return {
    selectedAct,
    selectedChapter,
    selectedPage,
    scopedDialogue,
  };
}
