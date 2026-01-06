import React, { useEffect, useMemo } from 'react';
import { DialogueTree } from '../../types';
import { FlagSchema } from '../../types/flags';
import { DialogueResult, FlagState } from '../../types/game-state';
import { ReadingPane } from './ReadingPane';
import { StoryletSidebar } from './StoryletSidebar';
import { WorldPane } from './WorldPane';
import { useDialogueRunner } from '../../hooks/useDialogueRunner';
import { useNarrativeTraversal } from '../../hooks/useNarrativeTraversal';

export interface GamePlayerProps {
  dialogue: DialogueTree;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  initialFlags?: FlagState;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: FlagState) => void;
}

export function GamePlayer({
  dialogue,
  startNodeId,
  flagSchema,
  initialFlags,
  onComplete,
  onFlagsChange,
}: GamePlayerProps) {
  const runner = useDialogueRunner({
    dialogue,
    startNodeId,
    flagSchema,
    initialFlags,
    onComplete,
    onFlagsChange,
  });

  const narrative = useNarrativeTraversal({
    title: dialogue.title,
    initialPageCount: Math.max(runner.history.length, 1),
  });

  const { progress, nextPage, previousPage, setPageCount, goToPage } = narrative;

  useEffect(() => {
    const totalPages = Math.max(runner.history.length, 1);
    setPageCount(totalPages);
    goToPage(totalPages - 1);
  }, [runner.history.length, setPageCount, goToPage]);

  const totalNodes = useMemo(() => Object.keys(dialogue.nodes).length, [dialogue.nodes]);

  return (
    <div className="flex border border-[#1a1a2e] rounded-xl overflow-hidden bg-[#0f0f1a] h-full min-h-[480px]">
      <WorldPane
        progress={progress}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
        visitedNodes={runner.visitedNodeIds.length}
        totalNodes={totalNodes}
      />

      <ReadingPane
        history={runner.history}
        currentStep={runner.currentStep}
        currentPage={progress.pageIndex}
        status={runner.status}
      />

      <StoryletSidebar
        currentStep={runner.currentStep}
        onContinue={runner.continueDialogue}
        onChoose={runner.chooseOption}
        status={runner.status}
      />
    </div>
  );
}
