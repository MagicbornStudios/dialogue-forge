import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Choice, ConditionalBlock, DialogueNode, DialogueTree } from '../types';
import { DialogueResult, FlagState } from '../types/game-state';
import { FlagSchema } from '../types/flags';
import { FLAG_TYPE, NODE_TYPE, type NodeType } from '../types/constants';
import { mergeFlagUpdates } from '../lib/flag-manager';
import { evaluateConditions } from '../lib/yarn-runner/condition-evaluator';

export interface DialogueHistoryEntry {
  nodeId: string;
  type: NodeType;
  speaker?: string;
  content: string;
}

export interface DialogueStep {
  nodeId: string;
  type: NodeType;
  speaker?: string;
  content: string;
  nextNodeId?: string;
  isChoice: boolean;
  isTerminal: boolean;
  choices: Choice[];
}

interface DialogueRunnerOptions {
  dialogue: DialogueTree;
  startNodeId?: string;
  initialFlags?: FlagState;
  flagSchema?: FlagSchema;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: FlagState) => void;
}

interface ResolvedConditionalBlock {
  block: ConditionalBlock | null;
  nextNodeId?: string;
}

function findMatchingBlock(
  blocks: ConditionalBlock[],
  flags: FlagState,
  memoryFlags: Set<string>
): ResolvedConditionalBlock {
  let matched: ConditionalBlock | null = null;

  for (const block of blocks) {
    if (block.type === 'else') {
      if (!matched) {
        matched = block;
      }
      continue;
    }

    if (!block.condition || block.condition.length === 0) {
      continue;
    }

    const allMatch = evaluateConditions(block.condition, flags, memoryFlags);
    if (allMatch) {
      matched = block;
      break;
    }
  }

  if (!matched) {
    return { block: null };
  }

  return {
    block: matched,
    nextNodeId: matched.nextNodeId,
  };
}

function evaluateNode(
  node: DialogueNode,
  flags: FlagState,
  memoryFlags: Set<string>
): DialogueStep {
  if (node.type === NODE_TYPE.PLAYER) {
    const availableChoices = node.choices?.filter(choice => {
      if (!choice.conditions) return true;
      return evaluateConditions(choice.conditions, flags, memoryFlags);
    }) || [];

    return {
      nodeId: node.id,
      type: node.type,
      content: node.content,
      speaker: node.speaker,
      nextNodeId: undefined,
      isChoice: true,
      isTerminal: availableChoices.length === 0,
      choices: availableChoices,
    };
  }

  if (node.type === NODE_TYPE.CONDITIONAL && node.conditionalBlocks) {
    const { block, nextNodeId } = findMatchingBlock(node.conditionalBlocks, flags, memoryFlags);

    if (!block) {
      return {
        nodeId: node.id,
        type: node.type,
        content: '',
        speaker: undefined,
        nextNodeId: undefined,
        isChoice: false,
        isTerminal: true,
        choices: [],
      };
    }

    return {
      nodeId: node.id,
      type: node.type,
      content: block.content,
      speaker: block.speaker,
      nextNodeId: nextNodeId ?? node.nextNodeId,
      isChoice: false,
      isTerminal: !nextNodeId && !node.nextNodeId,
      choices: [],
    };
  }

  let content = node.content;
  let speaker = node.speaker;
  let nextNodeId = node.nextNodeId;

  if (node.conditionalBlocks && node.conditionalBlocks.length > 0) {
    const { block, nextNodeId: conditionalNext } = findMatchingBlock(node.conditionalBlocks, flags, memoryFlags);
    if (block) {
      content = block.content;
      speaker = block.speaker ?? speaker;
      nextNodeId = conditionalNext ?? nextNodeId;
    }
  }

  return {
    nodeId: node.id,
    type: node.type,
    content,
    speaker,
    nextNodeId,
    isChoice: false,
    isTerminal: !nextNodeId,
    choices: [],
  };
}

function buildCompletionResult(
  dialogue: DialogueTree,
  flags: FlagState,
  visited: Set<string>
): DialogueResult {
  return {
    updatedFlags: flags,
    dialogueTree: dialogue,
    completedNodeIds: Array.from(visited),
    gameState: {
      flags,
    },
  };
}

function isDialogueFlag(flagId: string, flagSchema?: FlagSchema): boolean {
  if (!flagSchema) return false;
  const definition = flagSchema.flags.find(flag => flag.id === flagId);
  return definition?.type === FLAG_TYPE.DIALOGUE;
}

export function useDialogueRunner({
  dialogue,
  startNodeId,
  initialFlags,
  flagSchema,
  onComplete,
  onFlagsChange,
}: DialogueRunnerOptions) {
  const initialNodeId = startNodeId || dialogue.startNodeId;
  const [currentNodeId, setCurrentNodeId] = useState(initialNodeId);
  const [flags, setFlags] = useState<FlagState>(initialFlags || {});
  const [history, setHistory] = useState<DialogueHistoryEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<DialogueStep | null>(null);
  const [status, setStatus] = useState<'running' | 'completed'>('running');

  const visitedNodesRef = useRef<Set<string>>(new Set());
  const memoryFlagsRef = useRef<Set<string>>(new Set());
  const hasCompletedRef = useRef(false);
  const flagsRef = useRef(flags);

  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  useEffect(() => {
    if (onFlagsChange) {
      onFlagsChange(flags);
    }
  }, [flags, onFlagsChange]);

  useEffect(() => {
    visitedNodesRef.current = new Set();
    memoryFlagsRef.current = new Set(
      Object.keys(initialFlags || {}).filter(flagId => isDialogueFlag(flagId, flagSchema))
    );
    hasCompletedRef.current = false;
    setHistory([]);
    setFlags(initialFlags || {});
    setStatus('running');
    setCurrentNodeId(initialNodeId);
  }, [dialogue.id, initialNodeId, initialFlags, flagSchema]);

  const completeDialogue = useCallback(
    (latestFlags?: FlagState) => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setStatus('completed');

      const finalFlags = latestFlags || flagsRef.current;
      const result = buildCompletionResult(dialogue, finalFlags, visitedNodesRef.current);
      onComplete?.(result);
    },
    [dialogue, onComplete]
  );

  const applyFlagUpdates = useCallback(
    (updates: string[]): FlagState => {
      let nextFlags = flagsRef.current;

      setFlags(prevFlags => {
        const merged = mergeFlagUpdates(prevFlags, updates, flagSchema);
        nextFlags = merged;
        return merged;
      });

      updates.forEach(flagId => {
        if (isDialogueFlag(flagId, flagSchema)) {
          memoryFlagsRef.current.add(flagId);
        }
      });

      return nextFlags;
    },
    [flagSchema]
  );

  useEffect(() => {
    if (status === 'completed') return;

    const node = dialogue.nodes[currentNodeId];
    if (!node) {
      completeDialogue();
      return;
    }

    visitedNodesRef.current.add(node.id);

    const nextStep = evaluateNode(node, flagsRef.current, memoryFlagsRef.current);
    setCurrentStep(nextStep);

    if (!nextStep.isChoice) {
      setHistory(prev => [
        ...prev,
        {
          nodeId: node.id,
          type: node.type,
          speaker: nextStep.speaker,
          content: nextStep.content,
        },
      ]);

      if (node.setFlags && node.setFlags.length > 0) {
        const updated = applyFlagUpdates(node.setFlags);
        if (nextStep.isTerminal && !nextStep.nextNodeId) {
          completeDialogue(updated);
          return;
        }
      }

      if (nextStep.isTerminal && !nextStep.nextNodeId) {
        completeDialogue();
      }
    } else if (nextStep.isTerminal) {
      completeDialogue();
    }
  }, [dialogue, currentNodeId, completeDialogue, applyFlagUpdates, status]);

  const continueDialogue = useCallback(() => {
    if (status === 'completed') return;
    if (!currentStep) return;

    if (currentStep.nextNodeId) {
      setCurrentNodeId(currentStep.nextNodeId);
      return;
    }

    completeDialogue();
  }, [completeDialogue, currentStep, status]);

  const chooseOption = useCallback(
    (choiceId: string) => {
      if (status === 'completed') return;
      if (!currentStep || !currentStep.isChoice) return;

      const choice = currentStep.choices.find(option => option.id === choiceId);
      if (!choice) return;

      setHistory(prev => [
        ...prev,
        {
          nodeId: choice.id,
          type: NODE_TYPE.PLAYER,
          content: choice.text,
        },
      ]);

      let latestFlags: FlagState | undefined;
      if (choice.setFlags && choice.setFlags.length > 0) {
        latestFlags = applyFlagUpdates(choice.setFlags);
      }

      if (choice.nextNodeId) {
        setCurrentNodeId(choice.nextNodeId);
      } else {
        completeDialogue(latestFlags);
      }
    },
    [applyFlagUpdates, completeDialogue, currentStep, status]
  );

  const resetDialogue = useCallback(() => {
    visitedNodesRef.current = new Set();
    memoryFlagsRef.current = new Set(
      Object.keys(initialFlags || {}).filter(flagId => isDialogueFlag(flagId, flagSchema))
    );
    hasCompletedRef.current = false;
    setHistory([]);
    setFlags(initialFlags || {});
    setStatus('running');
    setCurrentNodeId(initialNodeId);
    setCurrentStep(null);
  }, [flagSchema, initialFlags, initialNodeId]);

  const availableChoices = useMemo(() => {
    if (!currentStep || !currentStep.isChoice) return [];
    return currentStep.choices;
  }, [currentStep]);

  return {
    status,
    flags,
    history,
    currentNodeId,
    currentStep,
    availableChoices,
    continueDialogue,
    chooseOption,
    resetDialogue,
    visitedNodeIds: Array.from(visitedNodesRef.current),
  };
}
