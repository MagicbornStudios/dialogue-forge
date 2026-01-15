import React from 'react';
import { ForgeGraphDoc, ForgeChoice, ForgeNode } from '@/forge/types/forge-graph';
import { FlagSchema } from '@/forge/types/flags';
import { ForgeCharacter } from '@/forge/types/characters';
import { CharacterSelector } from '../../../shared/Nodes/components/shared/CharacterSelector';
import { ConditionAutocomplete } from '@/forge/components/GraphEditors/shared/Nodes/components/ConditionAutocomplete';
import { FlagSelector } from '@/forge/components/GraphEditors/shared/FlagSelector';
import { EdgeIcon } from '@/forge/components/GraphEditors/shared/Nodes/components/EdgeIcon';
import { User, GitBranch } from 'lucide-react';
import { validateCondition, parseCondition } from '@/forge/components/ForgeWorkspace/components/GraphEditors/utils/condition-utils';
import { CHOICE_COLORS } from '@/forge/components/ForgeWorkspace/components/GraphEditors/utils/forge-flow-helpers';
import { useForgeEditorActions } from '@/forge/components/ForgeWorkspace/components/GraphEditors/hooks/useForgeEditorActions';

interface PlayerNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  characters: Record<string, ForgeCharacter>;
  flagSchema?: FlagSchema;
  conditionInputs: Record<string, string>;
  debouncedConditionInputs: Record<string, string>;
  choiceInputs: Record<string, Partial<ForgeChoice>>;
  debouncedChoiceInputs: Record<string, Partial<ForgeChoice>>;
  expandedChoices: Set<string>;
  dismissedChoices: Set<string>;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  setConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setChoiceInputs: React.Dispatch<React.SetStateAction<Record<string, Partial<ForgeChoice>>>>;
}

function darkenColor(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const darkR = Math.floor(r * 0.6);
  const darkG = Math.floor(g * 0.6);
  const darkB = Math.floor(b * 0.6);
  return `rgb(${darkR}, ${darkG}, ${darkB})`;
}

export function PlayerNodeFields({
  node,
  graph,
  characters,
  flagSchema,
  conditionInputs,
  debouncedConditionInputs,
  choiceInputs,
  debouncedChoiceInputs,
  expandedChoices,
  dismissedChoices,
  onUpdate,
  onFocusNode,
  setConditionInputs,
  setChoiceInputs,
}: PlayerNodeFieldsProps) {
  const actions = useForgeEditorActions();

  const handleAddChoice = () => {
    if (!node.id) return;
    const newChoice: ForgeChoice = {
      id: `choice_${Date.now()}`,
      text: '',
      nextNodeId: undefined,
      conditions: undefined,
      setFlags: undefined,
    };
    const updatedChoices = [...(node.choices || []), newChoice];
    actions.patchNode(node.id, { choices: updatedChoices });
  };

  const handleUpdateChoice = (idx: number, updates: Partial<ForgeChoice>) => {
    if (!node.id || !node.choices) return;
    const updatedChoices = [...node.choices];
    updatedChoices[idx] = { ...updatedChoices[idx], ...updates };
    actions.patchNode(node.id, { choices: updatedChoices });
  };

  const handleRemoveChoice = (idx: number) => {
    if (!node.id || !node.choices) return;
    const updatedChoices = node.choices.filter((_, i) => i !== idx);
    actions.patchNode(node.id, { choices: updatedChoices.length > 0 ? updatedChoices : undefined });
  };
  return (
    <div>
      <div>
        <label className="text-[10px] text-df-text-secondary uppercase">Character</label>
        <CharacterSelector
          characters={characters}
          selectedCharacterId={node.characterId}
          onSelect={(characterId) => {
            const character = characterId ? characters[characterId] : undefined;
            onUpdate({
              characterId,
              speaker: character ? character.name : node.speaker,
            });
          }}
          placeholder="Select character..."
          className="mb-2"
        />
        <div className="text-[9px] text-df-text-tertiary mt-1">
          Or enter custom speaker name below
        </div>
      </div>
      <div>
        <label className="text-[10px] text-df-text-secondary uppercase">Speaker (Custom)</label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-df-control-bg border border-df-control-border flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-df-text-secondary" />
          </div>
          <input
            type="text"
            value={node.speaker || ''}
            onChange={(event) => onUpdate({ speaker: event.target.value })}
            className="flex-1 bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-player-selected outline-none"
            placeholder="Custom speaker name (optional)"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mb-2 mt-4">
        <label className="text-[10px] text-gray-500 uppercase">Choices</label>
        <button onClick={handleAddChoice} className="text-[10px] text-[#e94560] hover:text-[#ff6b6b]">
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {node.choices?.map((choice, idx) => {
          const hasCondition = choice.conditions !== undefined;
          const choiceKey = choice.id;
          const choiceKeyForCondition = `choice-${choice.id}`;
          const conditionValue = conditionInputs[choiceKeyForCondition] || '';
          const debouncedValue = debouncedConditionInputs[choiceKeyForCondition] || '';
          const validationResult = validateCondition(debouncedValue, flagSchema);
          
          // Get local editing state from choiceInputs, fallback to actual choice data
          const localInput = choiceInputs[choiceKey];
          const debouncedInput = debouncedChoiceInputs[choiceKey];
          const displayText = localInput?.text !== undefined ? localInput.text : (debouncedInput?.text ?? choice.text ?? '');
          const displayNextNodeId = localInput?.nextNodeId !== undefined ? localInput.nextNodeId : (debouncedInput?.nextNodeId ?? choice.nextNodeId);
          
          const choiceColor = CHOICE_COLORS[idx % CHOICE_COLORS.length];
          const darkChoiceColor = darkenColor(choiceColor);
          
          return (
            <div 
              key={choice.id} 
              className={`rounded p-2 space-y-2 ${
                hasCondition 
                  ? 'bg-blue-500/10 border-2 border-blue-500/50' 
                  : 'bg-[#12121a] border border-[#2a2a3e]'
              }`}
              style={{
                borderTopColor: hasCondition ? undefined : choiceColor
              }}
            >
              <div 
                className="flex items-center gap-2 pb-2 border-b"
                style={{
                  borderBottomColor: hasCondition ? '#2a2a3e' : choiceColor
                }}
              >
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={hasCondition}
                      onChange={(event) => {
                        if (event.target.checked) {
                          handleUpdateChoice(idx, { conditions: [] });
                        } else {
                          handleUpdateChoice(idx, { conditions: undefined });
                        }
                      }}
                      className="sr-only"
                    />
                    <div className={`w-7 h-3.5 rounded-full transition-all duration-200 ease-in-out ${
                      hasCondition ? 'bg-blue-500' : 'bg-[#2a2a3e]'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transition-all duration-200 ease-in-out mt-0.5 ${
                        hasCondition ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                </label>
                {hasCondition ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-400 border border-blue-500/50 font-medium">
                    CONDITIONAL
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a3e] text-gray-400 border border-[#2a2a3e] font-medium">
                    CHOICE
                  </span>
                )}
                {displayNextNodeId && onFocusNode && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (displayNextNodeId && onFocusNode) {
                        onFocusNode(displayNextNodeId);
                      }
                    }}
                    className="transition-colors cursor-pointer flex-shrink-0"
                    title={`Focus on node: ${displayNextNodeId}`}
                  >
                    <EdgeIcon 
                      size={16} 
                      color={CHOICE_COLORS[idx % CHOICE_COLORS.length]} 
                      className="transition-colors"
                    />
                  </button>
                )}
                <div className="relative flex-1">
                  <select
                    value={displayNextNodeId || ''}
                    onChange={(event) => {
                      const newNextNodeId = event.target.value || undefined;
                      setChoiceInputs(prev => ({
                        ...prev,
                        [choiceKey]: { ...prev[choiceKey], nextNodeId: newNextNodeId }
                      }));
                      handleUpdateChoice(idx, { nextNodeId: newNextNodeId });
                    }}
                    className="w-full bg-[#0d0d14] border rounded px-2 py-1 pr-8 text-xs text-gray-300 outline-none"
                    style={{
                      borderColor: displayNextNodeId ? darkChoiceColor : '#2a2a3e',
                    }}
                    onFocus={(event) => {
                      if (displayNextNodeId) {
                        event.target.style.borderColor = darkChoiceColor;
                      } else {
                        event.target.style.borderColor = '#e94560';
                      }
                    }}
                    onBlur={(event) => {
                      if (displayNextNodeId) {
                        event.target.style.borderColor = darkChoiceColor;
                      } else {
                        event.target.style.borderColor = '#2a2a3e';
                      }
                    }}
                  >
                    <option value="">— Select target —</option>
                    {graph.flow?.nodes?.map((n) => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                  {displayNextNodeId && (
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      title={`Connects to node: ${displayNextNodeId}`}
                      style={{ color: CHOICE_COLORS[idx % CHOICE_COLORS.length] }}
                    >
                      <GitBranch size={14} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleRemoveChoice(idx)} 
                  className="text-gray-600 hover:text-red-400 flex-shrink-0"
                  title="Remove choice"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              
              <div className="pt-2">
                <input
                  type="text"
                  value={displayText}
                  onChange={(event) => {
                    const newText = event.target.value;
                    setChoiceInputs(prev => ({
                      ...prev,
                      [choiceKey]: { ...prev[choiceKey], text: newText }
                    }));
                    // Also update immediately for better UX
                    handleUpdateChoice(idx, { text: newText });
                  }}
                  className={`w-full bg-[#0d0d14] border rounded px-3 py-2 text-sm outline-none transition-colors ${
                    hasCondition ? 'text-gray-100' : 'text-gray-200'
                  }`}
                  style={{
                    borderColor: displayText ? darkChoiceColor : '#2a2a3e'
                  }}
                  placeholder="Dialogue text..."
                />
              </div>
              
              {hasCondition && (
                <div className="bg-blue-500/5 border border-blue-500/30 rounded p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-blue-400 uppercase font-medium">Condition</label>
                    <button
                      onClick={() => handleUpdateChoice(idx, { conditions: undefined })}
                      className="text-[10px] text-gray-500 hover:text-red-400 ml-auto"
                      title="Remove condition"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="relative">
                    <ConditionAutocomplete
                      value={conditionValue}
                      onChange={(newValue) => {
                        setConditionInputs(prev => ({ ...prev, [choiceKeyForCondition]: newValue }));
                        const newConditions = parseCondition(newValue);
                        handleUpdateChoice(idx, { 
                          conditions: newConditions.length > 0 ? newConditions : [] 
                        });
                      }}
                      placeholder='e.g., $reputation > 10 or $flag == "value"'
                      className="w-full bg-[#0d0d14] border rounded px-2 py-1 pr-8 text-xs text-gray-300 font-mono outline-none hover:border-blue-500/50 transition-all"
                      style={{
                        borderColor: conditionValue.trim().length > 0 && debouncedValue.trim().length > 0
                          ? (validationResult.isValid ? 'rgba(59, 130, 246, 0.5)' : 
                             validationResult.errors.length > 0 ? '#ef4444' : '#eab308')
                          : '#2a2a3e'
                      } as React.CSSProperties}
                      flagSchema={flagSchema}
                    />
                  </div>
                  {conditionValue.trim().length > 0 && debouncedValue.trim().length > 0 && validationResult.errors.length > 0 && (
                    <p className="text-[10px] text-red-500 mt-1">{validationResult.errors[0]}</p>
                  )}
                  {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
                    <p className="text-[10px] text-yellow-500 mt-1">{validationResult.warnings[0]}</p>
                  )}
                  {validationResult.isValid && validationResult.errors.length === 0 && validationResult.warnings.length === 0 && conditionValue && (
                    <p className="text-[10px] text-green-500 mt-1">Valid condition</p>
                  )}
                  {!conditionValue && (
                    <p className="text-[10px] text-blue-400/80 mt-1">Only shows if condition is true</p>
                  )}
                </div>
              )}
              
              <FlagSelector
                value={choice.setFlags || []}
                onChange={(flags) => handleUpdateChoice(idx, { setFlags: flags.length > 0 ? flags : undefined })}
                flagSchema={flagSchema}
                placeholder="Set flags..."
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
