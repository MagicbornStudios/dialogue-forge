import { useState, useEffect, useRef } from 'react';
import { DialogueNode, ConditionalBlock, Choice } from '../../../../types';
import { conditionToString } from '../../../utils/condition-utils';

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

export function useConditionInputs(node: DialogueNode): UseConditionInputsResult {
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
    }
    
    // Always sync condition inputs with actual block conditions
    if (node.conditionalBlocks) {
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = { ...prev };
        node.conditionalBlocks!.forEach(block => {
          if (block.type !== 'else') {
            if (block.condition && block.condition.length > 0) {
              const conditionStr = conditionToString(block.condition);
              if (newInputs[block.id] !== conditionStr) {
                newInputs[block.id] = conditionStr;
              }
            } else {
              if (newInputs[block.id] === undefined || newInputs[block.id] !== '') {
                newInputs[block.id] = '';
              }
            }
          }
        });
        // Remove inputs for blocks that no longer exist
        const blockIds = new Set(node.conditionalBlocks!.map(b => b.id));
        Object.keys(newInputs).forEach(id => {
          if (!blockIds.has(id) && !id.startsWith('choice-')) {
            delete newInputs[id];
            initializedBlocksRef.current.delete(id);
          }
        });
        return newInputs;
      });
    } else {
      // Clear block inputs but keep choice inputs
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = {};
        Object.keys(prev).forEach(key => {
          if (key.startsWith('choice-')) {
            newInputs[key] = prev[key];
          }
        });
        return newInputs;
      });
      initializedBlocksRef.current.clear();
    }
    
    // Always sync choice condition inputs with actual choice data
    if (node.choices) {
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = { ...prev };
        node.choices!.forEach(choice => {
          const choiceKey = `choice-${choice.id}`;
          if (choice.conditions && choice.conditions.length > 0) {
            const conditionStr = conditionToString(choice.conditions);
            if (newInputs[choiceKey] !== conditionStr) {
              newInputs[choiceKey] = conditionStr;
            }
          } else if (choice.conditions !== undefined) {
            if (newInputs[choiceKey] === undefined || newInputs[choiceKey] !== '') {
              newInputs[choiceKey] = '';
            }
          } else {
            if (newInputs[choiceKey] !== undefined) {
              delete newInputs[choiceKey];
            }
          }
          if (!initializedChoicesRef.current.has(choiceKey)) {
            initializedChoicesRef.current.add(choiceKey);
          }
        });
        // Remove inputs for choices that no longer exist
        const choiceIds = new Set(node.choices!.map(c => `choice-${c.id}`));
        Object.keys(newInputs).forEach(key => {
          if (key.startsWith('choice-') && !choiceIds.has(key)) {
            delete newInputs[key];
            initializedChoicesRef.current.delete(key);
          }
        });
        return newInputs;
      });
    } else {
      // Clear choice inputs
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = {};
        Object.keys(prev).forEach(key => {
          if (!key.startsWith('choice-')) {
            newInputs[key] = prev[key];
          }
        });
        return newInputs;
      });
      initializedChoicesRef.current.clear();
    }
  }, [node.id, node.conditionalBlocks?.length, node.choices?.length]);

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
