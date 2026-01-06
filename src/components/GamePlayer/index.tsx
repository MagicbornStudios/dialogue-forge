import React, { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { BaseGameState, DialogueResult } from '../../types/game-state';
import { PageNode } from '../../types/narrative';
import { GamePlayerProps, PlayerMode } from './types';
import { ReadingPane } from './ReadingPane';
import { WorldPane } from './WorldPane';

export function GamePlayer<T extends BaseGameState>({
  thread,
  dialogue,
  gameState,
  onGameStateChange,
  startNodeId,
  initialMode = 'reading',
  className = '',
  onClose,
  onComplete,
  onNodeEnter,
  onNodeExit,
  onChoiceSelect,
  onDialogueStart,
  onDialogueEnd,
  onModeChange,
  renderMessage,
  renderChoice,
}: GamePlayerProps<T>) {
  const [mode, setMode] = useState<PlayerMode>(
    dialogue && !thread ? 'world' : initialMode
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [worldPageId, setWorldPageId] = useState<string | null>(null);
  const [activeDialogueTreeId, setActiveDialogueTreeId] = useState<string | null>(null);

  const handleModeChange = useCallback(
    (newMode: PlayerMode) => {
      setMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  const handlePlayWorld = useCallback(
    (pageId: string, dialogueTreeId: string | null) => {
      setWorldPageId(pageId);
      setActiveDialogueTreeId(dialogueTreeId);
      handleModeChange('world');
    },
    [handleModeChange]
  );

  const handleBackToReading = useCallback(() => {
    setWorldPageId(null);
    setActiveDialogueTreeId(null);
    handleModeChange('reading');
  }, [handleModeChange]);

  const handleDialogueComplete = useCallback(
    (result: DialogueResult) => {
      onComplete?.(result);
      if (thread) {
        handleBackToReading();
      }
    },
    [onComplete, thread, handleBackToReading]
  );

  const activeDialogueTree = useMemo(() => {
    if (dialogue) {
      return dialogue;
    }
    if (thread && activeDialogueTreeId) {
      return thread.dialogueTrees[activeDialogueTreeId] || null;
    }
    return null;
  }, [dialogue, thread, activeDialogueTreeId]);

  const storylets = useMemo(() => {
    return thread?.storylets || {};
  }, [thread]);

  const currentPageTitle = useMemo(() => {
    if (!thread || !worldPageId) return undefined;
    const page = thread.nodes.pages[worldPageId] as PageNode | undefined;
    return page?.title;
  }, [thread, worldPageId]);

  if (dialogue && !thread) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <WorldPane<T>
          dialogue={dialogue}
          gameState={gameState}
          onGameStateChange={onGameStateChange}
          storylets={storylets}
          startNodeId={startNodeId}
          onComplete={handleDialogueComplete}
          showBackButton={false}
          onNodeEnter={onNodeEnter}
          onNodeExit={onNodeExit}
          onChoiceSelect={onChoiceSelect}
          onDialogueStart={onDialogueStart}
          onDialogueEnd={onDialogueEnd}
          renderMessage={renderMessage}
          renderChoice={renderChoice}
        />
      </div>
    );
  }

  if (!thread) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center bg-gray-950 ${className}`}
      >
        <div className="text-center text-gray-400">
          <p>No content to display.</p>
          <p className="text-sm mt-2">
            Provide a dialogue or narrative thread.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {mode === 'reading' && (
        <ReadingPane
          thread={thread}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onPlayWorld={handlePlayWorld}
        />
      )}

      {mode === 'world' && activeDialogueTree && (
        <WorldPane<T>
          dialogue={activeDialogueTree}
          gameState={gameState}
          onGameStateChange={onGameStateChange}
          storylets={storylets}
          onComplete={handleDialogueComplete}
          onBackToReading={handleBackToReading}
          showBackButton={true}
          pageTitle={currentPageTitle}
          onNodeEnter={onNodeEnter}
          onNodeExit={onNodeExit}
          onChoiceSelect={onChoiceSelect}
          onDialogueStart={onDialogueStart}
          onDialogueEnd={onDialogueEnd}
          renderMessage={renderMessage}
          renderChoice={renderChoice}
        />
      )}

      {mode === 'world' && !activeDialogueTree && (
        <div className="flex-1 flex items-center justify-center bg-gray-950">
          <div className="text-center text-gray-400">
            <p>No dialogue attached to this page.</p>
            <button
              onClick={handleBackToReading}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Return to Reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
