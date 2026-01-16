/**
 * Hook to provide Forge workspace context to CopilotKit
 * Makes chapters, acts, pages, and graphs available to the AI
 */

import { useStore } from 'zustand';
import { useCopilotReadable } from '@copilotkit/react-core';
import { useMemo } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { ForgeWorkspaceState } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

export function useForgeCopilotContext(
  workspaceStore: StoreApi<ForgeWorkspaceState>
) {
  const state = useStore(workspaceStore);

  // Extract narrative structure (acts, chapters, pages) from graphs
  const narrativeContext = useMemo(() => {
    // Get the active narrative graph using the active graph ID, not scope
    const narrativeGraphId = state.activeNarrativeGraphId;
    const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;
    if (!narrativeGraph?.flow?.nodes) {
      return null;
    }

    const acts = narrativeGraph.flow.nodes.filter(
      (node) => node.data?.node?.type === FORGE_NODE_TYPE.ACT
    );
    const chapters = narrativeGraph.flow.nodes.filter(
      (node) => node.data?.node?.type === FORGE_NODE_TYPE.CHAPTER
    );
    const pages = narrativeGraph.flow.nodes.filter(
      (node) => node.data?.node?.type === FORGE_NODE_TYPE.PAGE
    );

    return {
      acts: acts.map((node) => ({
        id: node.id,
        label: node.data?.node?.label || node.id,
        content: node.data?.node?.content || '',
      })),
      chapters: chapters.map((node) => ({
        id: node.id,
        label: node.data?.node?.label || node.id,
        content: node.data?.node?.content || '',
      })),
      pages: pages.map((node) => ({
        id: node.id,
        label: node.data?.node?.label || node.id,
        content: node.data?.node?.content || '',
      })),
    };
  }, [state.graphs.byId]);

  // Provide workspace context to CopilotKit
  useCopilotReadable({
    description: 'Forge workspace state and narrative structure',
    value: useMemo(() => {
      // Get graphs using active graph IDs, not scope constants
      const narrativeGraphId = state.activeNarrativeGraphId;
      const storyletGraphId = state.activeStoryletGraphId;
      const narrativeGraph = narrativeGraphId ? state.graphs.byId[narrativeGraphId] : null;
      const storyletGraph = storyletGraphId ? state.graphs.byId[storyletGraphId] : null;
      const activeScope = state.graphScope;

      let context = `Forge Workspace Context:
- Active Graph Scope: ${activeScope}
- Narrative Graph: ${narrativeGraph ? `${narrativeGraph.title} (ID: ${narrativeGraph.id})` : 'None'}
- Storylet Graph: ${storyletGraph ? `${storyletGraph.title} (ID: ${storyletGraph.id})` : 'None'}
- Flag Schema: ${state.activeFlagSchema ? `${state.activeFlagSchema.flags?.length || 0} flags defined` : 'None'}
- Game State: ${state.activeGameState ? 'Loaded' : 'None'}
`;

      if (narrativeContext) {
        context += `\nNarrative Structure:
- Acts: ${narrativeContext.acts.length}
  ${narrativeContext.acts.map((a) => `  - ${a.label} (${a.id})`).join('\n  ')}
- Chapters: ${narrativeContext.chapters.length}
  ${narrativeContext.chapters.map((c) => `  - ${c.label} (${c.id})`).join('\n  ')}
- Pages: ${narrativeContext.pages.length}
  ${narrativeContext.pages.map((p) => `  - ${p.label} (${p.id})`).join('\n  ')}
`;
      }

      context += `\nAvailable Actions:
- getCurrentGraph: Get information about the current graph
- listGraphs: List all available graphs
- switchGraph: Switch to a different graph
- getChapters: Get all chapters in the narrative graph
- getActs: Get all acts in the narrative graph
- getPages: Get all pages in the narrative graph
- getGraph: Get a specific graph by ID
- getFlagSchema: Get the flag schema configuration
- getGameState: Get the current game state
`;

      return context;
    }, [state, narrativeContext]),
  });
}
