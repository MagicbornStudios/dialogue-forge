/**
 * Writer Workspace Actions
 * 
 * Workspace-level CopilotKit actions that operate on the Writer workspace store.
 * These actions manage domain state (pages, drafts, navigation).
 */

import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { WRITER_SAVE_STATUS } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import { getPlainTextFromSerializedContent } from '@/writer/components/WriterWorkspace/store/writer-workspace-types';
import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';
import { WRITER_ACTION_NAME } from '@/writer/copilotkit/constants/writer-action-names';

/**
 * Create proposeTextEdit action
 */
export function createProposeTextEditAction(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.WORKSPACE.PROPOSE_TEXT_EDIT,
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
  };
}

/**
 * Create getCurrentPage action
 */
export function createGetCurrentPageAction(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.WORKSPACE.GET_CURRENT_PAGE,
    description: 'Get information about the current page being edited',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      const page = state.pages.find((p) => p.id === state.activePageId);
      if (!page) {
        return { error: 'No page selected' };
      }
      const draft = state.drafts[page.id];
      const plainText = draft?.content.plainText ?? getPlainTextFromSerializedContent(page.bookBody);
      return {
        title: page.title,
        content: plainText,
        hasUnsavedChanges: draft?.status === WRITER_SAVE_STATUS.DIRTY,
      };
    },
  };
}

/**
 * Create listPages action
 */
export function createListPagesAction(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.WORKSPACE.LIST_PAGES,
    description: 'List all available pages in the current project',
    parameters: [],
    handler: async () => {
      const state = workspaceStore.getState();
      return {
        pages: state.pages.map((p) => ({
          id: p.id,
          title: p.title,
          isActive: p.id === state.activePageId,
        })),
      };
    },
  };
}

/**
 * Create switchPage action
 */
export function createSwitchPageAction(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.WORKSPACE.SWITCH_PAGE,
    description: 'Switch to a different page in the writer workspace',
    parameters: [
      {
        name: 'pageId',
        type: 'number',
        description: 'The ID of the page to switch to',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const pageId = args.pageId as number;
      if (typeof pageId !== 'number') {
        throw new Error('pageId must be a number');
      }

      const state = workspaceStore.getState();
      const page = state.pages.find((p) => p.id === pageId);
      if (!page) {
        throw new Error(`Page with ID ${pageId} not found`);
      }

      state.actions.setActivePageId(pageId);
      return { success: true, message: `Switched to page: ${page.title}`, pageId };
    },
  };
}

/**
 * Create all workspace actions
 */
export function createWriterWorkspaceActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]>[] {
  return [
    createProposeTextEditAction(workspaceStore),
    createGetCurrentPageAction(workspaceStore),
    createListPagesAction(workspaceStore),
    createSwitchPageAction(workspaceStore),
  ];
}
