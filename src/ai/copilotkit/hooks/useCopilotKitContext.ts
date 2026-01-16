import { useStore } from 'zustand';
import { useCopilotReadable } from '@copilotkit/react-core';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

export function useCopilotKitContext(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  const state = useStore(workspaceStore);
  
  // Provide workspace context to CopilotKit
  useCopilotReadable({
    description: 'Writer workspace state',
    value: `Writer Workspace Context:
- Active Page: ${state.activePageId ? state.pages.find(p => p.id === state.activePageId)?.title ?? 'None' : 'None'}
- Total Pages: ${state.pages.length}
- Selected Text: ${state.aiSelection ? 'Yes' : 'No'}
${state.aiSelection ? `- Selection Range: ${state.aiSelection.start}-${state.aiSelection.end}` : ''}
- Draft Status: ${state.activePageId ? (state.drafts[state.activePageId]?.status ?? 'N/A') : 'N/A'}

Available Actions:
- proposeTextEdit: Propose edits to selected text
- getCurrentPage: Get information about current page
- listPages: List all available pages
    `,
  });
}
