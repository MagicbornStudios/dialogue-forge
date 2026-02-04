import React, { useEffect, useState } from 'react';
import { X, CircleDot, BookOpen, Flag } from 'lucide-react';
import { ForgeFlagManager } from './ForgeFlagManager';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { ForgeCharacter } from '@magicborn/forge/types/characters';
import type { FlagSchema } from '@magicborn/forge/types/flags';
import { FLAG_TYPE } from '@magicborn/forge/types/constants';

interface ForgeFlagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  flagSchema: FlagSchema;
  dialogue: ForgeGraphDoc;
  activeGameState: ForgeGameState;
  resolvedCharacters: Record<string, ForgeCharacter>;
  onUpdateFlagSchema: (schema: FlagSchema) => void;
  onUpdateGameState: (state: ForgeGameState) => void;
}

export function ForgeFlagManagerModal({
  isOpen,
  onClose,
  flagSchema,
  dialogue,
  activeGameState,
  resolvedCharacters,
  onUpdateFlagSchema,
  onUpdateGameState,
}: ForgeFlagManagerModalProps) {
  const [gameStateDraft, setGameStateDraft] = useState(() => JSON.stringify(activeGameState, null, 2));
  const [gameStateError, setGameStateError] = useState<string | null>(null);

  useEffect(() => {
    setGameStateDraft(JSON.stringify(activeGameState, null, 2));
  }, [activeGameState]);

  if (!isOpen) return null;

  const handleSaveGameState = () => {
    try {
      const nextState = JSON.parse(gameStateDraft) as ForgeGameState;
      if (!nextState.flags) {
        setGameStateError('Game state must include a flags object.');
        return;
      }
      onUpdateGameState(nextState);
      setGameStateError(null);
    } catch {
      setGameStateError('Invalid JSON. Fix errors before saving.');
    }
  };

  const handleResetGameState = () => {
    setGameStateDraft(JSON.stringify(activeGameState, null, 2));
    setGameStateError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
        <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
          <div className="text-sm font-semibold text-df-text-primary">Game State</div>
          <button
            type="button"
            className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={onClose}
            title="Close flag manager"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0">
            <ForgeFlagManager
              flagSchema={flagSchema}
              graph={dialogue}
              onUpdate={onUpdateFlagSchema}
              onClose={onClose}
              embedded={true}
            />
          </div>
          <div className="border-l border-df-node-border bg-df-base/60 p-4 space-y-4 text-xs text-df-text-secondary">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
                <CircleDot size={12} />
                Game State JSON
              </div>
              <textarea
                value={gameStateDraft}
                onChange={event => setGameStateDraft(event.target.value)}
                className="mt-2 h-32 w-full rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px] text-df-text-primary"
              />
              {gameStateError && (
                <div className="mt-2 text-[11px] text-df-error">{gameStateError}</div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                  onClick={handleSaveGameState}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary hover:text-df-text-primary"
                  onClick={handleResetGameState}
                >
                  Reset
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
                <BookOpen size={12} />
                Characters
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {Object.values(resolvedCharacters).length > 0 ? (
                  Object.values(resolvedCharacters).map(character => (
                    <div
                      key={character.id}
                      className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px]"
                    >
                      <div className="text-df-text-primary font-semibold">{character.name}</div>
                      <div className="text-df-text-tertiary">{character.id}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px] text-df-text-tertiary">
                    No characters loaded.
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
                <Flag size={12} />
                Flag Catalog
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {flagSchema?.flags.length ? (
                  Object.values(FLAG_TYPE).map(flagType => {
                    const flags = flagSchema.flags.filter(flag => flag.type === flagType);
                    if (flags.length === 0) return null;
                    return (
                      <div key={flagType} className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2">
                        <div className="text-[11px] font-semibold text-df-text-primary">{flagType}</div>
                        <ul className="mt-1 space-y-1 text-[11px] text-df-text-tertiary">
                          {flags.map(flag => (
                            <li key={flag.id}>{flag.id}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 text-[11px] text-df-text-tertiary">
                    No flag schema loaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
