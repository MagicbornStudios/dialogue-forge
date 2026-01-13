import React from 'react';
import { ForgeGraphDoc } from '../../../types';
import { FlagSchema } from '../../../types/flags';
import { DialogueResult, ForgeFlagState } from '../../../types/forge-game-state';
import { VNStage } from './VNStage';

export interface GamePlayerProps {
  dialogue: ForgeGraphDoc;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  gameStateFlags?: ForgeFlagState;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: ForgeFlagState) => void;
}

export function GamePlayer({
  dialogue,
  startNodeId,
  flagSchema,
  gameStateFlags,
  onComplete,
  onFlagsChange,
}: GamePlayerProps) {

  return (
    <div className="relative border border-[#1a1a2e] rounded-3xl overflow-hidden bg-[#0f0f1a] h-full min-h-[480px]">
      <VNStage backgroundLabel={''} />
    </div>
  );
}
