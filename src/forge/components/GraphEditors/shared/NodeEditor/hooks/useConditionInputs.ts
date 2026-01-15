import { useState, useEffect, useRef } from 'react';
import { ForgeNode, FORGE_CONDITIONAL_BLOCK_TYPE } from '@/forge/types/forge-graph';
import { conditionToString } from '@/forge/components/GraphEditors/utils/condition-utils';

interface UseConditionInputsResult {
  conditionInputs: Record<string, string>;
  debouncedConditionInputs: Record<string, string>;
  dismissedConditions: Set<string>;
  expandedConditions: Set<string>;
  setConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDebouncedConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDismissedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  debounceTimersRef: React.MutableRefObject<Record<string, NodeJS.Timeout>>;
}

export function useConditionInputs(node: ForgeNode): UseConditionInputsResult {
  const [conditionInputs, setConditionInputs] = useState<Record<string, string>>({});
  const [debouncedConditionInputs, setDebouncedConditionInputs] = useState<Record<string, string>>({});
  const [dismissedConditions, setDismissedConditions] = useState<Set<string>>(new Set());
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set());
  const prevNodeIdRef = useRef<string>(node.id);
  const initializedBlocksRef = useRef<Set<string>>(new Set());
  const initializedChoicesRef = useRef<Set<string>>(new Set());
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Clear everything when switching to a different node
    if (prevNodeIdRef.current !== node.id) {
      prevNodeIdRef.current = node.id;
      setConditionInputs({});
      setDismissedConditions(new Set());
      setExpandedConditions(new Set());
      initializedBlocksRef.current.clear();
      initializedChoicesRef.current.clear();
      return; // Early return to avoid syncing on node change
    }
    
    // Sync condition inputs with actual block conditions using functional update
    setConditionInputs(prev => {
      let newInputs: Record<string, string> = { ...prev };
      let hasChanges = false;
      
      // Handle conditional blocks
      if (node.conditionalBlocks) {
        node.conditionalBlocks.forEach(block => {
          if (block.type !== FORGE_CONDITIONAL_BLOCK_TYPE.ELSE) {
            if (block.condition && block.condition.length > 0) {
              const conditionStr = conditionToString(block.condition);
              if (newInputs[block.id] !== conditionStr) {
                newInputs[block.id] = conditionStr;
                hasChanges = true;
              }
            } else {
              if (newInputs[block.id] === undefined || newInputs[block.id] !== '') {
                newInputs[block.id] = '';
                hasChanges = true;
              }
            }
          }
        });
        // Remove inputs for blocks that no longer exist
        const blockIds = new Set(node.conditionalBlocks.map(b => b.id));
        Object.keys(newInputs).forEach(id => {
          if (!blockIds.has(id) && !id.startsWith('choice-')) {
            delete newInputs[id];
            initializedBlocksRef.current.delete(id);
            hasChanges = true;
          }
        });
      } else {
        // Clear block inputs but keep choice inputs
        const blockInputsRemoved = Object.keys(newInputs).some(key => !key.startsWith('choice-'));
        if (blockInputsRemoved) {
          newInputs = Object.keys(newInputs).reduce((acc, key) => {
            if (key.startsWith('choice-')) {
              acc[key] = newInputs[key];
            }
            return acc;
          }, {} as Record<string, string>);
          initializedBlocksRef.current.clear();
          hasChanges = true;
        }
      }
      
      // Handle choice conditions
      if (node.choices) {
        node.choices.forEach(choice => {
          const choiceKey = `choice-${choice.id}`;
          if (choice.conditions && choice.conditions.length > 0) {
            const conditionStr = conditionToString(choice.conditions);
            if (newInputs[choiceKey] !== conditionStr) {
              newInputs[choiceKey] = conditionStr;
              hasChanges = true;
            }
          } else if (choice.conditions !== undefined) {
            if (newInputs[choiceKey] === undefined || newInputs[choiceKey] !== '') {
              newInputs[choiceKey] = '';
              hasChanges = true;
            }
          } else {
            if (newInputs[choiceKey] !== undefined) {
              delete newInputs[choiceKey];
              hasChanges = true;
            }
          }
          if (!initializedChoicesRef.current.has(choiceKey)) {
            initializedChoicesRef.current.add(choiceKey);
          }
        });
        // Remove inputs for choices that no longer exist
        const choiceIds = new Set(node.choices.map(c => `choice-${c.id}`));
        Object.keys(newInputs).forEach(key => {
          if (key.startsWith('choice-') && !choiceIds.has(key)) {
            delete newInputs[key];
            initializedChoicesRef.current.delete(key);
            hasChanges = true;
          }
        });
      } else {
        // Clear choice inputs
        const choiceInputsRemoved = Object.keys(newInputs).some(key => key.startsWith('choice-'));
        if (choiceInputsRemoved) {
          newInputs = Object.keys(newInputs).reduce((acc, key) => {
            if (!key.startsWith('choice-')) {
              acc[key] = newInputs[key];
            }
            return acc;
          }, {} as Record<string, string>);
          initializedChoicesRef.current.clear();
          hasChanges = true;
        }
      }
      
      // Only return new object if changes were made
      return hasChanges ? newInputs : prev;
    });
  }, [node.id, node.conditionalBlocks, node.choices]);

  return {
    conditionInputs,
    debouncedConditionInputs,
    dismissedConditions,
    expandedConditions,
    setConditionInputs,
    setDebouncedConditionInputs,
    setDismissedConditions,
    setExpandedConditions,
    debounceTimersRef,
  };
}
