import React from 'react';
import { NARRATIVE_ELEMENT } from '../../../../types/narrative';
import type { NarrativeElement } from '../../../../types/narrative';

interface NarrativeGraphEditorPaneContextMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  onAddElement: (type: NarrativeElement, x: number, y: number) => void;
  onClose: () => void;
  disabled?: boolean;
}

const elementTypeLabels: Record<NarrativeElement, string> = {
  [NARRATIVE_ELEMENT.THREAD]: 'Thread',
  [NARRATIVE_ELEMENT.ACT]: 'Act',
  [NARRATIVE_ELEMENT.CHAPTER]: 'Chapter',
  [NARRATIVE_ELEMENT.PAGE]: 'Page',
  [NARRATIVE_ELEMENT.STORYLET]: 'Storylet',
  [NARRATIVE_ELEMENT.DETOUR]: 'Detour',
  [NARRATIVE_ELEMENT.CONDITIONAL]: 'Conditional',
};

// Available element types for pane context menu
// Currently hidden, but can be enabled in the future
const availableElementTypes: NarrativeElement[] = [
  NARRATIVE_ELEMENT.ACT,
  NARRATIVE_ELEMENT.CHAPTER,
  NARRATIVE_ELEMENT.PAGE,
];

export function NarrativeGraphEditorPaneContextMenu({
  x,
  y,
  graphX,
  graphY,
  onAddElement,
  onClose,
  disabled = true,
}: NarrativeGraphEditorPaneContextMenuProps) {

  return disabled ? null : (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
        {availableElementTypes.map(type => (
          <button
            key={type}
            onClick={() => {
              onAddElement(type, graphX, graphY);
              onClose();
            }}
            className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
          >
            Add {elementTypeLabels[type]}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}   
