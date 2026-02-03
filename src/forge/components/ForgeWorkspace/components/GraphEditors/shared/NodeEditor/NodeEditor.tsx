import React, { useState, useEffect, useRef } from 'react';
import { ForgeGraphDoc, ForgeNode, ForgeStoryletCall } from '@/forge/types/forge-graph';
import { FlagSchema } from '@/forge/types/flags';
import { ForgeCharacter } from '@/forge/types/characters';
import { useConditionInputs } from '@/forge/lib/node-editor/hooks/useConditionInputs';
import { useChoices } from '@/forge/lib/node-editor/hooks/useChoices';
import { getNodeTypeBorderColor } from '@/forge/lib/node-editor/utils/nodeTypeHelpers';
import { NodeEditorHeader } from './NodeEditorHeader';
import { NodeEditorIdField } from './NodeEditorIdField';
import { NodeEditorFields } from './NodeEditorFields';
import { NodeEditorSetFlagsField } from './NodeEditorSetFlagsField';
import { NodeEditorRuntimeDirectivesField } from './NodeEditorRuntimeDirectivesField';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { cn } from '@/shared/lib/utils';

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

  const isDocked = useForgeWorkspaceStore((s) => s.panelLayout.nodeEditor.isDocked);
  
  // Track previous state for exit animation
  const prevDocked = useRef(isDocked);
  const [isExiting, setIsExiting] = useState(false);

  // Handle exit animation
  useEffect(() => {
    if (prevDocked.current && !isDocked) {
      setIsExiting(true);
      const timer = setTimeout(() => setIsExiting(false), 300);
      return () => clearTimeout(timer);
    }
    prevDocked.current = isDocked;
  }, [isDocked]);

  const content = (
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
      <NodeEditorRuntimeDirectivesField node={node} />
    </div>
  );

  if (isDocked || isExiting) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeOutScale {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.98);
            }
          }
        `}} />
        <div 
          className="fixed inset-0 z-50 bg-df-sidebar-bg overflow-y-auto"
          style={{
            animation: isDocked
              ? 'fadeInScale 300ms ease-in-out forwards'
              : 'fadeOutScale 300ms ease-in-out forwards',
          }}
        >
          <div className="max-w-4xl mx-auto">
            {content}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <aside className={cn(`w-80 border-l ${getNodeTypeBorderColor(node.type)} bg-df-sidebar-bg overflow-y-auto`)}>
        {content}
      </aside>
    </>
  );
}
