import { useCopilotAction } from '@copilotkit/react-core';
import type { Parameter } from '@copilotkit/shared';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

export function useCopilotKitActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  // Register proposeTextEdit action
  useCopilotAction({
    name: 'proposeTextEdit',
    description: 'Propose edits to selected text in the writer. The AI will suggest improvements or changes based on the instruction.',
    parameters: [
      {
        name: 'instruction',
        type: 'string',
        description: 'What changes to make to the text (e.g., "make it more concise", "improve clarity", "fix grammar")',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const instruction = args.instruction as string;
      if (!instruction) {
        throw new Error('Instruction is required');
      }
      const state = workspaceStore.getState();
      if (!state.aiSelection) {
        throw new Error('No text selected. Please select text first.');
      }
      await state.actions.proposeAiEdits(instruction);
      return { success: true, message: 'Edit proposal generated. Check the preview panel.' };
    },
  });

  // Register getCurrentPage action
  useCopilotAction({
    name: 'getCurrentPage',
    description: 'Get information about the current page being edited',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const page = state.pages.find(p => p.id === state.activePageId);
      if (!page) {
        return { error: 'No page selected' };
      }
      const draft = state.drafts[page.id];
      return {
        title: page.title,
        content: draft?.content ?? page.bookBody ?? '',
        hasUnsavedChanges: draft?.status === 'dirty',
      };
    },
  });

  // Register listPages action
  useCopilotAction({
    name: 'listPages',
    description: 'List all available pages in the current project',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      return {
        pages: state.pages.map(p => ({
          id: p.id,
          title: p.title,
          isActive: p.id === state.activePageId,
        })),
      };
    },
  });
}
