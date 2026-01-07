import React, { useEffect, useMemo, useState } from 'react';
import { DialogueTree, type NarrativeThread } from '../../types';
import { FlagSchema } from '../../types/flags';
import { DialogueResult, FlagState } from '../../types/game-state';
import { ReadingPane } from './ReadingPane';
import { StoryletSidebar } from './StoryletSidebar';
import { VNStage } from './VNStage';
import { ProgressOverlay } from './ProgressOverlay';
import { useDialogueRunner } from '../../hooks/useDialogueRunner';
import { useNarrativeTraversal } from '../../hooks/useNarrativeTraversal';
import { NARRATIVE_ELEMENT } from '../../types/narrative';

export interface GamePlayerProps {
  dialogue: DialogueTree;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  gameStateFlags?: FlagState;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: FlagState) => void;
  narrativeThread?: NarrativeThread;
}

function buildFallbackNarrativeThread(dialogue: DialogueTree): NarrativeThread {
  const nodeIds = Object.keys(dialogue.nodes);

  return {
    id: `thread-${dialogue.id}`,
    title: dialogue.title,
    acts: [
      {
        id: `act-${dialogue.id}`,
        title: dialogue.title ? `${dialogue.title} Act` : 'Untitled Act',
        chapters: [
          {
            id: `chapter-${dialogue.id}`,
            title: dialogue.title ?? 'Untitled Chapter',
            pages: [
              {
                id: `page-${dialogue.id}`,
                title: dialogue.title ?? 'Untitled Page',
                nodeIds,
                type: NARRATIVE_ELEMENT.PAGE,
              },
            ],
            type: NARRATIVE_ELEMENT.CHAPTER,
          },
        ],
        type: NARRATIVE_ELEMENT.ACT,
      },
    ],
    type: NARRATIVE_ELEMENT.THREAD,
  };
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
  const runner = useDialogueRunner({
    dialogue,
    startNodeId,
    flagSchema,
    gameStateFlags,
    onComplete,
    onFlagsChange,
  });

  const resolvedThread = useMemo(
    () => narrativeThread ?? buildFallbackNarrativeThread(dialogue),
    [dialogue, narrativeThread]
  );

  const narrative = useNarrativeTraversal({ thread: resolvedThread });

  const { progress, nextPage, previousPage, goToPage, sequence, currentStep } = narrative;
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const latestEntry = runner.history[runner.history.length - 1];
    if (!latestEntry) return;
    const pageIndex = sequence.findIndex(step => step.page.nodeIds.includes(latestEntry.nodeId));
    if (pageIndex >= 0) {
      goToPage(pageIndex);
    }
  }, [goToPage, runner.history, sequence]);

  const totalNodes = useMemo(() => Object.keys(dialogue.nodes).length, [dialogue.nodes]);
  const currentPageHistory = useMemo(() => {
    if (!currentStep) {
      return [];
    }
    const nodeIds = new Set(currentStep.page.nodeIds);
    return runner.history.filter(entry => nodeIds.has(entry.nodeId));
  }, [currentStep, runner.history]);

  return (
    <div className="relative border border-[#1a1a2e] rounded-3xl overflow-hidden bg-[#0f0f1a] h-full min-h-[480px]">
      <VNStage backgroundLabel={progress.chapterTitle} />

      <ProgressOverlay
        progress={progress}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
        visitedNodes={runner.visitedNodeIds.length}
        totalNodes={totalNodes}
        isOpen={isOverlayOpen}
        onToggle={() => setIsOverlayOpen(open => !open)}
      />

      <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ReadingPane
            history={currentPageHistory}
            currentStep={runner.currentStep}
            status={runner.status}
          />
          <StoryletSidebar
            currentStep={runner.currentStep}
            onContinue={runner.continueDialogue}
            onChoose={runner.chooseOption}
            status={runner.status}
          />
        </div>
      </div>
    </div>
  );
}
