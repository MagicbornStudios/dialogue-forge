import React from 'react';
import { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import { FlagSchema } from '@magicborn/forge/types/flags';
import { ForgeCharacter } from '@magicborn/forge/types/characters';
import { CharacterSelector } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/CharacterSelector';
import { ConditionAutocomplete } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ConditionAutocomplete';
import { X, User, Maximize2 } from 'lucide-react';
import { validateCondition, parseCondition } from '@magicborn/forge/lib/yarn-converter/utils/condition-utils';
import { ForgeNode, FORGE_CONDITIONAL_BLOCK_TYPE } from '@magicborn/forge/types/forge-graph';

interface ConditionalNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  characters: Record<string, ForgeCharacter>;
  flagSchema?: FlagSchema;
  conditionInputs: Record<string, string>;
  debouncedConditionInputs: Record<string, string>;
  dismissedConditions: Set<string>;
  expandedConditions: Set<string>;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  setConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDebouncedConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDismissedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedConditions: React.Dispatch<React.SetStateAction<Set<string>>>;
  debounceTimersRef: React.MutableRefObject<Record<string, NodeJS.Timeout>>;
}

export function ConditionalNodeFields({
  node,
  characters,
  flagSchema,
  conditionInputs,
  debouncedConditionInputs,
  dismissedConditions,
  expandedConditions,
  onUpdate,
  setConditionInputs,
  setDebouncedConditionInputs,
  setDismissedConditions,
  setExpandedConditions,
  debounceTimersRef,
}: ConditionalNodeFieldsProps) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-df-text-tertiary uppercase">Conditional Blocks</label>
        </div>
        
        {node.conditionalBlocks ? (
          <div className="space-y-2">
            {node.conditionalBlocks.map((block, idx) => {
              const conditionValue = block.type !== FORGE_CONDITIONAL_BLOCK_TYPE.ELSE ? (conditionInputs[block.id] || '') : '';
              const debouncedValue = block.type !== FORGE_CONDITIONAL_BLOCK_TYPE.ELSE ? (debouncedConditionInputs[block.id] || '') : '';
              const valueToValidate = debouncedValue || conditionValue;
              const validation = block.type !== FORGE_CONDITIONAL_BLOCK_TYPE.ELSE ? validateCondition(valueToValidate, flagSchema) : { isValid: true, errors: [], warnings: [] };
              const hasError = !validation.isValid;
              const hasWarning = validation.warnings.length > 0;
              const showValidation = conditionValue.trim().length > 0;
              const isManuallyOpen = expandedConditions.has(block.id);
              const shouldExpand = isManuallyOpen;
              
              const blockTypeStyles = {
                if: {
                  bg: 'bg-df-canvas-bg',
                  border: 'border-df-control-border',
                  tagBg: 'bg-df-surface',
                  tagText: 'text-df-text-primary',
                  text: 'text-df-text-secondary'
                },
                elseif: {
                  bg: 'bg-df-control-bg',
                  border: 'border-df-control-border',
                  tagBg: 'bg-df-surface',
                  tagText: 'text-df-text-primary',
                  text: 'text-df-text-secondary'
                },
                else: {
                  bg: 'bg-df-surface',
                  border: 'border-df-control-border',
                  tagBg: 'bg-df-surface',
                  tagText: 'text-df-text-primary',
                  text: 'text-df-text-secondary'
                }
              };
              const styles = blockTypeStyles[block.type];
              
              return (
                <div key={block.id} className={`rounded p-2 space-y-2 ${styles.bg} ${styles.border} border-2`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${styles.tagBg} ${styles.tagText} font-semibold`}>
                      {block.type === FORGE_CONDITIONAL_BLOCK_TYPE.IF ? 'IF' : block.type === FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF ? 'ELSE IF' : 'ELSE'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <CharacterSelector
                        characters={characters}
                        selectedCharacterId={block.characterId}
                        onSelect={(characterId) => {
                          const newBlocks = [...node.conditionalBlocks!];
                          const character = characterId ? characters[characterId] : undefined;
                          newBlocks[idx] = { 
                            ...block, 
                            characterId,
                            speaker: character ? character.name : block.speaker,
                          };
                          onUpdate({ conditionalBlocks: newBlocks });
                        }}
                        placeholder="Speaker..."
                        compact={true}
                      />
                    </div>
                    
                    {block.type !== FORGE_CONDITIONAL_BLOCK_TYPE.ELSE && (
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedConditions);
                          if (expandedConditions.has(block.id)) {
                            newExpanded.delete(block.id);
                          } else {
                            newExpanded.add(block.id);
                          }
                          setExpandedConditions(newExpanded);
                        }}
                        className="text-df-text-tertiary hover:text-df-text-secondary transition-colors"
                      >
                        <Maximize2 size={12} className={`transition-transform ${shouldExpand ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (node.conditionalBlocks) {
                          const newBlocks = node.conditionalBlocks.filter((_, i) => i !== idx);
                          onUpdate({ conditionalBlocks: newBlocks.length > 0 ? newBlocks : undefined });
                        }
                      }}
                      className="text-df-text-tertiary hover:text-red-400"
                      title="Remove block"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-df-control-bg)] border border-border flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-[var(--color-df-text-secondary)]" />
                    </div>
                    <input
                      type="text"
                      value={block.speaker || ''}
                      onChange={(e) => {
                        const newBlocks = [...node.conditionalBlocks!];
                        newBlocks[idx] = { ...block, speaker: e.target.value };
                        onUpdate({ conditionalBlocks: newBlocks });
                      }}
                      className="flex-1 bg-df-canvas-bg border border-df-control-border rounded px-2 py-1 text-xs text-df-text-secondary outline-none"
                      placeholder="Custom speaker name (optional)"
                    />
                  </div>
                  
                  <textarea
                    value={block.content || ''}
                    onChange={(e) => {
                      const newBlocks = [...node.conditionalBlocks!];
                      newBlocks[idx] = { ...block, content: e.target.value };
                      onUpdate({ conditionalBlocks: newBlocks });
                    }}
                    className={`w-full bg-df-canvas-bg border rounded px-2 py-1 text-xs ${styles.text} outline-none min-h-[50px] resize-y`}
                    style={{ borderColor: styles.border.replace('border-', '#') }}
                    placeholder="Dialogue content..."
                  />
                  
                  {block.type !== 'else' && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] text-df-text-tertiary uppercase">Condition</label>
                        {showValidation && (
                          <button
                            onClick={() => {
                              const newDismissed = new Set(dismissedConditions);
                              if (newDismissed.has(block.id)) {
                                newDismissed.delete(block.id);
                              } else {
                                newDismissed.add(block.id);
                              }
                              setDismissedConditions(newDismissed);
                            }}
                            className="text-[9px] text-df-text-tertiary hover:text-df-text-secondary"
                          >
                            {dismissedConditions.has(block.id) ? 'Show' : 'Hide'} validation
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <ConditionAutocomplete
                          value={conditionValue}
                          onChange={(newValue) => {
                            setConditionInputs(prev => ({ ...prev, [block.id]: newValue }));
                            
                            if (debounceTimersRef.current[block.id]) {
                              clearTimeout(debounceTimersRef.current[block.id]);
                            }
                            
                            debounceTimersRef.current[block.id] = setTimeout(() => {
                              setDebouncedConditionInputs(prev => ({ ...prev, [block.id]: newValue }));
                              // Parse and save the condition to the block
                              const newBlocks = [...node.conditionalBlocks!];
                              newBlocks[idx] = {
                                ...block,
                                condition: parseCondition(newValue)
                              };
                              onUpdate({ conditionalBlocks: newBlocks });
                            }, 500);
                          }}
                          placeholder="e.g., $reputation > 10"
                          className={`w-full bg-[#0d0d14] border rounded px-2 py-1 text-xs text-gray-300 font-mono outline-none transition-colors ${
                            hasError ? 'border-df-error' : hasWarning ? 'border-df-warning' : 'border-df-control-border'
                          }`}
                          flagSchema={flagSchema}
                        />
                        {showValidation && !dismissedConditions.has(block.id) && (
                          <div className={`mt-1 text-[9px] ${hasError ? 'text-red-500' : hasWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                            {hasError ? validation.errors[0] : hasWarning ? validation.warnings[0] : 'Valid condition'}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const newBlocks = [...node.conditionalBlocks!];
                  newBlocks.push({
                    id: `block_${Date.now()}`,
                    type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
                    condition: [],
                    content: '',
                    speaker: undefined
                  });
                  onUpdate({ conditionalBlocks: newBlocks });
                }}
                className="text-xs px-2 py-1 bg-df-surface border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary"
              >
                + Add If
              </button>
              <button
                onClick={() => {
                  const newBlocks = [...node.conditionalBlocks!];
                  newBlocks.push({
                    id: `block_${Date.now()}`,
                    type: FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF,
                    condition: [],
                    content: '',
                    speaker: undefined
                  });
                  onUpdate({ conditionalBlocks: newBlocks });
                }}
                className="text-xs px-2 py-1 bg-df-surface border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary"
              >
                + Add Else If
              </button>
              {!node.conditionalBlocks.some(b => b.type === 'else') && (
                <button
                  onClick={() => {
                    const newBlocks = [...node.conditionalBlocks!];
                    newBlocks.push({
                      id: `block_${Date.now()}`,
                      type: FORGE_CONDITIONAL_BLOCK_TYPE.ELSE,
                      condition: undefined,
                      content: '',
                      speaker: undefined
                    });
                    onUpdate({ conditionalBlocks: newBlocks });
                  }}
                  className="text-xs px-2 py-1 bg-df-surface border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary"
                >
                  + Add Else
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-df-text-tertiary p-4 text-center border border-df-control-border rounded">
            No conditional blocks. Add an "If" block to start.
          </div>
        )}
      </div>
    </>
  );
}
