import React from 'react';
import { ForgeGraphDoc, ForgeChoice, ForgeNode, ForgeNodePresentation } from '@magicborn/forge/types/forge-graph';
import { FlagSchema } from '@magicborn/forge/types/flags';
import { ForgeCharacter } from '@magicborn/forge/types/characters';
import { CharacterSelector } from '../shared/CharacterSelector';
import { ConditionAutocomplete } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ConditionAutocomplete';
import { FlagSelector } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/FlagSelector';
import { EdgeIcon } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeIcon';
import { User, GitBranch } from 'lucide-react';
import { validateCondition, parseCondition } from '@magicborn/forge/lib/yarn-converter/utils/condition-utils';
import { useForgeEditorActions } from '@magicborn/forge/lib/graph-editor/hooks/useForgeEditorActions';

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
  const updatePresentation = (updates: Partial<ForgeNodePresentation>) => {
    const nextPresentation = { ...node.presentation, ...updates };
    const hasValue = Object.values(nextPresentation).some((value) => value);
    onUpdate({ presentation: hasValue ? nextPresentation : undefined });
  };

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
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Character</label>
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
        <div className="text-[9px] text-[var(--color-df-text-tertiary)] mt-1">
          Or enter custom speaker name below
        </div>
      </div>
      <div>
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Speaker (Custom)</label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-df-control-bg)] border border-border flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-[var(--color-df-text-secondary)]" />
          </div>
          <input
            type="text"
            value={node.speaker || ''}
            onChange={(event) => onUpdate({ speaker: event.target.value })}
            className="flex-1 bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-player-accent)] outline-none"
            placeholder="Custom speaker name (optional)"
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="text-[10px] text-[var(--color-df-text-secondary)] uppercase">Media</label>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={node.presentation?.imageId || ''}
            onChange={(event) => updatePresentation({ imageId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-player-accent)] outline-none"
            placeholder="Image ID (optional)"
          />
          <input
            type="text"
            value={node.presentation?.backgroundId || ''}
            onChange={(event) => updatePresentation({ backgroundId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-player-accent)] outline-none"
            placeholder="Background ID (optional)"
          />
          <input
            type="text"
            value={node.presentation?.portraitId || ''}
            onChange={(event) => updatePresentation({ portraitId: event.target.value || undefined })}
            className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-player-accent)] outline-none"
            placeholder="Portrait ID (optional)"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mb-2 mt-4">
        <label className="text-[10px] text-gray-500 uppercase">Choices</label>
        <button onClick={handleAddChoice} className="text-[10px] text-df-error hover:text-[#ff6b6b]">
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
          
          const choiceIndex = idx % 5;

          return (
            <div 
              key={choice.id} 
              data-choice-index={choiceIndex}
              className={`rounded p-2 space-y-2 ${
                hasCondition 
                  ? 'bg-df-info/10 border-2 border-df-info/50' 
                  : 'bg-df-surface border border-df-control-border forge-choice-border-top'
              }`}
            >
              <div 
                className={`flex items-center gap-2 pb-2 border-b ${
                  hasCondition ? 'border-df-control-border' : 'forge-choice-border-bottom'
                }`}
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
                      hasCondition ? 'bg-df-info' : 'bg-[#2a2a3e]'
                    }`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white transition-all duration-200 ease-in-out mt-0.5 ${
                        hasCondition ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                </label>
                {hasCondition ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-info/30 text-df-info border border-df-info/50 font-medium">
                    CONDITIONAL
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-surface text-df-text-secondary border border-df-control-border font-medium">
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
                    className="forge-choice-color transition-colors cursor-pointer flex-shrink-0"
                    title={`Focus on node: ${displayNextNodeId}`}
                  >
                    <EdgeIcon size={16} className="transition-colors" />
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
                    data-choice-index={choiceIndex}
                    data-has-next={displayNextNodeId ? 'true' : 'false'}
                    className="forge-choice-input w-full bg-df-canvas-bg border rounded px-2 py-1 pr-8 text-xs text-df-text-secondary outline-none"
                  >
                    <option value="">— Select target —</option>
                    {graph.flow?.nodes?.map((n) => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                  {displayNextNodeId && (
                    <div 
                      className="forge-choice-color absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      title={`Connects to node: ${displayNextNodeId}`}
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
                  data-choice-index={choiceIndex}
                  data-has-text={displayText ? 'true' : 'false'}
                  className={`forge-choice-input w-full bg-df-canvas-bg border rounded px-3 py-2 text-sm outline-none transition-colors ${
                    hasCondition ? 'text-gray-100' : 'text-gray-200'
                  }`}
                  placeholder="Dialogue text..."
                />
              </div>
              
              {hasCondition && (
                <div className="bg-df-info/5 border border-blue-500/30 rounded p-2 space-y-1">
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
                      className="w-full bg-df-canvas-bg border rounded px-2 py-1 pr-8 text-xs text-df-text-secondary font-mono outline-none hover:border-df-info/50 transition-all"
                      style={{
                        borderColor: conditionValue.trim().length > 0 && debouncedValue.trim().length > 0
                          ? (validationResult.isValid ? 'var(--color-df-info)' : 
                             validationResult.errors.length > 0 ? 'var(--color-df-error)' : 'var(--color-df-warning)')
                          : 'var(--color-df-control-border)'
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
