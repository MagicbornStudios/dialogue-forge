import React, { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Globe, X, Sparkles } from 'lucide-react';
import { useDialogueRunner, HistoryEntry } from '../../hooks/useDialogueRunner';
import { BaseGameState, DialogueResult } from '../../types/game-state';
import { WorldPaneProps, MessageRenderProps, ChoiceRenderProps } from './types';
import { NODE_TYPE } from '../../types/constants';

function DefaultMessage({ speaker, content, type, isLatest }: MessageRenderProps) {
  return (
    <div className={`flex ${type === 'player' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          type === 'player'
            ? 'bg-[#e94560] text-white rounded-br-md'
            : 'bg-[#1a1a2e] text-gray-100 rounded-bl-md'
        }`}
      >
        {type === 'npc' && speaker && (
          <div className="text-xs text-[#e94560] font-medium mb-1">{speaker}</div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

function DefaultChoice({ choice, onSelect, isDisabled }: ChoiceRenderProps) {
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className="w-full text-left px-4 py-3 rounded-lg border border-[#2a2a3e] hover:border-[#e94560] bg-[#12121a] hover:bg-[#1a1a2e] text-gray-200 transition-all group flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>{choice.text}</span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-600 group-hover:text-[#e94560] transition-colors"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#1a1a2e] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-[#e94560] rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

export function WorldPane<T extends BaseGameState>({
  dialogue,
  gameState,
  onGameStateChange,
  storylets = {},
  startNodeId,
  onComplete,
  onBackToReading,
  showBackButton = true,
  pageTitle,
  className = '',
  onNodeEnter,
  onNodeExit,
  onChoiceSelect,
  onDialogueStart,
  onDialogueEnd,
  renderMessage,
  renderChoice,
}: WorldPaneProps<T>) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleDialogueEnd = useCallback(() => {
    onDialogueEnd?.();
  }, [onDialogueEnd]);

  const {
    currentNode,
    history,
    availableChoices,
    isTyping,
    isComplete,
    stackDepth,
    advance,
    selectChoice,
    getResult,
  } = useDialogueRunner<T>({
    dialogue,
    gameState,
    onStateChange: onGameStateChange,
    storylets,
    startNodeId,
    onNodeEnter,
    onNodeExit,
    onChoiceSelect,
    onDialogueStart,
    onDialogueEnd: handleDialogueEnd,
  });

  useEffect(() => {
    if (isComplete) {
      onComplete(getResult());
    }
  }, [isComplete, onComplete, getResult]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        !isTyping &&
        currentNode?.type === NODE_TYPE.NPC &&
        currentNode.nextNodeId &&
        availableChoices.length === 0
      ) {
        e.preventDefault();
        advance();
      }
    },
    [isTyping, currentNode, availableChoices, advance]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleAdvance = useCallback(() => {
    if (
      !isTyping &&
      currentNode?.type === NODE_TYPE.NPC &&
      currentNode.nextNodeId &&
      availableChoices.length === 0
    ) {
      advance();
    }
  }, [isTyping, currentNode, availableChoices, advance]);

  const canAdvance =
    !isTyping &&
    currentNode?.type === NODE_TYPE.NPC &&
    currentNode.nextNodeId &&
    availableChoices.length === 0;

  const MessageComponent = renderMessage || DefaultMessage;
  const ChoiceComponent = renderChoice || DefaultChoice;

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 ${className}`}>
      {(showBackButton || pageTitle) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/90">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-white">World Mode</span>
            {pageTitle && (
              <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded">
                {pageTitle}
              </span>
            )}
            {stackDepth > 0 && (
              <span className="text-xs text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded">
                <Sparkles size={10} className="inline mr-1" />
                Storylet
              </span>
            )}
          </div>
          {showBackButton && onBackToReading && (
            <button
              onClick={onBackToReading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Reading
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col cursor-pointer" onClick={handleAdvance}>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {history.map((entry: HistoryEntry, idx: number) => (
              <React.Fragment key={`${entry.nodeId}-${idx}`}>
                {MessageComponent({
                  nodeId: entry.nodeId,
                  type: entry.type,
                  speaker: entry.speaker,
                  content: entry.content,
                  isLatest: idx === history.length - 1,
                })}
              </React.Fragment>
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={chatEndRef} />
          </div>
        </div>

        {currentNode?.type === NODE_TYPE.PLAYER &&
          !isTyping &&
          availableChoices.length > 0 && (
            <div
              className="border-t border-[#1a1a2e] bg-[#0d0d14]/80 backdrop-blur-sm p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-2xl mx-auto space-y-2">
                {availableChoices.map((choice, idx) => (
                  <React.Fragment key={choice.id}>
                    {ChoiceComponent({
                      choice,
                      index: idx,
                      onSelect: () => selectChoice(idx),
                      isDisabled: isTyping,
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

        {currentNode?.type === NODE_TYPE.NPC &&
          !currentNode.nextNodeId &&
          !isTyping && (
            <div
              className="border-t border-[#1a1a2e] bg-[#0d0d14]/80 backdrop-blur-sm p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-gray-400 text-sm">End of dialogue</p>
              </div>
            </div>
          )}

        {canAdvance && (
          <div className="border-t border-[#1a1a2e] bg-[#0d0d14]/80 backdrop-blur-sm p-4">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#2a2a3e] rounded text-[10px] font-mono">
                  Enter
                </kbd>{' '}
                or click to continue
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
