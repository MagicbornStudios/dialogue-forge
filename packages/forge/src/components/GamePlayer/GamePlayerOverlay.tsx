'use client';

import { Button } from '@magicborn/shared/ui/button';

export interface GamePlayerOverlayProps {
  speaker?: string;
  line?: string;
  choices: { id: string; text: string }[];
  canAdvance: boolean;
  isWaitingForChoice: boolean;
  isEnded: boolean;
  isError: boolean;
  errorMessage?: string | null;
  onAdvance: () => void;
  onSelectChoice: (choiceId: string) => void;
  onRestart: () => void;
}

export function GamePlayerOverlay({
  speaker,
  line,
  choices,
  canAdvance,
  isWaitingForChoice,
  isEnded,
  isError,
  errorMessage,
  onAdvance,
  onSelectChoice,
  onRestart,
}: GamePlayerOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end p-4">
      <div className="mb-3 flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onRestart}>
          Restart
        </Button>
      </div>

      <div className="rounded-xl border border-white/20 bg-black/70 p-4 text-white backdrop-blur">
        {speaker && (
          <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-300">
            {speaker}
          </div>
        )}

        {line && <div className="mb-3 text-base leading-relaxed">{line}</div>}

        {isError && (
          <div className="mb-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMessage ?? 'Player error'}
          </div>
        )}

        {isEnded && !isError && (
          <div className="mb-3 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            End of dialogue.
          </div>
        )}

        {isWaitingForChoice && choices.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/20"
                onClick={() => onSelectChoice(choice.id)}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {!isWaitingForChoice && !isEnded && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onAdvance} disabled={!canAdvance}>
              Advance
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
