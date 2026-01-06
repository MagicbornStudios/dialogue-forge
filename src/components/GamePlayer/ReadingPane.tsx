import React from 'react';
import { DialogueHistoryEntry, DialogueStep } from '../../hooks/useDialogueRunner';
import { NODE_TYPE } from '../../types/constants';

interface ReadingPaneProps {
  history: DialogueHistoryEntry[];
  currentStep: DialogueStep | null;
  currentPage: number;
  status: 'running' | 'completed';
}

export function ReadingPane({ history, currentStep, currentPage, status }: ReadingPaneProps) {
  const visibleHistory = history.slice(0, Math.max(currentPage + 1, 0));

  return (
    <section className="flex-1 flex flex-col bg-[#0d0d14]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {visibleHistory.length === 0 && (
          <div className="text-gray-500 text-sm">Use the storylets on the right to begin the scene.</div>
        )}

        {visibleHistory.map(entry => (
          <div
            key={`${entry.nodeId}-${entry.content}`}
            className={`flex ${entry.type === NODE_TYPE.PLAYER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                entry.type === NODE_TYPE.PLAYER
                  ? 'bg-[#e94560] text-white rounded-br-md'
                  : 'bg-[#1a1a2e] text-gray-100 rounded-bl-md'
              }`}
            >
              {entry.type !== NODE_TYPE.PLAYER && entry.speaker && (
                <div className="text-xs text-[#e94560] font-medium mb-1">{entry.speaker}</div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{entry.content}</div>
            </div>
          </div>
        ))}

        {currentStep && currentStep.isChoice && currentStep.content && (
          <div className="text-gray-400 text-sm border border-dashed border-[#2a2a3e] rounded-lg p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Prompt</p>
            <p>{currentStep.content}</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-center text-gray-500 text-sm pt-4">Dialogue complete.</div>
        )}
      </div>
    </section>
  );
}
