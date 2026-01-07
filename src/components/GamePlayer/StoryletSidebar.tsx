import React from 'react';
import { DialogueStep } from '../../hooks/useDialogueRunner';

interface StoryletSidebarProps {
  currentStep: DialogueStep | null;
  onContinue: () => void;
  onChoose: (choiceId: string) => void;
  status: 'running' | 'completed';
}

export function StoryletSidebar({ currentStep, onContinue, onChoose, status }: StoryletSidebarProps) {
  const isChoice = currentStep?.isChoice;
  const noAvailableChoices = isChoice && currentStep?.choices.length === 0;

  return (
    <aside className="w-80 bg-[#0b0b14] border-l border-[#1a1a2e] flex-shrink-0 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Storylets</p>
          <h3 className="text-white font-semibold">What happens next?</h3>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[#12121f] border border-[#1f1f2e] text-gray-400">
          {isChoice ? 'Choice' : 'Narrative'}
        </span>
      </div>

      <div className="space-y-2">
        {isChoice && currentStep?.choices.map(choice => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="w-full text-left px-4 py-3 rounded-lg border border-[#2a2a3e] hover:border-[#e94560] bg-[#12121a] hover:bg-[#1a1a2a] text-gray-200 transition-all group flex items-center justify-between"
            disabled={status === 'completed'}
          >
            <span>{choice.text}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-600 group-hover:text-[#e94560] transition-colors"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}

        {!isChoice && status !== 'completed' && (
          <button
            onClick={onContinue}
            className="w-full px-4 py-3 bg-[#e94560] hover:bg-[#d63850] text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Continue
          </button>
        )}

        {status === 'completed' && (
          <div className="text-center text-gray-500 text-sm border border-[#1f1f2e] rounded-lg p-3 bg-[#0f0f1a]">
            Dialogue finished
          </div>
        )}

        {noAvailableChoices && status !== 'completed' && (
          <div className="text-xs text-gray-500 bg-[#0f0f1a] border border-dashed border-[#2a2a3e] rounded-lg p-3">
            No available choices for the current conditions.
          </div>
        )}
      </div>
    </aside>
  );
}
