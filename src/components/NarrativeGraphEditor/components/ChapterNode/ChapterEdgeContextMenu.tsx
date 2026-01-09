import React from 'react';
import { NARRATIVE_ELEMENT } from '../../../../types/narrative';
import type { NarrativeElement } from '../../../../types/narrative';
import { ContextMenuBase, ContextMenuButton } from '../../../EditorComponents/shared/ContextMenuBase';

const elementTypeLabels: Record<NarrativeElement, string> = {
  [NARRATIVE_ELEMENT.THREAD]: 'Thread',
  [NARRATIVE_ELEMENT.ACT]: 'Act',
  [NARRATIVE_ELEMENT.CHAPTER]: 'Chapter',
  [NARRATIVE_ELEMENT.PAGE]: 'Page',
  [NARRATIVE_ELEMENT.STORYLET]: 'Storylet',
};

// Chapters can connect to Pages
const availableElementTypes: NarrativeElement[] = [NARRATIVE_ELEMENT.PAGE];

interface ChapterEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertElement: (type: NarrativeElement, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

export function ChapterEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertElement,
  onClose,
}: ChapterEdgeContextMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Insert Element">
      {availableElementTypes.map(type => (
        <ContextMenuButton
          key={type}
          onClick={() => {
            onInsertElement(type, edgeId, graphX, graphY);
            onClose();
          }}
        >
          Insert {elementTypeLabels[type]}
        </ContextMenuButton>
      ))}
      <ContextMenuButton onClick={onClose} variant="secondary">
        Cancel
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
