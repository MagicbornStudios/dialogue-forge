import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DialogueNode, DialogueTree, Choice, ConditionalBlock } from '../types';
import { FlagSchema } from '../types/flags';
import { Character } from '../types/characters';
import { FlagSelector } from './FlagSelector';
import { CharacterSelector } from './CharacterSelector';
import { CONDITION_OPERATOR, NODE_TYPE } from '../types/constants';
import { AlertCircle, CheckCircle, Info, GitBranch, X, User, Maximize2 } from 'lucide-react';
import { CHOICE_COLORS } from '../utils/reactflow-converter';
import { EdgeIcon } from './EdgeIcon';
import { ConditionAutocomplete } from './ConditionAutocomplete';

interface NodeEditorProps {
  node: DialogueNode;
  dialogue: DialogueTree;
  onUpdate: (updates: Partial<DialogueNode>) => void;
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

interface NextNodeSelectorProps {
  nodeId: string;
  nextNodeId?: string;
  dialogue: DialogueTree;
  onUpdate: (updates: Partial<DialogueNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  label?: string;
}

function NextNodeSelector({
  nodeId,
  nextNodeId,
  dialogue,
  onUpdate,
  onFocusNode,
  label = 'Next Node',
}: NextNodeSelectorProps) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase">{label}</label>
      <div className="flex items-center gap-2">
        {nextNodeId && onFocusNode && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onFocusNode(nextNodeId);
            }}
            className="transition-colors cursor-pointer flex-shrink-0 group"
            title={`Focus on node: ${nextNodeId}`}
          >
            <EdgeIcon size={16} color="#2a2a3e" className="group-hover:[&_circle]:fill-[#2a2a3e] group-hover:[&_line]:stroke-[#2a2a3e] transition-colors" />
          </button>
        )}
        <select
          value={nextNodeId || ''}
          onChange={(event) => onUpdate({ nextNodeId: event.target.value || undefined })}
          className="flex-1 bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-sm text-gray-200 outline-none"
        >
          <option value="">— End —</option>
          {Object.keys(dialogue.nodes).filter(id => id !== nodeId).map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface StoryletCallFieldsProps {
  storyletCall?: DialogueNode['storyletCall'];
  onUpdateStoryletCall: (updates: Partial<NonNullable<DialogueNode['storyletCall']>>) => void;
}

function StoryletCallFields({ storyletCall, onUpdateStoryletCall }: StoryletCallFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Template ID</label>
        <input
          type="text"
          value={storyletCall?.templateId || ''}
          onChange={(event) => onUpdateStoryletCall({ templateId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="template_id"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Entry Policy</label>
        <input
          type="text"
          value={storyletCall?.entryPolicy || ''}
          onChange={(event) => onUpdateStoryletCall({ entryPolicy: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="entry_policy"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Entry Node ID</label>
        <input
          type="text"
          value={storyletCall?.entryNodeId || ''}
          onChange={(event) => onUpdateStoryletCall({ entryNodeId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="entry_node_id"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Return Policy</label>
        <input
          type="text"
          value={storyletCall?.returnPolicy || ''}
          onChange={(event) => onUpdateStoryletCall({ returnPolicy: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="return_policy"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Return Node ID</label>
        <input
          type="text"
          value={storyletCall?.returnNodeId || ''}
          onChange={(event) => onUpdateStoryletCall({ returnNodeId: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="return_node_id"
        />
      </div>
    </>
  );
}

interface NpcNodeFieldsProps {
  node: DialogueNode;
  dialogue: DialogueTree;
  characters: Record<string, Character>;
  onUpdate: (updates: Partial<DialogueNode>) => void;
  onFocusNode?: (nodeId: string) => void;
}

function NpcNodeFields({ node, dialogue, characters, onUpdate, onFocusNode }: NpcNodeFieldsProps) {
  return (
    <>
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
            className="flex-1 bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
            placeholder="Custom speaker name (optional)"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Content</label>
        <textarea
          value={node.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none min-h-[100px] resize-y"
          placeholder="What the character says..."
        />
      </div>
      <NextNodeSelector
        nodeId={node.id}
        nextNodeId={node.nextNodeId}
        dialogue={dialogue}
        onUpdate={onUpdate}
        onFocusNode={onFocusNode}
      />
    </>
  );
}

interface StoryletNodeFieldsProps {
  node: DialogueNode;
  dialogue: DialogueTree;
  onUpdate: (updates: Partial<DialogueNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  onUpdateStoryletCall: (updates: Partial<NonNullable<DialogueNode['storyletCall']>>) => void;
}

function StoryletNodeFields({
  node,
  dialogue,
  onUpdate,
  onFocusNode,
  onUpdateStoryletCall,
}: StoryletNodeFieldsProps) {
  return (
    <>
      <StoryletCallFields storyletCall={node.storyletCall} onUpdateStoryletCall={onUpdateStoryletCall} />
      <NextNodeSelector
        nodeId={node.id}
        nextNodeId={node.nextNodeId}
        dialogue={dialogue}
        onUpdate={onUpdate}
        onFocusNode={onFocusNode}
      />
    </>
  );
}

interface StoryletNodeGroupFieldsProps {
  node: DialogueNode;
  dialogue: DialogueTree;
  onUpdate: (updates: Partial<DialogueNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  onUpdateStoryletCall: (updates: Partial<NonNullable<DialogueNode['storyletCall']>>) => void;
}

function StoryletNodeGroupFields({
  node,
  dialogue,
  onUpdate,
  onFocusNode,
  onUpdateStoryletCall,
}: StoryletNodeGroupFieldsProps) {
  return (
    <>
      <StoryletCallFields storyletCall={node.storyletCall} onUpdateStoryletCall={onUpdateStoryletCall} />
      <NextNodeSelector
        nodeId={node.id}
        nextNodeId={node.nextNodeId}
        dialogue={dialogue}
        onUpdate={onUpdate}
        onFocusNode={onFocusNode}
      />
    </>
  );
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
  // Local state for condition input values (keyed by block id for conditional blocks, choice id for choices)
  const [conditionInputs, setConditionInputs] = useState<Record<string, string>>({});
  const [debouncedConditionInputs, setDebouncedConditionInputs] = useState<Record<string, string>>({});
  const [editingCondition, setEditingCondition] = useState<{ id: string; value: string; type: 'block' | 'choice'; blockIdx?: number; choiceIdx?: number } | null>(null);
  const [debouncedEditingValue, setDebouncedEditingValue] = useState<string>('');
  const [dismissedConditions, setDismissedConditions] = useState<Set<string>>(new Set()); // Track which conditions have been dismissed
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set()); // Track which conditions are manually opened
  const prevNodeIdRef = useRef<string>(node.id);
  const initializedBlocksRef = useRef<Set<string>>(new Set());
  const initializedChoicesRef = useRef<Set<string>>(new Set());
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const editingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStoryletCallUpdate = (updates: Partial<NonNullable<DialogueNode['storyletCall']>>) => {
    const nextStoryletCall = {
      ...(node.storyletCall ?? {}),
      ...updates,
    };
    const hasValues = Object.values(nextStoryletCall).some(
      value => value !== undefined && value !== ''
    );
    onUpdate({ storyletCall: hasValues ? nextStoryletCall : undefined });
  };
  
  // Validation function for condition expressions
  const validateCondition = useMemo(() => {
    return (conditionStr: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!conditionStr.trim()) {
        return { isValid: true, errors: [], warnings: [] }; // Empty is valid (optional)
      }
      
      // Check for basic syntax issues
      const parts = conditionStr.split(/\s+and\s+/i);
      let hasValidPart = false;
      
      parts.forEach((part, idx) => {
        part = part.trim();
        if (!part) return;
        
        // Check if it's a valid condition pattern (including literals for always-true/false)
        const patterns = [
          /^not\s+\$(\w+)$/, // not $flag
          /^\$(\w+)\s*>=\s*(.+)$/, // $flag >= value
          /^\$(\w+)\s*<=\s*(.+)$/, // $flag <= value
          /^\$(\w+)\s*!=\s*(.+)$/, // $flag != value
          /^\$(\w+)\s*==\s*(.+)$/, // $flag == value
          /^\$(\w+)\s*>\s*(.+)$/, // $flag > value
          /^\$(\w+)\s*<\s*(.+)$/, // $flag < value
          /^\$(\w+)$/, // $flag
          // Allow literal comparisons (for always-true/false expressions)
          /^(.+)\s*==\s*(.+)$/, // literal == literal (e.g., 1 == 1, true == true)
          /^(.+)\s*!=\s*(.+)$/, // literal != literal
          /^(.+)\s*>=\s*(.+)$/, // literal >= literal
          /^(.+)\s*<=\s*(.+)$/, // literal <= literal
          /^(.+)\s*>\s*(.+)$/, // literal > literal
          /^(.+)\s*<\s*(.+)$/, // literal < literal
          /^(true|false)$/i, // boolean literals
        ];
        
        const matches = patterns.some(pattern => pattern.test(part));
        if (!matches) {
          errors.push(`Invalid syntax in part ${idx + 1}: "${part}"`);
          return;
        }
        
        hasValidPart = true;
        
        // Extract flag name (only if it starts with $)
        const flagMatch = part.match(/\$(\w+)/);
        if (flagMatch) {
          const flagName = flagMatch[1];
          
          // Check if flag exists in schema
          if (flagSchema) {
            const flagDef = flagSchema.flags.find(f => f.id === flagName);
            if (!flagDef) {
              warnings.push(`Flag "${flagName}" is not defined in your flag schema`);
            } else {
              // Check if operator matches flag type
              if (part.includes('>') || part.includes('<') || part.includes('>=') || part.includes('<=')) {
                if (flagDef.valueType !== 'number') {
                  warnings.push(`Flag "${flagName}" is not a number type, but you're using a numeric comparison`);
                }
              }
            }
          } else {
            warnings.push(`No flag schema provided - cannot validate flag "${flagName}"`);
          }
        } else {
          // This is a literal comparison (like "1 == 1" or "true")
          // These are valid but warn that they're unusual
          if (part.match(/^(true|false)$/i)) {
            // Boolean literal - this is fine
          } else if (part.includes('==') || part.includes('!=') || part.includes('>') || part.includes('<')) {
            // Literal comparison - warn that this is unusual but allow it
            warnings.push(`Literal comparison "${part}" will always evaluate to the same result. Consider using a flag variable instead.`);
          }
        }
      });
      
      if (!hasValidPart && conditionStr.trim()) {
        errors.push('Invalid condition syntax. Use: $flag, $flag == value, $flag > 10, 1 == 1, etc.');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    };
  }, [flagSchema]);
  
  // Only initialize condition inputs when node changes or when new blocks are added
  useEffect(() => {
    // Clear everything when switching to a different node
    if (prevNodeIdRef.current !== node.id) {
      prevNodeIdRef.current = node.id;
      setConditionInputs({});
      setDismissedConditions(new Set()); // Reset dismissed conditions when switching nodes
      setExpandedConditions(new Set()); // Reset expanded conditions when switching nodes
      initializedBlocksRef.current.clear();
      initializedChoicesRef.current.clear();
    }
    
    // Always sync condition inputs with actual block conditions (not just initialize once)
    if (node.conditionalBlocks) {
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = { ...prev };
        node.conditionalBlocks!.forEach(block => {
          if (block.type !== 'else') {
            // Always convert condition array to Yarn-style string from the actual block data
            if (block.condition && block.condition.length > 0) {
              const conditionStr = block.condition.map(cond => {
                const varName = `$${cond.flag}`;
                if (cond.operator === 'is_set') {
                  return varName;
                } else if (cond.operator === 'is_not_set') {
                  return `not ${varName}`;
                } else if (cond.value !== undefined) {
                  const op = cond.operator === 'equals' ? '==' :
                            cond.operator === 'not_equals' ? '!=' :
                            cond.operator === 'greater_than' ? '>' :
                            cond.operator === 'less_than' ? '<' :
                            cond.operator === 'greater_equal' ? '>=' :
                            cond.operator === 'less_equal' ? '<=' : '==';
                  const value = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
                  return `${varName} ${op} ${value}`;
                }
                return '';
              }).filter(c => c).join(' and ') || '';
              // Only update if it's different from what we have (to avoid overwriting user typing)
              if (newInputs[block.id] !== conditionStr) {
                newInputs[block.id] = conditionStr;
              }
            } else {
              // Empty condition - only set if not already set or if it's different
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
          // Keep choice inputs (they start with 'choice-')
          if (key.startsWith('choice-')) {
            newInputs[key] = prev[key];
          }
        });
        return newInputs;
      });
      initializedBlocksRef.current.clear();
    }
    
    // Always sync choice condition inputs with actual choice data (not just initialize once)
    if (node.choices) {
      setConditionInputs(prev => {
        const newInputs: Record<string, string> = { ...prev };
        node.choices!.forEach(choice => {
          const choiceKey = `choice-${choice.id}`;
          // Always sync with actual choice data to ensure conditions persist
          if (choice.conditions && choice.conditions.length > 0) {
            // Convert condition array to Yarn-style string
            const conditionStr = choice.conditions.map(cond => {
              const varName = `$${cond.flag}`;
              if (cond.operator === 'is_set') {
                return varName;
              } else if (cond.operator === 'is_not_set') {
                return `not ${varName}`;
              } else if (cond.value !== undefined) {
                const op = cond.operator === 'equals' ? '==' :
                          cond.operator === 'not_equals' ? '!=' :
                          cond.operator === 'greater_than' ? '>' :
                          cond.operator === 'less_than' ? '<' :
                          cond.operator === 'greater_equal' ? '>=' :
                          cond.operator === 'less_equal' ? '<=' : '==';
                const value = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
                return `${varName} ${op} ${value}`;
              }
              return '';
            }).filter(c => c).join(' and ') || '';
            // Only update if different to avoid overwriting user typing
            if (newInputs[choiceKey] !== conditionStr) {
              newInputs[choiceKey] = conditionStr;
            }
          } else if (choice.conditions !== undefined) {
            // Empty array - user clicked "Add Condition"
            if (newInputs[choiceKey] === undefined || newInputs[choiceKey] !== '') {
              newInputs[choiceKey] = '';
            }
          } else {
            // No conditions - clear the input if it exists
            if (newInputs[choiceKey] !== undefined) {
              delete newInputs[choiceKey];
            }
          }
          // Mark as initialized
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
  }, [node.id, node.conditionalBlocks?.length, node.choices?.length]); // Only depend on length, not the arrays themselves
  
  // Determine border color based on node type - use duller border colors
  const getBorderColor = () => {
    if (node.type === NODE_TYPE.NPC || node.type === NODE_TYPE.STORYLET || node.type === NODE_TYPE.STORYLET_POOL) {
      return 'border-df-npc-border';
    }
    if (node.type === NODE_TYPE.PLAYER || node.type === NODE_TYPE.RANDOMIZER) {
      return 'border-df-player-border';
    }
    if (node.type === NODE_TYPE.CONDITIONAL) return 'border-df-conditional-border';
    return 'border-df-control-border';
  };

  // Get node type badge colors
  const getNodeTypeBadge = () => {
    if (node.type === NODE_TYPE.NPC || node.type === NODE_TYPE.STORYLET || node.type === NODE_TYPE.STORYLET_POOL) {
      return 'bg-df-npc-selected/20 text-df-npc-selected';
    }
    if (node.type === NODE_TYPE.PLAYER || node.type === NODE_TYPE.RANDOMIZER) {
      return 'bg-df-player-selected/20 text-df-player-selected';
    }
    if (node.type === NODE_TYPE.CONDITIONAL) return 'bg-df-conditional-border/20 text-df-conditional-border';
    return 'bg-df-control-bg text-df-text-secondary';
  };

  const getNodeTypeLabel = () => {
    if (node.type === NODE_TYPE.NPC) return 'NPC';
    if (node.type === NODE_TYPE.PLAYER) return 'PLAYER';
    if (node.type === NODE_TYPE.CONDITIONAL) return 'CONDITIONAL';
    if (node.type === NODE_TYPE.STORYLET) return 'STORYLET';
    if (node.type === NODE_TYPE.STORYLET_POOL) return 'STORYLET NODE GROUP (LEGACY)';
    if (node.type === NODE_TYPE.RANDOMIZER) return 'STORYLET NODE GROUP';
    return 'UNKNOWN';
  };

  const randomizerBranches = node.randomizerBranches || [];

  const handleAddRandomizerBranch = () => {
    const newBranch = {
      id: `branch_${Date.now()}`,
      label: `Entry ${randomizerBranches.length + 1}`,
    };
    onUpdate({ randomizerBranches: [...randomizerBranches, newBranch] });
  };

  const handleUpdateRandomizerBranch = (idx: number, updates: Partial<typeof randomizerBranches[number]>) => {
    const updatedBranches = [...randomizerBranches];
    updatedBranches[idx] = { ...updatedBranches[idx], ...updates };
    onUpdate({ randomizerBranches: updatedBranches });
  };

  const handleRemoveRandomizerBranch = (idx: number) => {
    const updatedBranches = randomizerBranches.filter((_, branchIdx) => branchIdx !== idx);
    onUpdate({ randomizerBranches: updatedBranches.length > 0 ? updatedBranches : undefined });
  };

  const ConditionalNodeFields = () => (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500 uppercase">Conditional Blocks</label>
        </div>
        
        {node.conditionalBlocks ? (
          <div className="space-y-2">
            {node.conditionalBlocks.map((block, idx) => {
              const conditionValue = block.type !== 'else' ? (conditionInputs[block.id] || '') : '';
              const debouncedValue = block.type !== 'else' ? (debouncedConditionInputs[block.id] || '') : '';
              const valueToValidate = debouncedValue || conditionValue;
              const validation = block.type !== 'else' ? validateCondition(valueToValidate) : { isValid: true, errors: [], warnings: [] };
              const hasError = !validation.isValid;
              const hasWarning = validation.warnings.length > 0;
              const showValidation = conditionValue.trim().length > 0;
              const isManuallyOpen = expandedConditions.has(block.id);
              const shouldExpand = isManuallyOpen;
              
              const blockTypeStyles = {
                if: {
                  bg: 'bg-[#0a0a0a]',
                  border: 'border-[#1a1a1a]',
                  tagBg: 'bg-black',
                  tagText: 'text-white',
                  text: 'text-gray-100'
                },
                elseif: {
                  bg: 'bg-[#0f0f0f]',
                  border: 'border-[#1f1f1f]',
                  tagBg: 'bg-black',
                  tagText: 'text-white',
                  text: 'text-gray-200'
                },
                else: {
                  bg: 'bg-[#141414]',
                  border: 'border-[#242424]',
                  tagBg: 'bg-black',
                  tagText: 'text-white',
                  text: 'text-gray-200'
                }
              };
              const styles = blockTypeStyles[block.type];
              
              return (
                <div key={block.id} className={`rounded p-2 space-y-2 ${styles.bg} ${styles.border} border-2`}>
                {/* Header with block type badge at top */}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${styles.tagBg} ${styles.tagText} font-semibold`}>
                    {block.type === 'if' ? 'IF' : block.type === 'elseif' ? 'ELSE IF' : 'ELSE'}
                  </span>
                  {/* Compact Character Selector */}
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
                  
                  {/* Toggle expand/collapse */}
                  {block.type !== 'else' && (
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
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Maximize2 size={12} className={`transition-transform ${shouldExpand ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  
                  {/* Remove block */}
                  <button
                    onClick={() => {
                      if (node.conditionalBlocks) {
                        const newBlocks = node.conditionalBlocks.filter((_, i) => i !== idx);
                        onUpdate({ conditionalBlocks: newBlocks.length > 0 ? newBlocks : undefined });
                      }
                    }}
                    className="text-gray-500 hover:text-red-400"
                    title="Remove block"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Speaker input (optional) */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-df-control-bg border border-df-control-border flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-df-text-secondary" />
                  </div>
                  <input
                    type="text"
                    value={block.speaker || ''}
                    onChange={(e) => {
                      const newBlocks = [...node.conditionalBlocks!];
                      newBlocks[idx] = { ...block, speaker: e.target.value };
                      onUpdate({ conditionalBlocks: newBlocks });
                    }}
                    className="flex-1 bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 outline-none"
                    placeholder="Custom speaker name (optional)"
                  />
                </div>
                
                {/* Content input */}
                <textarea
                  value={block.content || ''}
                  onChange={(e) => {
                    const newBlocks = [...node.conditionalBlocks!];
                    newBlocks[idx] = { ...block, content: e.target.value };
                    onUpdate({ conditionalBlocks: newBlocks });
                  }}
                  className={`w-full bg-[#0d0d14] border rounded px-2 py-1 text-xs ${styles.text} outline-none min-h-[50px] resize-y`}
                  style={{ borderColor: styles.border.replace('border-', '#') }}
                  placeholder="Dialogue content..."
                />
                
                {/* Condition section for IF/ELSEIF */}
                {block.type !== 'else' && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] text-gray-500 uppercase">Condition</label>
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
                          className="text-[9px] text-gray-500 hover:text-gray-400"
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
                          }, 500);
                        }}
                        placeholder="e.g., $reputation > 10"
                        className={`w-full bg-[#0d0d14] border rounded px-2 py-1 text-xs text-gray-300 font-mono outline-none transition-colors ${
                          hasError ? 'border-red-500' : hasWarning ? 'border-yellow-500' : 'border-[#2a2a3e]'
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
                  type: 'if',
                  condition: [],
                  content: '',
                  speaker: undefined
                });
                onUpdate({ conditionalBlocks: newBlocks });
              }}
              className="text-xs px-2 py-1 bg-[#12121a] border border-[#2a2a3e] rounded text-gray-400 hover:text-gray-200"
            >
              + Add If
            </button>
            <button
              onClick={() => {
                const newBlocks = [...node.conditionalBlocks!];
                newBlocks.push({
                  id: `block_${Date.now()}`,
                  type: 'elseif',
                  condition: [],
                  content: '',
                  speaker: undefined
                });
                onUpdate({ conditionalBlocks: newBlocks });
              }}
              className="text-xs px-2 py-1 bg-[#12121a] border border-[#2a2a3e] rounded text-gray-400 hover:text-gray-200"
            >
              + Add Else If
            </button>
            {!node.conditionalBlocks.some(b => b.type === 'else') && (
              <button
                onClick={() => {
                  const newBlocks = [...node.conditionalBlocks!];
                  newBlocks.push({
                    id: `block_${Date.now()}`,
                    type: 'else',
                    condition: undefined,
                    content: '',
                    speaker: undefined
                  });
                  onUpdate({ conditionalBlocks: newBlocks });
                }}
                className="text-xs px-2 py-1 bg-[#12121a] border border-[#2a2a3e] rounded text-gray-400 hover:text-gray-200"
              >
                + Add Else
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 p-4 text-center border border-[#2a2a3e] rounded">
          No conditional blocks. Add an "If" block to start.
        </div>
      )}
    </div>
  </>
  );

  const PlayerNodeFields = () => (
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
        <button onClick={onAddChoice} className="text-[10px] text-[#e94560] hover:text-[#ff6b6b]">
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {node.choices?.map((choice, idx) => {
          const hasCondition = choice.conditions !== undefined;
          const choiceKey = `choice-${choice.id}`;
          const conditionValue = conditionInputs[choiceKey] || '';
          const debouncedValue = debouncedConditionInputs[choiceKey] || '';
          const validationResult = validateCondition(debouncedValue);
          
          const choiceColor = CHOICE_COLORS[idx % CHOICE_COLORS.length];
          const darkenColor = (color: string): string => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const darkR = Math.floor(r * 0.6);
            const darkG = Math.floor(g * 0.6);
            const darkB = Math.floor(b * 0.6);
            return `rgb(${darkR}, ${darkG}, ${darkB})`;
          };
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
                          onUpdateChoice(idx, { conditions: [] });
                        } else {
                          onUpdateChoice(idx, { conditions: undefined });
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
                {choice.nextNodeId && onFocusNode && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (choice.nextNodeId && onFocusNode) {
                        onFocusNode(choice.nextNodeId);
                      }
                    }}
                    className="transition-colors cursor-pointer flex-shrink-0"
                    title={`Focus on node: ${choice.nextNodeId}`}
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
                    value={choice.nextNodeId || ''}
                    onChange={(event) => onUpdateChoice(idx, { nextNodeId: event.target.value || undefined })}
                    className="w-full bg-[#0d0d14] border rounded px-2 py-1 pr-8 text-xs text-gray-300 outline-none"
                    style={{
                      borderColor: choice.nextNodeId ? darkChoiceColor : '#2a2a3e',
                    }}
                    onFocus={(event) => {
                      if (choice.nextNodeId) {
                        event.target.style.borderColor = darkChoiceColor;
                      } else {
                        event.target.style.borderColor = '#e94560';
                      }
                    }}
                    onBlur={(event) => {
                      if (choice.nextNodeId) {
                        event.target.style.borderColor = darkChoiceColor;
                      } else {
                        event.target.style.borderColor = '#2a2a3e';
                      }
                    }}
                  >
                    <option value="">— Select target —</option>
                    {Object.keys(dialogue.nodes).map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                  {choice.nextNodeId && (
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      title={`Connects to node: ${choice.nextNodeId}`}
                      style={{ color: CHOICE_COLORS[idx % CHOICE_COLORS.length] }}
                    >
                      <GitBranch size={14} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onRemoveChoice(idx)} 
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
                  value={choice.text}
                  onChange={(event) => onUpdateChoice(idx, { text: event.target.value })}
                  className={`w-full bg-[#0d0d14] border rounded px-3 py-2 text-sm outline-none transition-colors ${
                    hasCondition ? 'text-gray-100' : 'text-gray-200'
                  }`}
                  style={{
                    borderColor: choice.text ? darkChoiceColor : '#2a2a3e'
                  }}
                  placeholder="Dialogue text..."
                />
              </div>
              
              {hasCondition && (
                <div className="bg-blue-500/5 border border-blue-500/30 rounded p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-blue-400 uppercase font-medium">Condition</label>
                    <button
                      onClick={() => onUpdateChoice(idx, { conditions: undefined })}
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
                        setConditionInputs(prev => ({ ...prev, [choiceKey]: newValue }));
                        
                        const parseCondition = (conditionStr: string): any[] => {
                          const conditions: any[] = [];
                          if (!conditionStr.trim()) return conditions;
                          const parts = conditionStr.split(/\s+and\s+/i);
                          parts.forEach(part => {
                            part = part.trim();
                            if (part.startsWith('not ')) {
                              const flagName = part.substring(4).replace('$', '');
                              conditions.push({ flag: flagName, operator: 'is_not_set' });
                            } else if (part.match(/^\$(\w+)$/)) {
                              const match = part.match(/^\$(\w+)$/);
                              if (match) {
                                conditions.push({ flag: match[1], operator: 'is_set' });
                              }
                            } else {
                              const match = part.match(/^\$(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
                              if (match) {
                                const [, flagName, op, valueStr] = match;
                                let value: any = valueStr.trim();
                                if (value.startsWith('"') && value.endsWith('"')) {
                                  value = value.slice(1, -1);
                                } else if (!isNaN(Number(value))) {
                                  value = Number(value);
                                }
                                
                                const operator = op === '==' ? 'equals' :
                                                 op === '!=' ? 'not_equals' :
                                                 op === '>=' ? 'greater_equal' :
                                                 op === '<=' ? 'less_equal' :
                                                 op === '>' ? 'greater_than' :
                                                 op === '<' ? 'less_than' : 'equals';
                                
                                conditions.push({ flag: flagName, operator, value });
                              }
                            }
                          });
                          return conditions;
                        };
                        
                        const newConditions = parseCondition(newValue);
                        onUpdateChoice(idx, { 
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
                onChange={(flags) => onUpdateChoice(idx, { setFlags: flags.length > 0 ? flags : undefined })}
                flagSchema={flagSchema}
                placeholder="Set flags..."
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const StoryletNodeGroupBranches = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] text-gray-500 uppercase">Storylet Node Group</label>
        <button onClick={handleAddRandomizerBranch} className="text-[10px] text-[#e94560] hover:text-[#ff6b6b]">
          + Add
        </button>
      </div>
      {randomizerBranches.length === 0 ? (
        <div className="text-xs text-gray-500 p-4 text-center border border-[#2a2a3e] rounded">
          No group entries yet. Add one to define storylet options.
        </div>
      ) : (
        <div className="space-y-2">
          {randomizerBranches.map((branch, idx) => {
            const branchColor = CHOICE_COLORS[idx % CHOICE_COLORS.length];
            return (
              <div
                key={branch.id}
                className="rounded p-2 space-y-2 bg-[#12121a] border border-[#2a2a3e]"
                style={{ borderTopColor: branchColor }}
              >
                <div className="flex items-center gap-2 pb-2 border-b" style={{ borderBottomColor: branchColor }}>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-df-player-selected/20 text-df-player-selected border border-df-player-selected/40 font-medium">
                    ENTRY {idx + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={branch.label || ''}
                      onChange={(event) => handleUpdateRandomizerBranch(idx, { label: event.target.value || undefined })}
                      className="flex-1 bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 outline-none"
                      placeholder="Label"
                    />
                  </div>
                  {branch.nextNodeId && onFocusNode && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onFocusNode(branch.nextNodeId!);
                      }}
                      className="transition-colors cursor-pointer flex-shrink-0"
                      title={`Focus on node: ${branch.nextNodeId}`}
                    >
                      <EdgeIcon size={16} color={branchColor} className="transition-colors" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveRandomizerBranch(idx)}
                    className="text-gray-600 hover:text-red-400 flex-shrink-0"
                    title="Remove entry"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={branch.nextNodeId || ''}
                      onChange={(event) => handleUpdateRandomizerBranch(idx, { nextNodeId: event.target.value || undefined })}
                      className="w-full bg-[#0d0d14] border rounded px-2 py-1 pr-8 text-xs text-gray-300 outline-none"
                      style={{ borderColor: branch.nextNodeId ? branchColor : '#2a2a3e' }}
                    >
                      <option value="">— Select target node —</option>
                      {Object.keys(dialogue.nodes).map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    {branch.nextNodeId && (
                      <div
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        title={`Connects to node: ${branch.nextNodeId}`}
                        style={{ color: branchColor }}
                      >
                        <GitBranch size={14} />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={branch.storyletPoolId || ''}
                    onChange={(event) => handleUpdateRandomizerBranch(idx, { storyletPoolId: event.target.value || undefined })}
                    className="w-full bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-300 outline-none"
                    placeholder="Storylet node group ID (optional)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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
      <aside className={`w-80 border-l ${getBorderColor()} bg-df-sidebar-bg overflow-y-auto`}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded ${getNodeTypeBadge()}`}>
            {getNodeTypeLabel()}
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
          <StoryletNodeGroupFields
            node={node}
            dialogue={dialogue}
            onUpdate={onUpdate}
            onFocusNode={onFocusNode}
            onUpdateStoryletCall={handleStoryletCallUpdate}
          />
        )}

        {node.type === NODE_TYPE.CONDITIONAL && <ConditionalNodeFields />}

        {node.type === NODE_TYPE.PLAYER && <PlayerNodeFields />}

        {node.type === NODE_TYPE.RANDOMIZER && <StoryletNodeGroupBranches />}

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

      {/* Condition Editor Modal */}
      {editingCondition && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingCondition(null);
            }
          }}
        >
          <div 
            className="bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a3e] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Edit Condition</h3>
              <button
                onClick={() => setEditingCondition(null)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase mb-2 block">Yarn Condition Expression</label>
                  <textarea
                    value={editingCondition.value}
                    onChange={(e) => {
                      setEditingCondition({
                        ...editingCondition,
                        value: e.target.value
                      });
                    }}
                    className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-4 py-3 text-base text-gray-200 font-mono outline-none focus:border-blue-500 min-h-[200px] resize-y"
                    placeholder='e.g., $flag == "value" or $stat &gt;= 100'
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-500 mt-2">
                    Type Yarn condition: $flag, $flag == value, $stat &gt;= 100, etc.
                  </p>
                </div>

                {/* Validation - debounced */}
                {(() => {
                  const validation = validateCondition(debouncedEditingValue);
                  const hasError = !validation.isValid;
                  const hasWarning = validation.warnings.length > 0;
                  const showValidation = debouncedEditingValue.trim().length > 0 && editingCondition.value.trim().length > 0;

                  if (!showValidation) return null;

                  return (
                    <div className={`p-3 rounded border ${
                      hasError ? 'bg-red-500/10 border-red-500/30' :
                      hasWarning ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-green-500/10 border-green-500/30'
                    }`}>
                      <div className="flex items-start gap-2">
                        {hasError ? (
                          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        ) : hasWarning ? (
                          <Info size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 text-xs">
                          {hasError && (
                            <div>
                              <strong className="text-red-400">Errors:</strong>
                              <ul className="list-disc list-inside mt-1 ml-2 text-red-300">
                                {validation.errors.map((error, i) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {hasWarning && (
                            <div className={hasError ? 'mt-2' : ''}>
                              <strong className="text-yellow-400">Warnings:</strong>
                              <ul className="list-disc list-inside mt-1 ml-2 text-yellow-300">
                                {validation.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!hasError && !hasWarning && (
                            <div className="text-green-400">
                              ✓ Valid condition expression
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2a2a3e] flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingCondition(null)}
                className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Parse and save the condition
                  const parseCondition = (conditionStr: string): any[] => {
                    const conditions: any[] = [];
                    if (!conditionStr.trim()) return conditions;
                    
                    const parts = conditionStr.split(/\s+and\s+/i);
                    parts.forEach(part => {
                      part = part.trim();
                      if (part.startsWith('not ')) {
                        const varMatch = part.match(/not\s+\$(\w+)/);
                        if (varMatch) {
                          conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_NOT_SET });
                        }
                      } else if (part.includes('>=')) {
                        const match = part.match(/\$(\w+)\s*>=\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.GREATER_EQUAL, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else if (part.includes('<=')) {
                        const match = part.match(/\$(\w+)\s*<=\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.LESS_EQUAL, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else if (part.includes('!=')) {
                        const match = part.match(/\$(\w+)\s*!=\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.NOT_EQUALS, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else if (part.includes('==')) {
                        const match = part.match(/\$(\w+)\s*==\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.EQUALS, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else if (part.includes('>') && !part.includes('>=')) {
                        const match = part.match(/\$(\w+)\s*>\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.GREATER_THAN, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else if (part.includes('<') && !part.includes('<=')) {
                        const match = part.match(/\$(\w+)\s*<\s*(.+)/);
                        if (match) {
                          const value = match[2].trim().replace(/^["']|["']$/g, '');
                          conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.LESS_THAN, value: isNaN(Number(value)) ? value : Number(value) });
                        }
                      } else {
                        const varMatch = part.match(/\$(\w+)/);
                        if (varMatch) {
                          conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_SET });
                        }
                      }
                    });
                    return conditions;
                  };

                  if (editingCondition.type === 'block' && editingCondition.blockIdx !== undefined) {
                    const newBlocks = [...node.conditionalBlocks!];
                    newBlocks[editingCondition.blockIdx] = {
                      ...newBlocks[editingCondition.blockIdx],
                      condition: parseCondition(editingCondition.value)
                    };
                    onUpdate({ conditionalBlocks: newBlocks });
                    setConditionInputs(prev => ({ ...prev, [editingCondition.id]: editingCondition.value }));
                  } else if (editingCondition.type === 'choice' && editingCondition.choiceIdx !== undefined) {
                    if (editingCondition.value.trim()) {
                      const newConditions = parseCondition(editingCondition.value);
                      onUpdateChoice(editingCondition.choiceIdx, { 
                        conditions: newConditions.length > 0 ? newConditions : []
                      });
                    } else {
                      onUpdateChoice(editingCondition.choiceIdx, { conditions: [] });
                    }
                    setConditionInputs(prev => ({ ...prev, [editingCondition.id]: editingCondition.value }));
                  }
                  
                  setEditingCondition(null);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
