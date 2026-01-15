import React from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeCharacter } from '@/forge/types/characters';
import type { FlagSchema } from '@/forge/types/flags';
import { ForgePlayModal } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/ForgePlayModal';
import { GuidePanel } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/GuidePanel';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { ForgeFlagManagerModal } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/components/ForgeFlagManagerModal/ForgeFlagManagerModal';
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
  const openPlayModal = useForgeWorkspaceStore((s) => s.actions.openPlayModal);
  const closePlayModal = useForgeWorkspaceStore((s) => s.actions.closePlayModal);
  const openFlagModal = useForgeWorkspaceStore((s) => s.actions.openFlagModal);
  const closeFlagModal = useForgeWorkspaceStore((s) => s.actions.closeFlagModal);
  const openGuide = useForgeWorkspaceStore((s) => s.actions.openGuide);
  const closeGuide = useForgeWorkspaceStore((s) => s.actions.closeGuide);
  // Determine which graph to use for play modal (prefer narrative, fallback to storylet)
  const playGraph = narrativeGraph ?? storyletGraph;
  const playTitle = narrativeGraph ? 'Narrative' : storyletGraph ? 'Storylet' : '';
  const playSubtitle = playGraph?.title ?? '';

  // Determine which graph to use for flag manager (prefer narrative, fallback to storylet)
  const flagGraph = narrativeGraph ?? storyletGraph;

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
