import { exportToYarn } from '../../../lib/yarn-converter';
import type { DialogueTree } from '../../../types';
import type { NarrativePage } from '../../../types/narrative';
import type { NarrativeSelection } from '../../../types/narrative';
import type { StoryThread } from '../../../types/narrative';

export function getInitialSelection(thread: StoryThread): NarrativeSelection {
  return {
    actId: thread.acts[0]?.id,
    chapterId: thread.acts[0]?.chapters[0]?.id,
    pageId: thread.acts[0]?.chapters[0]?.pages[0]?.id,
    storyletKey: undefined,
  };
}

export function buildScopedDialogue(
  dialogue: DialogueTree,
  page: NarrativePage | undefined,
  storyletDialogueId: string | null,
  scope: 'page' | 'storylet'
): DialogueTree {
  if (scope === 'storylet') {
    if (!storyletDialogueId) return dialogue;
    if (storyletDialogueId !== dialogue.id) {
      return {
        ...dialogue,
        nodes: {},
        startNodeId: '',
      };
    }
    return dialogue;
  }

  if (!page) return dialogue;
  if (page.dialogueId && page.dialogueId !== dialogue.id) {
    return {
      ...dialogue,
      nodes: {},
      startNodeId: '',
    };
  }
  return dialogue;
}

export function exportDialogueToYarn(dialogue: DialogueTree): void {
  const yarn = exportToYarn(dialogue);
  const blob = new Blob([yarn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dialogue.title.replace(/\s+/g, '_')}.yarn`;
  a.click();
  URL.revokeObjectURL(url);
}
