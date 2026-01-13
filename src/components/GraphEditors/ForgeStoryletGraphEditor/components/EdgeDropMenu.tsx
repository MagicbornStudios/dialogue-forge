import React from 'react';
import { NODE_TYPE, type NodeType } from '../../../../types/constants';
import { NARRATIVE_ELEMENT } from '../../../../types/narrative';
import type { NarrativeElement } from '../../../../types/narrative';

// Dialogue editor props
interface DialogueEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  fromNodeType: NodeType;
  fromChoiceIdx?: number;
  fromBlockIdx?: number;
  sourceHandle?: string;
  onAddNode: (
    type: NodeType,
    x: number,
    y: number,
    autoConnect?: {
      fromNodeId: string;
      fromChoiceIdx?: number;
      fromBlockIdx?: number;
      sourceHandle?: string;
    }
  ) => void;
  onClose: () => void;
  mode: 'dialogue';
}

// Narrative editor props
interface NarrativeEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  fromElementType: NarrativeElement;
  onAddElement: (
    type: NarrativeElement,
    x: number,
    y: number,
    autoConnect?: {
      fromNodeId: string;
    }
  ) => void;
  onClose: () => void;
  mode: 'narrative';
}

type EdgeDropMenuProps = DialogueEdgeDropMenuProps | NarrativeEdgeDropMenuProps;

const nodeTypeLabels: Record<NodeType, string> = {
  [NODE_TYPE.NPC]: 'NPC Node',
  [NODE_TYPE.PLAYER]: 'Player Node',
  [NODE_TYPE.CONDITIONAL]: 'Conditional Node',
  [NODE_TYPE.STORYLET]: 'Storylet Node',
  [NODE_TYPE.STORYLET_POOL]: 'Storylet Pool Node',
  [NODE_TYPE.RANDOMIZER]: 'Randomizer Node',
  [NODE_TYPE.DETOUR]: 'Detour Node',
};

const elementTypeLabels: Record<NarrativeElement, string> = {
  [NARRATIVE_ELEMENT.ACT]: 'Act',
  [NARRATIVE_ELEMENT.CHAPTER]: 'Chapter',
  [NARRATIVE_ELEMENT.PAGE]: 'Page',
  [NARRATIVE_ELEMENT.STORYLET]: 'Storylet',
  [NARRATIVE_ELEMENT.DETOUR]: 'Detour',
  [NARRATIVE_ELEMENT.CONDITIONAL]: 'Conditional',
};

// Map node types to their available connection targets (dialogue)
const getAvailableNodeTypes = (fromNodeType: NodeType): NodeType[] => {
  switch (fromNodeType) {
    case NODE_TYPE.PLAYER:
      return [NODE_TYPE.NPC, NODE_TYPE.CONDITIONAL];
    case NODE_TYPE.NPC:
    case NODE_TYPE.STORYLET:
    case NODE_TYPE.STORYLET_POOL:
      return [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL];
    case NODE_TYPE.CONDITIONAL:
      return [NODE_TYPE.NPC, NODE_TYPE.PLAYER];
    default:
      return [];
  }
};

// Map element types to their available connection targets (narrative)
const getAvailableElementTypes = (fromElementType: NarrativeElement): NarrativeElement[] => {
  switch (fromElementType) {
    case NARRATIVE_ELEMENT.ACT:
      return [NARRATIVE_ELEMENT.CHAPTER];
    case NARRATIVE_ELEMENT.CHAPTER:
      return [NARRATIVE_ELEMENT.PAGE];
    case NARRATIVE_ELEMENT.PAGE:
      return [NARRATIVE_ELEMENT.PAGE, NARRATIVE_ELEMENT.CHAPTER, NARRATIVE_ELEMENT.ACT];
    default:
      return [];
  }
};

export function EdgeDropMenu(props: EdgeDropMenuProps) {
  const { x, y, graphX, graphY, fromNodeId, onClose, mode } = props;

  if (mode === 'dialogue') {
    const {
      fromNodeType,
      fromChoiceIdx,
      fromBlockIdx,
      sourceHandle,
      onAddNode,
    } = props;

    const availableNodeTypes = getAvailableNodeTypes(fromNodeType);

    const handleAddNode = (type: NodeType) => {
      const autoConnect: {
        fromNodeId: string;
        fromChoiceIdx?: number;
        fromBlockIdx?: number;
        sourceHandle?: string;
      } = {
        fromNodeId,
      };

      // Include optional props if they exist
      if (fromChoiceIdx !== undefined) {
        autoConnect.fromChoiceIdx = fromChoiceIdx;
      }
      if (fromBlockIdx !== undefined) {
        autoConnect.fromBlockIdx = fromBlockIdx;
      }
      if (sourceHandle) {
        autoConnect.sourceHandle = sourceHandle;
      }

      onAddNode(type, graphX, graphY, autoConnect);
      onClose();
    };

    return (
      <div className="fixed z-50" style={{ left: x, top: y }}>
        <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
          <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
            Create Node
          </div>
          {availableNodeTypes.map(type => (
            <button
              key={type}
              onClick={() => handleAddNode(type)}
              className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded"
            >
              Add {nodeTypeLabels[type]}
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
  } else {
    const { fromElementType, onAddElement } = props;

    const availableElementTypes = getAvailableElementTypes(fromElementType);

    const handleAddElement = (type: NarrativeElement) => {
      onAddElement(type, graphX, graphY, {
        fromNodeId,
      });
      onClose();
    };

    return (
      <div className="fixed z-50" style={{ left: x, top: y }}>
        <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]">
          <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
            Create Element
          </div>
          {availableElementTypes.map(type => (
            <button
              key={type}
              onClick={() => handleAddElement(type)}
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
}
