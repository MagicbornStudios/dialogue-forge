
import { ForgeChoice, ForgeNode } from '@/src/types/forge/forge-graph';
import { useState, useEffect, useRef } from 'react';

interface UseChoicesResult {
  choiceInputs: Record<string, Partial<ForgeChoice>>;
  debouncedChoiceInputs: Record<string, Partial<ForgeChoice>>;
  expandedChoices: Set<string>;
  dismissedChoices: Set<string>;
  setChoiceInputs: React.Dispatch<React.SetStateAction<Record<string, Partial<ForgeChoice>>>>;
  setDebouncedChoiceInputs: React.Dispatch<React.SetStateAction<Record<string, Partial<ForgeChoice>>>>;
  setExpandedChoices: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDismissedChoices: React.Dispatch<React.SetStateAction<Set<string>>>;
  debounceTimersRef: React.MutableRefObject<Record<string, NodeJS.Timeout>>;
}

export function useChoices(node: ForgeNode): UseChoicesResult {
  const [choiceInputs, setChoiceInputs] = useState<Record<string, Partial<ForgeChoice>>>({});
  const [debouncedChoiceInputs, setDebouncedChoiceInputs] = useState<Record<string, Partial<ForgeChoice>>>({});
  const [expandedChoices, setExpandedChoices] = useState<Set<string>>(new Set());
  const [dismissedChoices, setDismissedChoices] = useState<Set<string>>(new Set());
  const prevNodeIdRef = useRef<string>(node.id);
  const initializedChoicesRef = useRef<Set<string>>(new Set());
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // Clear everything when switching to a different node
    if (prevNodeIdRef.current !== node.id) {
      prevNodeIdRef.current = node.id;
      setChoiceInputs({});
      setDebouncedChoiceInputs({});
      setDismissedChoices(new Set());
      setExpandedChoices(new Set());
      initializedChoicesRef.current.clear();
    }
    
    // Always sync choice inputs with actual choice data
    if (node.choices) {
        const newInputs: Record<string, Partial<ForgeChoice>> = { ...choiceInputs };
        node.choices!.forEach((choice: ForgeChoice) => {
          const choiceKey = choice.id;
          if (!initializedChoicesRef.current.has(choiceKey)) {
            newInputs[choiceKey] = choice;
            initializedChoicesRef.current.add(choiceKey);
          } else {
            const currentInput = newInputs[choiceKey];
            if (currentInput) {
              if (currentInput.text !== choice.text) {
                newInputs[choiceKey] = { ...currentInput, text: choice.text };
              }
              if (currentInput.nextNodeId !== choice.nextNodeId) {
                newInputs[choiceKey] = { ...currentInput, nextNodeId: choice.nextNodeId };
              }
              if (JSON.stringify(currentInput.setFlags) !== JSON.stringify(choice.setFlags)) {
                newInputs[choiceKey] = { ...currentInput, setFlags: choice.setFlags };
              }
            }
          }
        });
        const choiceIds = new Set(node.choices!.map((c: ForgeChoice) => c.id));
        Object.keys(newInputs).forEach((key: string) => {
          if (!choiceIds.has(key)) {
            delete newInputs[key];
            initializedChoicesRef.current.delete(key);
          }
        });
        setChoiceInputs(newInputs);
    } else {
      setChoiceInputs({ ...choiceInputs });
    }
  }, [node.id, node.choices?.length, choiceInputs]);

  useEffect(() => {
    Object.keys(choiceInputs).forEach((choiceKey: string) => {
      if (debounceTimersRef.current[choiceKey]) {
        clearTimeout(debounceTimersRef.current[choiceKey]);
      }
      
      // Set new timer
      debounceTimersRef.current[choiceKey] = setTimeout(() => {
        setDebouncedChoiceInputs(prev => ({
          ...prev,
          [choiceKey]: choiceInputs[choiceKey],
        }));
      }, 300);
    });

    // Cleanup timers on unmount
    return () => {
      Object.values(debounceTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, [choiceInputs]);

  return {
    choiceInputs,
    debouncedChoiceInputs,
    expandedChoices,
    dismissedChoices,
    setChoiceInputs,
    setDebouncedChoiceInputs,
    setExpandedChoices,
    setDismissedChoices,
    debounceTimersRef,
  };
}
