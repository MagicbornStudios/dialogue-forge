import React from 'react';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { FlagSchema } from '@magicborn/forge/types/flags';
import { ForgeYarnModal } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeYarnModal';
import { GuidePanel } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/GuidePanel';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeFlagManagerModal } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeFlagManagerModal/ForgeFlagManagerModal';
import { GRAPH_SCOPE } from '@magicborn/forge/types/constants';
interface ForgeWorkspaceModalsProps {
  narrativeGraph: ForgeGraphDoc | null;
  storyletGraph: ForgeGraphDoc | null;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  characters?: Record<string, ForgeCharacter>;
  onUpdateFlagSchema?: (schema: FlagSchema) => void;
  onUpdateGameState?: (state: ForgeGameState) => void;
}

interface ForgeWorkspaceModalsRendererProps extends ForgeWorkspaceModalsProps {}

export function ForgeWorkspaceModalsRenderer({
  narrativeGraph,
  storyletGraph,
  flagSchema,
  gameState,
  characters,
  onUpdateFlagSchema,
  onUpdateGameState,
}: ForgeWorkspaceModalsRendererProps) {
  const modalState = useForgeWorkspaceStore((s) => s.modalState);
  const closeYarnModal = useForgeWorkspaceStore((s) => s.actions.closeYarnModal);
  const closeFlagModal = useForgeWorkspaceStore((s) => s.actions.closeFlagModal);
  const closeGuide = useForgeWorkspaceStore((s) => s.actions.closeGuide);
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);
  const graphScope = useForgeWorkspaceStore((s) => s.graphScope);
  const resolvedScope = focusedEditor ?? graphScope;
  const scopedGraph = resolvedScope === GRAPH_SCOPE.NARRATIVE ? narrativeGraph : storyletGraph;
  const fallbackGraph = narrativeGraph ?? storyletGraph;

  const yarnGraph = scopedGraph ?? fallbackGraph;
  const flagGraph = scopedGraph ?? fallbackGraph;
  
  // Get graph change handler from workspace if available
  const setGraph = useForgeWorkspaceStore((s) => s.actions.setGraph);
  const handleGraphChange = (updatedGraph: typeof narrativeGraph) => {
    if (updatedGraph) {
      setGraph(String(updatedGraph.id), updatedGraph);
    }
  };

  return (
    <>
      {yarnGraph && (
        <ForgeYarnModal
          isOpen={modalState.isYarnModalOpen}
          onClose={closeYarnModal}
          graph={yarnGraph}
          onGraphChange={handleGraphChange}
        />
      )}
      
      {flagGraph && flagSchema && gameState && characters && (
        <ForgeFlagManagerModal
          isOpen={modalState.isFlagModalOpen}
          onClose={closeFlagModal}
          flagSchema={flagSchema}
          dialogue={flagGraph}
          activeGameState={gameState}
          resolvedCharacters={characters}
          onUpdateFlagSchema={onUpdateFlagSchema ?? (() => {})}
          onUpdateGameState={onUpdateGameState ?? (() => {})}
        />
      )}

      <GuidePanel
        isOpen={modalState.isGuideOpen}
        onClose={closeGuide}
      />
    </>
  );
}
