import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { DialogueTree, DialogueNode, Choice, Condition, StoryletPoolItem } from '../types';
import { FlagState, DialogueResult, BaseGameState } from '../types/game-state';
import { Storylet } from '../types/narrative';
import { NODE_TYPE } from '../types/constants';
import { evaluateConditions, VariableState } from '../lib/yarn-runner/condition-evaluator';
import { mergeFlagUpdates } from '../lib/flag-manager';

export interface HistoryEntry {
  nodeId: string;
  type: 'npc' | 'player' | 'system';
  speaker?: string;
  content: string;
  timestamp: number;
}

export interface DialogueStackEntry {
  dialogueTree: DialogueTree;
  currentNodeId: string;
  history: HistoryEntry[];
  returnNodeId?: string;
}

export interface DialogueRunnerConfig<T extends BaseGameState> {
  dialogue: DialogueTree;
  gameState: T;
  onStateChange?: (state: T) => void;
  storylets?: Record<string, Storylet>;
  startNodeId?: string;
  onNodeEnter?: (nodeId: string, node: DialogueNode) => void;
  onNodeExit?: (nodeId: string, node: DialogueNode) => void;
  onChoiceSelect?: (nodeId: string, choice: Choice) => void;
  onDialogueStart?: () => void;
  onDialogueEnd?: () => void;
}

export interface DialogueRunnerState {
  currentNode: DialogueNode | null;
  currentNodeId: string | null;
  history: HistoryEntry[];
  availableChoices: Choice[];
  isTyping: boolean;
  isComplete: boolean;
  visitedNodes: Set<string>;
  stackDepth: number;
}

export interface DialogueRunnerActions {
  advance: () => void;
  selectChoice: (choiceIndex: number) => void;
  reset: () => void;
  getResult: () => DialogueResult;
}

export function useDialogueRunner<T extends BaseGameState>(
  config: DialogueRunnerConfig<T>
): DialogueRunnerState & DialogueRunnerActions {
  const {
    dialogue,
    gameState,
    onStateChange,
    storylets = {},
    startNodeId,
    onNodeEnter,
    onNodeExit,
    onChoiceSelect,
    onDialogueStart,
    onDialogueEnd,
  } = config;

  const flags = gameState.flags ?? {};

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    startNodeId || dialogue.startNodeId
  );
  const [localFlags, setLocalFlags] = useState<FlagState>(flags);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());

  const dialogueStackRef = useRef<DialogueStackEntry[]>([]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const currentDialogueRef = useRef<DialogueTree>(dialogue);

  useEffect(() => {
    currentDialogueRef.current = dialogue;
  }, [dialogue]);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onDialogueStart?.();
    }
  }, [onDialogueStart]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const currentNode = useMemo(() => {
    if (!currentNodeId) return null;
    return currentDialogueRef.current.nodes[currentNodeId] || null;
  }, [currentNodeId]);

  const evaluateChoiceConditions = useCallback(
    (conditions: Condition[] | undefined): boolean => {
      if (!conditions || conditions.length === 0) return true;
      const variables: VariableState = { ...localFlags };
      return evaluateConditions(conditions, variables);
    },
    [localFlags]
  );

  const availableChoices = useMemo(() => {
    if (!currentNode || currentNode.type !== NODE_TYPE.PLAYER) return [];
    if (!currentNode.choices) return [];

    return currentNode.choices.filter((choice) =>
      evaluateChoiceConditions(choice.conditions)
    );
  }, [currentNode, evaluateChoiceConditions]);

  const updateGameState = useCallback(
    (newFlags: FlagState) => {
      setLocalFlags(newFlags);
      if (onStateChange) {
        const newState = {
          ...gameState,
          flags: newFlags,
        } as T;
        onStateChange(newState);
      }
    },
    [gameState, onStateChange]
  );

  const addToHistory = useCallback(
    (entry: Omit<HistoryEntry, 'timestamp'>) => {
      setHistory((prev) => [...prev, { ...entry, timestamp: Date.now() }]);
    },
    []
  );

  const completeDialogue = useCallback(() => {
    if (dialogueStackRef.current.length > 0) {
      const stackEntry = dialogueStackRef.current.pop()!;
      currentDialogueRef.current = stackEntry.dialogueTree;
      setHistory(stackEntry.history);

      if (stackEntry.returnNodeId) {
        setCurrentNodeId(stackEntry.returnNodeId);
      } else {
        setIsComplete(true);
        onDialogueEnd?.();
      }
    } else {
      setIsComplete(true);
      onDialogueEnd?.();
    }
  }, [onDialogueEnd]);

  const selectFromPool = useCallback(
    (pool: StoryletPoolItem[]): StoryletPoolItem | null => {
      const eligibleItems = pool.filter((item) => {
        if (!item.conditions || item.conditions.length === 0) return true;
        const variables: VariableState = { ...localFlags };
        return evaluateConditions(item.conditions, variables);
      });

      if (eligibleItems.length === 0) return null;

      const totalWeight = eligibleItems.reduce(
        (sum, item) => sum + (item.weight ?? 1),
        0
      );
      let random = Math.random() * totalWeight;

      for (const item of eligibleItems) {
        random -= item.weight ?? 1;
        if (random <= 0) return item;
      }

      return eligibleItems[eligibleItems.length - 1];
    },
    [localFlags]
  );

  const pushStoryletDialogue = useCallback(
    (storyletId: string, returnNodeId?: string) => {
      const storylet = storylets[storyletId];
      if (!storylet?.dialogueTree) {
        if (returnNodeId) {
          setCurrentNodeId(returnNodeId);
        } else {
          completeDialogue();
        }
        return;
      }

      dialogueStackRef.current.push({
        dialogueTree: currentDialogueRef.current,
        currentNodeId: currentNodeId || '',
        history: [...history],
        returnNodeId,
      });

      currentDialogueRef.current = storylet.dialogueTree;
      setHistory([]);
      setCurrentNodeId(storylet.dialogueTree.startNodeId);
    },
    [storylets, currentNodeId, history, completeDialogue]
  );

  const processNode = useCallback(
    (node: DialogueNode, nodeId: string) => {
      onNodeEnter?.(nodeId, node);
      setVisitedNodes((prev) => new Set([...prev, nodeId]));

      switch (node.type) {
        case NODE_TYPE.NPC: {
          setIsTyping(true);
          typingTimerRef.current = setTimeout(() => {
            if (node.setFlags && node.setFlags.length > 0) {
              const updated = mergeFlagUpdates(localFlags, node.setFlags);
              updateGameState(updated);
            }

            addToHistory({
              nodeId,
              type: 'npc',
              speaker: node.speaker,
              content: node.content,
            });

            setIsTyping(false);
            onNodeExit?.(nodeId, node);

            if (!node.nextNodeId) {
              completeDialogue();
            }
          }, 400);
          break;
        }

        case NODE_TYPE.PLAYER: {
          break;
        }

        case NODE_TYPE.CONDITIONAL: {
          if (!node.conditionalBlocks || node.conditionalBlocks.length === 0) {
            completeDialogue();
            return;
          }

          const variables: VariableState = { ...localFlags };

          for (const block of node.conditionalBlocks) {
            if (block.type === 'else') {
              if (block.content) {
                addToHistory({
                  nodeId,
                  type: 'npc',
                  speaker: block.speaker,
                  content: block.content,
                });
              }
              onNodeExit?.(nodeId, node);
              if (block.nextNodeId) {
                setCurrentNodeId(block.nextNodeId);
              } else {
                completeDialogue();
              }
              return;
            }

            if (block.condition && evaluateConditions(block.condition, variables)) {
              if (block.content) {
                addToHistory({
                  nodeId,
                  type: 'npc',
                  speaker: block.speaker,
                  content: block.content,
                });
              }
              onNodeExit?.(nodeId, node);
              if (block.nextNodeId) {
                setCurrentNodeId(block.nextNodeId);
              } else {
                completeDialogue();
              }
              return;
            }
          }

          onNodeExit?.(nodeId, node);
          completeDialogue();
          break;
        }

        case NODE_TYPE.STORYLET: {
          if (node.storyletId) {
            pushStoryletDialogue(node.storyletId, node.nextNodeId);
          } else if (node.nextNodeId) {
            setCurrentNodeId(node.nextNodeId);
          } else {
            completeDialogue();
          }
          break;
        }

        case NODE_TYPE.RANDOMIZER: {
          if (node.storyletPool && node.storyletPool.length > 0) {
            const selected = selectFromPool(node.storyletPool);
            if (selected) {
              pushStoryletDialogue(selected.storyletId, node.nextNodeId);
            } else if (node.nextNodeId) {
              setCurrentNodeId(node.nextNodeId);
            } else {
              completeDialogue();
            }
          } else if (node.nextNodeId) {
            setCurrentNodeId(node.nextNodeId);
          } else {
            completeDialogue();
          }
          break;
        }

        default:
          if (node.nextNodeId) {
            setCurrentNodeId(node.nextNodeId);
          } else {
            completeDialogue();
          }
      }
    },
    [
      onNodeEnter,
      onNodeExit,
      localFlags,
      updateGameState,
      addToHistory,
      completeDialogue,
      pushStoryletDialogue,
      selectFromPool,
    ]
  );

  useEffect(() => {
    if (!currentNodeId || isComplete) return;

    const node = currentDialogueRef.current.nodes[currentNodeId];
    if (!node) {
      completeDialogue();
      return;
    }

    processNode(node, currentNodeId);
  }, [currentNodeId, isComplete, processNode, completeDialogue]);

  const advance = useCallback(() => {
    if (isTyping || isComplete) return;
    if (!currentNode) return;

    if (currentNode.type === NODE_TYPE.NPC && currentNode.nextNodeId) {
      setCurrentNodeId(currentNode.nextNodeId);
    }
  }, [isTyping, isComplete, currentNode]);

  const selectChoice = useCallback(
    (choiceIndex: number) => {
      if (isTyping || isComplete) return;
      if (!currentNode || currentNode.type !== NODE_TYPE.PLAYER) return;

      const choice = availableChoices[choiceIndex];
      if (!choice) return;

      onChoiceSelect?.(currentNodeId!, choice);
      onNodeExit?.(currentNodeId!, currentNode);

      addToHistory({
        nodeId: choice.id,
        type: 'player',
        content: choice.text,
      });

      if (choice.setFlags && choice.setFlags.length > 0) {
        const updated = mergeFlagUpdates(localFlags, choice.setFlags);
        updateGameState(updated);
      }

      if (choice.nextNodeId) {
        setCurrentNodeId(choice.nextNodeId);
      } else {
        completeDialogue();
      }
    },
    [
      isTyping,
      isComplete,
      currentNode,
      currentNodeId,
      availableChoices,
      localFlags,
      onChoiceSelect,
      onNodeExit,
      addToHistory,
      updateGameState,
      completeDialogue,
    ]
  );

  const reset = useCallback(() => {
    dialogueStackRef.current = [];
    currentDialogueRef.current = dialogue;
    setCurrentNodeId(startNodeId || dialogue.startNodeId);
    setLocalFlags(flags);
    setHistory([]);
    setIsTyping(false);
    setIsComplete(false);
    setVisitedNodes(new Set());
    hasStartedRef.current = false;
  }, [dialogue, startNodeId, flags]);

  const getResult = useCallback((): DialogueResult => {
    return {
      updatedFlags: localFlags,
      dialogueTree: dialogue,
      completedNodeIds: Array.from(visitedNodes),
    };
  }, [localFlags, dialogue, visitedNodes]);

  return {
    currentNode,
    currentNodeId,
    history,
    availableChoices,
    isTyping,
    isComplete,
    visitedNodes,
    stackDepth: dialogueStackRef.current.length,
    advance,
    selectChoice,
    reset,
    getResult,
  };
}
