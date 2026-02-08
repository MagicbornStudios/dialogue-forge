import React from 'react';
import { ForgeGraphDoc, ForgeNode, ForgeStoryletCall, ForgeChoice, FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { FlagSchema } from '@magicborn/forge/types/flags';
import { ForgeCharacter } from '@magicborn/forge/types/characters';
import { PAGE_TYPE, type ForgePage } from '@magicborn/forge/types/narrative';
import { CharacterNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/CharacterNode/CharacterNodeFields';
import { StoryletNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletNodeFields';
import { ConditionalNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalNodeFields';
import { PlayerNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PlayerNode/PlayerNodeFields';
import { DetourNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/DetourNode/DetourNodeFields';
import { ActNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ActNode/ActNodeFields';
import { ChapterNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ChapterNode/ChapterNodeFields';
import { PageNodeFields } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PageNode/PageNodeFields';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useForgePages } from '@magicborn/forge/data/forge-queries';

interface NodeEditorFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  flagSchema?: FlagSchema;
  characters?: Record<string, ForgeCharacter>;
  // Condition inputs state
  conditionInputs: Record<string, string>;
  debouncedConditionInputs: Record<string, string>;
  dismissedConditions: Set<string>;
  expandedConditions: Set<string>;
  setConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDebouncedConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDismissedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  debounceTimersRef: React.MutableRefObject<Record<string, NodeJS.Timeout>>;
  // Choice inputs state
  choiceInputs: Record<string, Partial<ForgeChoice>>;
  debouncedChoiceInputs: Record<string, Partial<ForgeChoice>>;
  expandedChoices: Set<string>;
  dismissedChoices: Set<string>;
  setChoiceInputs: React.Dispatch<React.SetStateAction<Record<string, Partial<ForgeChoice>>>>;
  // Storylet call handler
  onUpdateStoryletCall: (updates: Partial<NonNullable<ForgeNode['storyletCall']>>) => void;
}

export function NodeEditorFields({
  node,
  graph,
  onUpdate,
  onFocusNode,
  flagSchema,
  characters = {},
  conditionInputs,
  debouncedConditionInputs,
  dismissedConditions,
  expandedConditions,
  setConditionInputs,
  setDebouncedConditionInputs,
  setDismissedConditions,
  setExpandedConditions,
  debounceTimersRef,
  choiceInputs,
  debouncedChoiceInputs,
  expandedChoices,
  dismissedChoices,
  setChoiceInputs,
  onUpdateStoryletCall,
}: NodeEditorFieldsProps) {
  const selectedProjectId = useForgeWorkspaceStore((s) => s.selectedProjectId);

  const isNarrativePageNode =
    node.type === FORGE_NODE_TYPE.ACT ||
    node.type === FORGE_NODE_TYPE.CHAPTER ||
    node.type === FORGE_NODE_TYPE.PAGE;

  const projectId = graph.project ?? selectedProjectId;
  const shouldFetchPages = isNarrativePageNode && !!projectId;
  const pagesQuery = useForgePages(
    shouldFetchPages ? projectId : null,
    shouldFetchPages ? graph.id : null
  );
  const narrativePages: ForgePage[] = pagesQuery.data ?? [];
  const isLoadingPages = pagesQuery.isLoading;

  switch (node.type) {
    case FORGE_NODE_TYPE.ACT:
      return (
        <ActNodeFields
          node={node}
          pages={narrativePages.filter((page) => page.pageType === PAGE_TYPE.ACT)}
          isLoading={isLoadingPages}
          onUpdate={onUpdate}
        />
      );

    case FORGE_NODE_TYPE.CHAPTER:
      return (
        <ChapterNodeFields
          node={node}
          pages={narrativePages.filter((page) => page.pageType === PAGE_TYPE.CHAPTER)}
          isLoading={isLoadingPages}
          onUpdate={onUpdate}
        />
      );

    case FORGE_NODE_TYPE.PAGE:
      return (
        <PageNodeFields
          node={node}
          pages={narrativePages.filter((page) => page.pageType === PAGE_TYPE.PAGE)}
          isLoading={isLoadingPages}
          onUpdate={onUpdate}
        />
      );

    case FORGE_NODE_TYPE.CHARACTER:
      return (
        <CharacterNodeFields
          node={node}
          graph={graph}
          characters={characters}
          onUpdate={onUpdate}
          onFocusNode={onFocusNode}
        />
      );

    case FORGE_NODE_TYPE.PLAYER:
      return (
        <PlayerNodeFields
          node={node}
          graph={graph}
          characters={characters}
          flagSchema={flagSchema}
          conditionInputs={conditionInputs}
          debouncedConditionInputs={debouncedConditionInputs}
          choiceInputs={choiceInputs}
          debouncedChoiceInputs={debouncedChoiceInputs}
          expandedChoices={expandedChoices}
          dismissedChoices={dismissedChoices}
          onUpdate={onUpdate}
          onFocusNode={onFocusNode}
          setConditionInputs={setConditionInputs}
          setChoiceInputs={setChoiceInputs}
        />
      );

    case FORGE_NODE_TYPE.STORYLET:
      return (
        <StoryletNodeFields
          node={node}
          graph={graph}
          onUpdate={onUpdate}
          onFocusNode={onFocusNode}
          onUpdateStoryletCall={onUpdateStoryletCall}
        />
      );

    case FORGE_NODE_TYPE.CONDITIONAL:
      return (
        <ConditionalNodeFields
          node={node}
          graph={graph}
          characters={characters}
          flagSchema={flagSchema}
          conditionInputs={conditionInputs}
          debouncedConditionInputs={debouncedConditionInputs}
          dismissedConditions={dismissedConditions}
          expandedConditions={expandedConditions}
          onUpdate={onUpdate}
          setConditionInputs={setConditionInputs}
          setDebouncedConditionInputs={setDebouncedConditionInputs}
          setDismissedConditions={setDismissedConditions}
          setExpandedConditions={setExpandedConditions}
          debounceTimersRef={debounceTimersRef}
        />
      );

    case FORGE_NODE_TYPE.DETOUR:
      return (
        <DetourNodeFields
          node={node}
          graph={graph}
          onUpdate={onUpdate}
          onFocusNode={onFocusNode}
        />
      );

    default:
      return null;
  }
}
