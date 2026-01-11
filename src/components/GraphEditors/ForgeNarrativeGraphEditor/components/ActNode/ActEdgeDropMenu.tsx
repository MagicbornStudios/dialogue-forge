import React from 'react';
import { NARRATIVE_ELEMENT } from '../../../../../types/narrative';
import type { NarrativeElement } from '../../../../../types/narrative';
import { ContextMenuBase, ContextMenuButton } from '../../../shared/ContextMenuBase';

const elementTypeLabels: Record<NarrativeElement, string> = {
  [NARRATIVE_ELEMENT.THREAD]: 'Thread',
  [NARRATIVE_ELEMENT.ACT]: 'Act',
  [NARRATIVE_ELEMENT.CHAPTER]: 'Chapter',
  [NARRATIVE_ELEMENT.PAGE]: 'Page',
  [NARRATIVE_ELEMENT.STORYLET]: 'Storylet',
  [NARRATIVE_ELEMENT.DETOUR]: 'Detour',
  [NARRATIVE_ELEMENT.CONDITIONAL]: 'Conditional',
};

// Acts can connect to Chapters
const availableElementTypes: NarrativeElement[] = [NARRATIVE_ELEMENT.CHAPTER];

interface ActEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  onAddElement: (
    type: NarrativeElement,
    x: number,
    y: number,
    autoConnect?: {
      fromNodeId: string;
    }
  ) => void;
  onClose: () => void;
}

export function ActEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  onAddElement,
  onClose,
}: ActEdgeDropMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Create Element">
      {availableElementTypes.map(type => (
        <ContextMenuButton
          key={type}
          onClick={() => {
            onAddElement(type, graphX, graphY, {
              fromNodeId,
            });
            onClose();
          }}
        >
          Add {elementTypeLabels[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
