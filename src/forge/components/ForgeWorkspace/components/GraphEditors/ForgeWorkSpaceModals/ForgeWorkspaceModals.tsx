import React from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { FlagSchema } from '@/forge/types/flags';
import { ForgePlayModal } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgePlayModal';
import { ForgeYarnModal } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeYarnModal';
import { GuidePanel } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GuidePanel';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeFlagManagerModal } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgeFlagManagerModal/ForgeFlagManagerModal';
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
  const closePlayModal = useForgeWorkspaceStore((s) => s.actions.closePlayModal);
  const closeYarnModal = useForgeWorkspaceStore((s) => s.actions.closeYarnModal);
  const closeFlagModal = useForgeWorkspaceStore((s) => s.actions.closeFlagModal);
  const closeGuide = useForgeWorkspaceStore((s) => s.actions.closeGuide);
  
  // Determine which graph to use for modals (prefer narrative, fallback to storylet)
  const playGraph = narrativeGraph ?? storyletGraph;
  const playTitle = narrativeGraph ? 'Narrative' : storyletGraph ? 'Storylet' : '';
  const playSubtitle = playGraph?.title ?? '';

  const yarnGraph = narrativeGraph ?? storyletGraph;
  const flagGraph = narrativeGraph ?? storyletGraph;
  
  // Get graph change handler from workspace if available
  const setGraph = useForgeWorkspaceStore((s) => s.actions.setGraph);
  const handleGraphChange = (updatedGraph: typeof narrativeGraph) => {
    if (updatedGraph) {
      setGraph(String(updatedGraph.id), updatedGraph);
    }
  };

  return (
    <>
      {playGraph && (
        <ForgePlayModal
          isOpen={modalState.isPlayModalOpen}
          onClose={closePlayModal}
          graph={playGraph}
          flagSchema={flagSchema}
          gameStateFlags={gameState?.flags}
          title={playTitle}
          subtitle={playSubtitle}
        />
      )}
      
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
