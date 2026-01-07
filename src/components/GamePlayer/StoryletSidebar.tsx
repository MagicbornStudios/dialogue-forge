import React from 'react';
import { DialogueStep } from '../../hooks/useDialogueRunner';
import { ChoiceList } from './ChoiceList';

interface StoryletSidebarProps {
  currentStep: DialogueStep | null;
  onContinue: () => void;
  onChoose: (choiceId: string) => void;
  status: 'running' | 'completed';
}

export function StoryletSidebar({ currentStep, onContinue, onChoose, status }: StoryletSidebarProps) {
  return (
    <div className="bg-[#0b0b14]/90 border border-[#1a1a2e] rounded-2xl backdrop-blur p-4">
      <ChoiceList
        currentStep={currentStep}
        onContinue={onContinue}
        onChoose={onChoose}
        status={status}
      />
    </div>
  );
}
