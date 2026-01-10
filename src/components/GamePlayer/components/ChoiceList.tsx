import React from 'react';
import { DialogueStep } from '../hooks/useDialogueRunner';

interface ChoiceListProps {
  currentStep: DialogueStep | null;
  onContinue: () => void;
  onChoose: (choiceId: string) => void;
  status: 'running' | 'completed';
}

export function ChoiceList({ currentStep, onContinue, onChoose, status }: ChoiceListProps) {
  const isChoice = currentStep?.isChoice;
  const noAvailableChoices = isChoice && currentStep?.choices.length === 0;
  const hasStep = Boolean(currentStep);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Choices</p>
          <h3 className="text-sm font-semibold text-white">What happens next?</h3>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[#12121f] border border-[#1f1f2e] text-gray-400">
          {isChoice ? 'Choice' : 'Narrative'}
        </span>
      </div>

      <div className="grid gap-2">
        {isChoice && currentStep?.choices.map(choice => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="w-full text-left px-4 py-3 rounded-xl border border-[#2a2a3e] bg-[#12121a] text-gray-200 hover:border-[#e94560] hover:bg-[#1a1a2a] transition-all shadow-sm"
            disabled={status === 'completed'}
          >
            <div className="flex items-center justify-between">
              <span>{choice.text}</span>
              <span className="text-xs text-gray-500">Select</span>
            </div>
          </button>
        ))}

        {!isChoice && hasStep && status !== 'completed' && (
          <button
            onClick={onContinue}
            className="w-full px-4 py-3 bg-[#e94560] hover:bg-[#d63850] text-white rounded-xl transition-colors font-medium shadow-md"
          >
            Continue
          </button>
        )}

        {!hasStep && status !== 'completed' && (
          <div className="text-xs text-gray-500 bg-[#0f0f1a] border border-dashed border-[#2a2a3e] rounded-xl p-3">
            No dialogue is available for this page yet. Move to another page to continue.
          </div>
        )}

        {status === 'completed' && (
          <div className="text-center text-gray-500 text-sm border border-[#1f1f2e] rounded-xl p-3 bg-[#0f0f1a]">
            Dialogue finished
          </div>
        )}

        {noAvailableChoices && status !== 'completed' && (
          <div className="text-xs text-gray-500 bg-[#0f0f1a] border border-dashed border-[#2a2a3e] rounded-xl p-3">
            No available choices for the current conditions.
          </div>
        )}
      </div>
    </div>
  );
}
