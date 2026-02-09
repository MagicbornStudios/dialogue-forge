import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@magicborn/shared/ui/dialog';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type {
  CompositionDiagnostic,
  ForgeCompositionV1,
} from '@magicborn/shared/types/composition';
import { graphToComposition } from '@magicborn/forge/lib/game-player/composition/graph-to-composition';
import { GamePlayer } from '@magicborn/forge/components/GamePlayer/GamePlayer';

export interface RequestPlayerCompositionInput {
  gameState?: unknown;
  options?: {
    resolveStorylets?: boolean;
  };
}

export interface RequestPlayerCompositionResult {
  composition: ForgeCompositionV1;
  resolvedGraphIds: number[];
  diagnostics?: CompositionDiagnostic[];
}

export interface ForgePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: ForgeGraphDoc;
  gameState?: ForgeGameState;
  requestPlayerComposition?: (
    rootGraphId: number,
    payload?: RequestPlayerCompositionInput
  ) => Promise<RequestPlayerCompositionResult>;
}

export function ForgePlayerModal({
  isOpen,
  onClose,
  graph,
  gameState,
  requestPlayerComposition,
}: ForgePlayerModalProps) {
  const [composition, setComposition] = useState<ForgeCompositionV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setComposition(null);
      try {
        if (requestPlayerComposition) {
          const response = await requestPlayerComposition(graph.id, {
            gameState,
            options: { resolveStorylets: true },
          });
          if (!cancelled) {
            setComposition(response.composition);
          }
          return;
        }

        const local = await graphToComposition(graph, {
          resolveStorylets: false,
        });
        if (!cancelled) {
          setComposition(local.composition);
        }
      } catch (cause) {
        if (cancelled) return;
        const message =
          cause instanceof Error ? cause.message : 'Failed to build player composition';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [gameState, graph, isOpen, requestPlayerComposition]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Play Graph - {graph.title}</DialogTitle>
        </DialogHeader>
        <div className="h-[75vh] p-4">
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Building composition...
            </div>
          )}
          {!loading && error && (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              {error}
            </div>
          )}
          {!loading && !error && (
            <GamePlayer composition={composition} gameState={gameState} className="h-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
