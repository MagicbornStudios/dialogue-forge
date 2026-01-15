import React from 'react';
import { ForgeGraphDoc, ForgeNode, ForgeStoryletCall } from '@/forge/types/forge-graph';
import { FlagSchema } from '@/forge/types/flags';
import { ForgeCharacter } from '@/forge/types/characters';
import { useConditionInputs } from './hooks/useConditionInputs';
import { useChoices } from './hooks/useChoices';
import { getNodeTypeBorderColor } from './utils/nodeTypeHelpers';
import { NodeEditorStyles } from './components/NodeEditorStyles';
import { NodeEditorHeader } from './components/NodeEditorHeader';
import { NodeEditorIdField } from './components/NodeEditorIdField';
import { NodeEditorFields } from './components/NodeEditorFields';
import { NodeEditorSetFlagsField } from './components/NodeEditorSetFlagsField';

interface NodeEditorProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onDelete: () => void;
  onClose: () => void;
  onPlayFromHere?: (nodeId: string) => void;
  onFocusNode?: (nodeId: string) => void;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
}

export function NodeEditor({
  node,
  graph,
  onUpdate,
  onDelete,
  onClose,
  onFocusNode,
  flagSchema,
  characters = {},
}: NodeEditorProps) {
  const {
    conditionInputs,
    debouncedConditionInputs,
    dismissedConditions,
    expandedConditions,
    setConditionInputs,
    setDebouncedConditionInputs,
    setDismissedConditions,
    setExpandedConditions,
    debounceTimersRef,
  } = useConditionInputs(node);

  const {
    choiceInputs,
    debouncedChoiceInputs,
    expandedChoices,
    dismissedChoices,
    setChoiceInputs,
  } = useChoices(node);

  const handleStoryletCallUpdate = (updates: Partial<NonNullable<ForgeNode['storyletCall']>>) => {
    const nextStoryletCall = {
      ...(node.storyletCall ?? {}),
      ...updates,
    };
    const hasValues = Object.values(nextStoryletCall).some(
      value => value !== undefined && value !== ''
    );
    onUpdate({ storyletCall: hasValues ? nextStoryletCall as ForgeStoryletCall : undefined });
  };

  return (
    <>
      <NodeEditorStyles />
      <aside className={`w-80 border-l ${getNodeTypeBorderColor(node.type)} bg-df-sidebar-bg overflow-y-auto`}>
        <div className="p-4 space-y-4">
          <NodeEditorHeader node={node} onDelete={onDelete} onClose={onClose} />
          <NodeEditorIdField node={node} />
          <NodeEditorFields
            node={node}
            graph={graph}
            onUpdate={onUpdate}
            onFocusNode={onFocusNode}
            flagSchema={flagSchema}
            characters={characters}
            conditionInputs={conditionInputs}
            debouncedConditionInputs={debouncedConditionInputs}
            dismissedConditions={dismissedConditions}
            expandedConditions={expandedConditions}
            setConditionInputs={setConditionInputs}
            setDebouncedConditionInputs={setDebouncedConditionInputs}
            setDismissedConditions={setDismissedConditions}
            setExpandedConditions={setExpandedConditions}
            debounceTimersRef={debounceTimersRef}
            choiceInputs={choiceInputs}
            debouncedChoiceInputs={debouncedChoiceInputs}
            expandedChoices={expandedChoices}
            dismissedChoices={dismissedChoices}
            setChoiceInputs={setChoiceInputs}
            onUpdateStoryletCall={handleStoryletCallUpdate}
          />
          <NodeEditorSetFlagsField node={node} flagSchema={flagSchema} onUpdate={onUpdate} />
        </div>
      </aside>
    </>
  );
}
