import React from 'react';
import { ForgeGraphDoc, type NarrativeThread } from '../../../types';
import { FlagSchema } from '../../../types/flags';
import { DialogueResult, FlagState } from '../../../types/game-state';
import { VNStage } from './VNStage';

export interface GamePlayerProps {
  dialogue: ForgeGraphDoc;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  gameStateFlags?: FlagState;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: FlagState) => void;
  narrativeThread?: NarrativeThread;
}

export function GamePlayer({
  dialogue,
  startNodeId,
  flagSchema,
  gameStateFlags,
  onComplete,
  onFlagsChange,
  narrativeThread,
}: GamePlayerProps) {

  return (
    <div className="relative border border-[#1a1a2e] rounded-3xl overflow-hidden bg-[#0f0f1a] h-full min-h-[480px]">
      <VNStage backgroundLabel={''} />
    </div>
  );
}
