import React from 'react';
import { DialogueHistoryEntry, DialogueStep } from '../../hooks/useDialogueRunner';
import { DialogueBox } from './DialogueBox';

interface ReadingPaneProps {
  history: DialogueHistoryEntry[];
  currentStep: DialogueStep | null;
  status: 'running' | 'completed';
}

export function ReadingPane({ history, currentStep, status }: ReadingPaneProps) {
  return <DialogueBox history={history} currentStep={currentStep} status={status} />;
}
