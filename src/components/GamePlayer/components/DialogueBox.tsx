import React from 'react';
import { DialogueHistoryEntry, DialogueStep } from '../hooks/useDialogueRunner';
import { NODE_TYPE } from '../../../types/constants';

interface DialogueBoxProps {
  history: DialogueHistoryEntry[];
  currentStep: DialogueStep | null;
  status: 'running' | 'completed';
}

export function DialogueBox({ history, currentStep, status }: DialogueBoxProps) {
  return (
    <section className="bg-[#0b0b14]/90 border border-[#1a1a2e] rounded-2xl backdrop-blur">
      <div className="px-5 py-4 flex flex-col gap-3 max-h-[200px] overflow-y-auto">
        {history.length === 0 && (
          <p className="text-gray-500 text-sm">Use the choice cards to begin this page.</p>
        )}

        {history.map(entry => (
          <div
            key={`${entry.nodeId}-${entry.content}`}
            className={`flex ${entry.type === NODE_TYPE.PLAYER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md border ${
                entry.type === NODE_TYPE.PLAYER
                  ? 'bg-[#e94560] text-white border-[#e94560]/70 rounded-br-md'
                  : 'bg-[#121226] text-gray-100 border-[#24243b] rounded-bl-md'
              }`}
            >
              {entry.type !== NODE_TYPE.PLAYER && entry.speaker && (
                <div className="text-[11px] text-[#e94560] font-medium mb-1">{entry.speaker}</div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{entry.content}</div>
            </div>
          </div>
        ))}

        {currentStep && currentStep.isChoice && currentStep.content && (
          <div className="text-xs text-gray-400 border border-dashed border-[#2a2a3e] rounded-lg px-3 py-2">
            <p className="uppercase tracking-wide text-[10px] text-gray-500 mb-1">Prompt</p>
            <p>{currentStep.content}</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-center text-gray-500 text-xs pt-1">Dialogue complete.</div>
        )}
      </div>
    </section>
  );
}
