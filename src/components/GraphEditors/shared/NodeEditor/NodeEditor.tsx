import React, { useState, useRef } from 'react';
import { ForgeGraphDoc, Choice } from '../../../../types';
import { FlagSchema } from '../../../../types/flags';
import { ForgeCharacter } from '../../../../types/characters';
import { FlagSelector } from '../FlagSelector';
import { useConditionInputs } from './hooks/useConditionInputs';
import { useChoices } from './hooks/useChoices';
import { getNodeTypeBorderColor, getNodeTypeBadge, getNodeTypeLabel } from './utils/nodeTypeHelpers';
import { CharacterNodeFields } from '../../ForgeStoryletGraphEditor/components/CharacterNode/CharacterNodeFields';
import { StoryletNodeFields } from '../../ForgeStoryletGraphEditor/components/StoryletNode/StoryletNodeFields';


import { ConditionalNodeFields } from '../Nodes/ConditionalNode/ConditionalNodeFields';
import { PlayerNodeFields } from '../../ForgeStoryletGraphEditor/components/PlayerNode/PlayerNodeFields';
import { DetourNodeFields } from '../Nodes/DetourNode/DetourNodeFields';
import { ForgeNode, ForgeStoryletCall, ForgeNodeType, FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';

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
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <aside className={`w-80 border-l ${getNodeTypeBorderColor(node.type)} bg-df-sidebar-bg overflow-y-auto`}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded ${getNodeTypeBadge(node.type)}`}>
              {getNodeTypeLabel(node.type)}
            </span>
            <div className="flex gap-1">
              <button onClick={onDelete} className="p-1 text-gray-500 hover:text-red-400" title="Delete node">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button onClick={onClose} className="p-1 text-gray-500 hover:text-white" title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 uppercase">ID</label>
            <input 
              value={node.id} 
              disabled 
              className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-500 font-mono" 
            />
          </div>

          {node.type === FORGE_NODE_TYPE.CHARACTER && (
            <CharacterNodeFields
              node={node}
              graph={graph}
              characters={characters}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
            />
          )}

          {node.type === FORGE_NODE_TYPE.PLAYER && (
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
          )}

          {node.type === FORGE_NODE_TYPE.STORYLET && (
            <StoryletNodeFields
              node={node}
              graph={graph}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
              onUpdateStoryletCall={handleStoryletCallUpdate}
            />
          )}


          {node.type === FORGE_NODE_TYPE.CONDITIONAL && (
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
          )}

          {node.type === FORGE_NODE_TYPE.DETOUR && (
            <DetourNodeFields
              node={node}
              graph={graph}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
            />
          )}

          <div>
            <label className="text-[10px] text-gray-500 uppercase">Set Flags (on enter)</label>
            <FlagSelector
              value={node.setFlags || []}
              onChange={(flags) => onUpdate({ setFlags: flags.length > 0 ? flags : undefined })}
              flagSchema={flagSchema}
              placeholder="flag1, flag2"
            />
          </div>
        </div>


      </aside>
    </>
  );
}
