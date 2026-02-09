'use client';

import type { ForgeCompositionV1 } from '@magicborn/shared/types/composition';
import { GamePlayerOverlay } from './GamePlayerOverlay';
import { PixiVNPlayerShell } from './PixiVNPlayerShell';
import { useGamePlayerController } from './useGamePlayerController';

export interface GamePlayerProps {
  composition: ForgeCompositionV1 | null;
  gameState?: unknown;
  className?: string;
}

export function GamePlayer({
  composition,
  gameState,
  className = '',
}: GamePlayerProps) {
  const controller = useGamePlayerController({
    composition,
    gameState,
  });

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl ${className}`}>
      <PixiVNPlayerShell
        composition={composition}
        className="absolute inset-0"
      />
      <GamePlayerOverlay
        speaker={controller.line?.speaker}
        line={controller.line?.content}
        choices={controller.choices}
        canAdvance={controller.isWaitingForAdvance}
        isWaitingForChoice={controller.isWaitingForChoice}
        isEnded={controller.isEnded}
        isError={controller.isError}
        errorMessage={controller.lastError}
        onAdvance={controller.advance}
        onSelectChoice={controller.selectChoice}
        onRestart={controller.restart}
      />
    </div>
  );
}
