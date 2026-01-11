import React, { useState, useRef } from 'react';
import { ForgeNode, ForgeGraph, Choice } from '../../../../types';
import { FlagSchema } from '../../../../types/flags';
import { Character } from '../../../../types/characters';
import { FlagSelector } from '../FlagSelector';
import { NODE_TYPE } from '../../../../types/constants';
import { useConditionInputs } from './hooks/useConditionInputs';
import { getNodeTypeBorderColor, getNodeTypeBadge, getNodeTypeLabel } from './utils/nodeTypeHelpers';
import { NpcNodeFields } from '../../ForgeStoryletGraphEditor/components/NPCNode/NPCNodeFields';
import { StoryletNodeFields } from '../../ForgeStoryletGraphEditor/components/StoryletNode/StoryletNodeFields';


import { ConditionEditorModal } from './components/ConditionEditorModal';
import { StoryletPoolNodeFields } from '../../ForgeStoryletGraphEditor/components/StoryletPoolNode/StoryletPoolNodeFields';
import { ConditionalNodeFields } from '../Nodes/ConditionalNode/ConditionalNodeFields';
import { PlayerNodeFields } from '../../ForgeStoryletGraphEditor/components/PlayerNode/PlayerNodeFields';

interface NodeEditorProps {
  node: ForgeNode;
  dialogue: ForgeGraph;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onDelete: () => void;
  onAddChoice: () => void;
  onUpdateChoice: (idx: number, updates: Partial<Choice>) => void;
  onRemoveChoice: (idx: number) => void;
  onClose: () => void;
  onPlayFromHere?: (nodeId: string) => void;
  onFocusNode?: (nodeId: string) => void;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
}

export function NodeEditor({
  node,
  dialogue,
  onUpdate,
  onDelete,
  onAddChoice,
  onUpdateChoice,
  onRemoveChoice,
  onClose,
  onPlayFromHere,
  onFocusNode,
  flagSchema,
  characters = {},
}: NodeEditorProps) {
  const [editingCondition, setEditingCondition] = useState<{
    id: string;
    value: string;
    type: 'block' | 'choice';
    blockIdx?: number;
    choiceIdx?: number;
  } | null>(null);

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

  const handleStoryletCallUpdate = (updates: Partial<NonNullable<ForgeNode['storyletCall']>>) => {
    const nextStoryletCall = {
      ...(node.storyletCall ?? {}),
      ...updates,
    };
    const hasValues = Object.values(nextStoryletCall).some(
      value => value !== undefined && value !== ''
    );
    onUpdate({ storyletCall: hasValues ? nextStoryletCall : undefined });
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

          {node.type === NODE_TYPE.NPC && (
            <NpcNodeFields
              node={node}
              dialogue={dialogue}
              characters={characters}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
            />
          )}

          {node.type === NODE_TYPE.STORYLET && (
            <StoryletNodeFields
              node={node}
              dialogue={dialogue}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
              onUpdateStoryletCall={handleStoryletCallUpdate}
            />
          )}

          {node.type === NODE_TYPE.STORYLET_POOL && (
            <StoryletPoolNodeFields
              node={node}
              dialogue={dialogue}
              onUpdate={onUpdate}
              onFocusNode={onFocusNode}
              onUpdateStoryletCall={handleStoryletCallUpdate}
            />
          )}

          {node.type === NODE_TYPE.CONDITIONAL && (
            <ConditionalNodeFields
              node={node}
              dialogue={dialogue}
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

          {node.type === NODE_TYPE.PLAYER && (
            <PlayerNodeFields
              node={node}
              dialogue={dialogue}
              characters={characters}
              flagSchema={flagSchema}
              conditionInputs={conditionInputs}
              debouncedConditionInputs={debouncedConditionInputs}
              onUpdate={onUpdate}
              onAddChoice={onAddChoice}
              onUpdateChoice={onUpdateChoice}
              onRemoveChoice={onRemoveChoice}
              onFocusNode={onFocusNode}
              setConditionInputs={setConditionInputs}
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

          {onPlayFromHere && (
            <button
              onClick={() => onPlayFromHere(node.id)}
              className="w-full py-2 bg-[#e94560] hover:bg-[#d63850] text-white rounded text-sm flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play from Here
            </button>
          )}
        </div>

        <ConditionEditorModal
          editingCondition={editingCondition}
          node={node}
          flagSchema={flagSchema}
          onClose={() => setEditingCondition(null)}
          onUpdate={onUpdate}
          onUpdateChoice={onUpdateChoice}
          setConditionInputs={setConditionInputs}
        />
      </aside>
    </>
  );
}
