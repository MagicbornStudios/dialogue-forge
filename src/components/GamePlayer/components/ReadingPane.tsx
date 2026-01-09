import React from 'react';
import { DialogueHistoryEntry, DialogueStep } from '../../hooks/useDialogueRunner';
import { DialogueBox } from './DialogueBox';

interface ReadingPaneProps {
  history: DialogueHistoryEntry[];
  currentStep: DialogueStep | null;
  status: 'running' | 'completed';
}

export function ReadingPane({ history, currentStep, status }: ReadingPaneProps) {
  if (!currentStep && history.length === 0) {
    return (
      <section className="bg-[#0b0b14]/90 border border-[#1a1a2e] rounded-2xl backdrop-blur">
        <div className="px-5 py-4 text-sm text-gray-500">
          No dialogue is available for this page yet. Choose another page to continue.
        </div>
      </section>
    );
  }

  return <DialogueBox history={history} currentStep={currentStep} status={status} />;
}
