/**
 * Hook to provide Writer workspace context to CopilotKit
 * Makes pages and narrative structure available to the AI (no draft state).
 */

import { useStore } from 'zustand';
import { useCopilotReadable } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@magicborn/writer/components/WriterWorkspace/store/writer-workspace-store';

export function useWriterCopilotContext(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  const state = useStore(workspaceStore);

  // Provide workspace context to CopilotKit
  useCopilotReadable({
    description: 'Writer workspace state',
    value: useMemo(() => {
      const activePage = state.activePageId ? state.pages.find(p => p.id === state.activePageId) : null;
      
      let context = `Writer Workspace Context:
- Active Page: ${activePage ? `${activePage.title} (ID: ${activePage.id})` : 'None'}
- Total Pages: ${state.pages.length}
- Selected Text: ${state.aiSelection ? 'Yes' : 'No'}
${state.aiSelection ? `- Selection Range: ${state.aiSelection.start}-${state.aiSelection.end}` : ''}
- Narrative Graph: ${state.narrativeGraph ? `${state.narrativeGraph.title} (ID: ${state.narrativeGraph.id})` : 'None'}
- Available Narrative Graphs: ${state.narrativeGraphs.length}
`;

      if (state.pages.length > 0) {
        context += `\nPages:
${state.pages.map(p => `  - ${p.title} (ID: ${p.id})`).join('\n')}
`;
      }

      if (state.narrativeHierarchy) {
        const totalChapters = state.narrativeHierarchy.acts.reduce((sum, act) => sum + act.chapters.length, 0);
        const totalPages = state.narrativeHierarchy.acts.reduce((sum, act) => 
          sum + act.chapters.reduce((chSum, ch) => chSum + ch.pages.length, 0), 0);
        
        context += `\nNarrative Structure:
- Acts: ${state.narrativeHierarchy.acts.length}
${state.narrativeHierarchy.acts.map(act => {
          const chaptersList = act.chapters.map(ch => `    - ${ch.page.title} (ID: ${ch.page.id}) [${ch.pages.length} pages]`).join('\n');
          return `  - ${act.page.title} (ID: ${act.page.id}) [${act.chapters.length} chapters]${chaptersList ? '\n' + chaptersList : ''}`;
        }).join('\n')}
- Total Chapters: ${totalChapters}
- Total Content Pages: ${totalPages}
`;
      }

      context += `\nAvailable Actions:
- proposeTextEdit: Propose edits to selected text
- getCurrentPage: Get information about current page
- listPages: List all available pages
- switchPage: Switch to a different page
`;

      return context;
    }, [state]),
  });
}
