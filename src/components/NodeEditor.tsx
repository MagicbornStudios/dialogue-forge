import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DialogueNode, DialogueTree, Choice, ConditionalBlock } from '../types';
import { FlagSchema } from '../types/flags';
import { Character } from '../types/characters';
import { FlagSelector } from './FlagSelector';
import { CharacterSelector } from './CharacterSelector';
import { CONDITION_OPERATOR } from '../types/constants';
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
    if (node.type === 'npc') return 'border-df-npc-border';
    if (node.type === 'player') return 'border-df-player-border';
    if (node.type === 'conditional') return 'border-df-conditional-border';
    return 'border-df-control-border';
  };

  // Get node type badge colors
  const getNodeTypeBadge = () => {
    if (node.type === 'npc') return 'bg-df-npc-selected/20 text-df-npc-selected';
    if (node.type === 'player') return 'bg-df-player-selected/20 text-df-player-selected';
    if (node.type === 'conditional') return 'bg-df-conditional-border/20 text-df-conditional-border';
    return 'bg-df-control-bg text-df-text-secondary';
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
      <aside className={`w-80 border-l ${getBorderColor()} bg-df-sidebar-bg overflow-y-auto`}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded ${getNodeTypeBadge()}`}>
            {node.type === 'npc' ? 'NPC' : node.type === 'player' ? 'PLAYER' : 'CONDITIONAL'}
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

        {node.type === 'npc' && (
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
                    speaker: character ? character.name : node.speaker, // Keep speaker as fallback
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
                  onChange={(e) => onUpdate({ speaker: e.target.value })}
                  className="flex-1 bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
                  placeholder="Custom speaker name (optional)"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Content</label>
              <textarea
                value={node.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none min-h-[100px] resize-y"
                placeholder="What the character says..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Next Node</label>
              <div className="flex items-center gap-2">
                {node.nextNodeId && onFocusNode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onFocusNode(node.nextNodeId!);
                    }}
                    className="transition-colors cursor-pointer flex-shrink-0 group"
                    title={`Focus on node: ${node.nextNodeId}`}
                  >
                    <EdgeIcon size={16} color="#2a2a3e" className="group-hover:[&_circle]:fill-[#2a2a3e] group-hover:[&_line]:stroke-[#2a2a3e] transition-colors" />
                  </button>
                )}
                <select
                  value={node.nextNodeId || ''}
                  onChange={(e) => onUpdate({ nextNodeId: e.target.value || undefined })}
                  className="flex-1 bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-sm text-gray-200 outline-none"
                >
                  <option value="">— End —</option>
                  {Object.keys(dialogue.nodes).filter(id => id !== node.id).map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {node.type === 'conditional' && (
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
                    // Use current value for immediate validation feedback, debounced value for final validation
                    const valueToValidate = debouncedValue || conditionValue;
                    const validation = block.type !== 'else' ? validateCondition(valueToValidate) : { isValid: true, errors: [], warnings: [] };
                    const hasError = !validation.isValid;
                    const hasWarning = validation.warnings.length > 0;
                    const showValidation = conditionValue.trim().length > 0;
                    const isManuallyOpen = expandedConditions.has(block.id);
                    const shouldExpand = isManuallyOpen;
                    
                    // Determine block styling based on type
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
                                speaker: character ? character.name : block.speaker, // Keep speaker as fallback
                              };
                              onUpdate({ conditionalBlocks: newBlocks });
                            }}
                            placeholder="Speaker..."
                            compact={true}
                            className="flex-1"
                          />
                          {/* Custom speaker input - fallback */}
                          <input
                            type="text"
                            value={block.speaker || ''}
                            onChange={(e) => {
                              const newBlocks = [...node.conditionalBlocks!];
                              newBlocks[idx] = { ...block, speaker: e.target.value || undefined };
                              onUpdate({ conditionalBlocks: newBlocks });
                            }}
                            className={`flex-1 bg-df-elevated border border-df-control-border rounded px-1.5 py-0.5 text-[10px] text-df-text-primary focus:border-df-conditional-selected outline-none`}
                            placeholder="Custom name"
                          />
                        </div>
                      </div>
                      
                      {block.type !== 'else' && (() => {
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
                          
                          return (
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <label className={`text-[10px] ${styles.text} uppercase font-medium`}>Condition</label>
                              </div>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={conditionValue}
                                  onChange={(e) => {
                                    setConditionInputs(prev => ({ ...prev, [block.id]: e.target.value }));
                                    const newBlocks = [...node.conditionalBlocks!];
                                    newBlocks[idx] = {
                                      ...block,
                                      condition: parseCondition(e.target.value)
                                    };
                                    onUpdate({ conditionalBlocks: newBlocks });
                                  }}
                                  className={`w-full bg-[#1a1a1a] border rounded px-2 py-1 pr-24 text-xs ${styles.text} font-mono outline-none transition-all`}
                                  style={{
                                    borderColor: showValidation 
                                      ? (hasError ? '#ef4444' : 
                                         hasWarning ? '#eab308' : 
                                         validation.isValid ? '#22c55e' : '#2a2a2a')
                                      : '#2a2a2a'
                                  }}
                                  placeholder='e.g., $flag == "value" or $stat &gt;= 100'
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  {showValidation && (
                                    <>
                                      {hasError ? (
                                        <div className="group relative">
                                          <AlertCircle className="w-4 h-4 text-red-500" />
                                          <div className="absolute right-0 top-6 w-64 p-2 bg-[#1a1a1a] border border-red-500 rounded text-xs text-gray-300 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                            <div className="font-semibold text-red-400 mb-1">Validation Errors:</div>
                                            {validation.errors.map((error, i) => (
                                              <div key={i}>• {error}</div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : hasWarning ? (
                                        <div className="group relative">
                                          <Info className="w-4 h-4 text-yellow-500" />
                                          <div className="absolute right-0 top-6 w-64 p-2 bg-[#1a1a1a] border border-yellow-500 rounded text-xs text-gray-300 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                            <div className="font-semibold text-yellow-400 mb-1">Warnings:</div>
                                            {validation.warnings.map((warning, i) => (
                                              <div key={i}>• {warning}</div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )}
                                    </>
                                  )}
                                  <button
                                    onClick={() => {
                                      setExpandedConditions(prev => {
                                        const next = new Set(prev);
                                        next.add(block.id);
                                        return next;
                                      });
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                    title="Expand editor"
                                  >
                                    <Maximize2 size={14} />
                                  </button>
                                </div>
                              </div>
                              {showValidation && validation.errors.length > 0 && (
                                <p className="text-[10px] text-red-500 mt-1">{validation.errors[0]}</p>
                              )}
                              {showValidation && validation.warnings.length > 0 && validation.errors.length === 0 && (
                                <p className="text-[10px] text-yellow-500 mt-1">{validation.warnings[0]}</p>
                              )}
                              {showValidation && validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0 && (
                                <p className="text-[10px] text-green-500 mt-1">Valid condition</p>
                              )}
                              {!conditionValue && (
                                <p className="text-[10px] text-blue-400/80 mt-1">Type Yarn condition: $flag, $flag == value, $stat &gt;= 100, etc.</p>
                              )}
                            </div>
                          );
                        })()}
                      
                      {shouldExpand && (
                        <div 
                          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity"
                          style={{ animation: 'fadeIn 0.2s ease-in-out' }}
                          onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                              (e.currentTarget as HTMLElement).setAttribute('data-mousedown-backdrop', 'true');
                            }
                          }}
                          onMouseUp={(e) => {
                            if (e.target === e.currentTarget && 
                                (e.currentTarget as HTMLElement).getAttribute('data-mousedown-backdrop') === 'true') {
                              setExpandedConditions(prev => {
                                const next = new Set(prev);
                                next.delete(block.id);
                                return next;
                              });
                            }
                            (e.currentTarget as HTMLElement).removeAttribute('data-mousedown-backdrop');
                          }}
                        >
                          <div 
                            className="bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col transition-all"
                            style={{ animation: 'slideUp 0.2s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <div className="p-3 border-b border-[#2a2a3e] flex items-center justify-between bg-gradient-to-r from-[#0d0d14] to-[#1a1a2e]">
                              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="text-blue-400">⚡</span>
                                Condition Editor
                              </h3>
                              <button
                                onClick={() => {
                                  setExpandedConditions(prev => {
                                    const next = new Set(prev);
                                    next.delete(block.id);
                                    return next;
                                  });
                                }}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="Close (Esc)"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            {/* Two-column layout */}
                            <div className="flex flex-1 overflow-hidden">
                              {/* Left sidebar - Tools */}
                              <div className="w-44 bg-[#0a0a0f] border-r border-[#2a2a3e] p-3 overflow-y-auto flex flex-col gap-4">
                                {/* Pro tip */}
                                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-2.5">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-sm">💡</span>
                                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Pro Tip</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-relaxed">
                                    Type <code className="text-purple-400 bg-purple-500/20 px-1 rounded font-bold">$</code> to access variables & flags.
                                  </p>
                                </div>

                                {/* Operators */}
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase mb-1.5 block font-semibold tracking-wider">Operators</label>
                                  <div className="grid grid-cols-3 gap-1">
                                    {['==', '!=', '>=', '<=', '>', '<'].map((op) => (
                                      <button
                                        key={op}
                                        type="button"
                                        onClick={() => {
                                          const val = conditionValue;
                                          const space = val.length > 0 && !val.endsWith(' ') ? ' ' : '';
                                          setConditionInputs(prev => ({ ...prev, [block.id]: val + space + op + ' ' }));
                                        }}
                                        className="px-1.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs font-mono hover:bg-purple-500/40 transition-all"
                                      >
                                        {op}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Keywords */}
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase mb-1.5 block font-semibold tracking-wider">Keywords</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    {['and', 'not'].map((kw) => (
                                      <button
                                        key={kw}
                                        type="button"
                                        onClick={() => {
                                          const val = conditionValue;
                                          const space = val.length > 0 && !val.endsWith(' ') ? ' ' : '';
                                          setConditionInputs(prev => ({ ...prev, [block.id]: val + space + kw + ' ' }));
                                        }}
                                        className="px-1.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-mono hover:bg-blue-500/40 transition-all"
                                      >
                                        {kw}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Templates */}
                                <div>
                                  <label className="text-[9px] text-gray-500 uppercase mb-1.5 block font-semibold tracking-wider">Templates</label>
                                  <div className="flex flex-col gap-1">
                                    {[
                                      { p: '$flag == true', l: 'Boolean' },
                                      { p: '$stat >= 100', l: 'Compare' },
                                      { p: '$a and $b', l: 'Multiple' },
                                    ].map(({ p, l }) => (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setConditionInputs(prev => ({ ...prev, [block.id]: p }))}
                                        className="text-left px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-[10px] font-mono hover:bg-gray-500/20 transition-all"
                                      >
                                        <div className="text-gray-300">{p}</div>
                                        <div className="text-[8px] text-gray-600">{l}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Right panel - Editor */}
                              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                                <ConditionAutocomplete
                                  value={conditionValue}
                                  onChange={(newValue) => {
                                    setConditionInputs(prev => ({ ...prev, [block.id]: newValue }));
                                    const parseCondition = (conditionStr: string): any[] => {
                                      const conditions: any[] = [];
                                      if (!conditionStr.trim()) return conditions;
                                      const parts = conditionStr.split(/\s+and\s+/i);
                                      parts.forEach(part => {
                                        part = part.trim();
                                        if (part.startsWith('not ')) {
                                          const varMatch = part.match(/not\s+\$(\w+)/);
                                          if (varMatch) conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_NOT_SET });
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
                                          if (varMatch) conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_SET });
                                        }
                                      });
                                      return conditions;
                                    };
                                    const newBlocks = [...node.conditionalBlocks!];
                                    newBlocks[idx] = { ...block, condition: parseCondition(newValue) };
                                    onUpdate({ conditionalBlocks: newBlocks });
                                  }}
                                  flagSchema={flagSchema}
                                  textarea={true}
                                  placeholder='e.g., $flag == "value" or $stat >= 100'
                                  className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none focus:border-blue-500 min-h-[180px] resize-y"
                                />
                                {showValidation && (
                                  <div className={`p-2 rounded text-xs ${
                                    hasError ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
                                    hasWarning ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' :
                                    'bg-green-500/10 border border-green-500/30 text-green-400'
                                  }`}>
                                    {hasError && (
                                      <div>
                                        <strong>Errors:</strong>
                                        <ul className="list-disc list-inside mt-1 ml-2">
                                          {validation.errors.map((error: string, i: number) => (
                                            <li key={i}>{error}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {hasWarning && (
                                      <div className={hasError ? 'mt-2' : ''}>
                                        <strong>Warnings:</strong>
                                        <ul className="list-disc list-inside mt-1 ml-2">
                                          {validation.warnings.map((warning: string, i: number) => (
                                            <li key={i}>{warning}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {!hasError && !hasWarning && (
                                      <div>✓ Valid condition expression</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className={`text-[10px] ${styles.text} uppercase mb-1 block`}>Content</label>
                        <textarea
                          value={block.content}
                          onChange={(e) => {
                            const newBlocks = [...node.conditionalBlocks!];
                            newBlocks[idx] = { ...block, content: e.target.value };
                            onUpdate({ conditionalBlocks: newBlocks });
                          }}
                          className={`w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1 text-sm ${styles.text} outline-none min-h-[80px] resize-y`}
                          placeholder="Dialogue content..."
                        />
                      </div>
                      <div>
                        <label className={`text-[10px] ${styles.text} uppercase`}>Next Node (optional)</label>
                        <div className="flex items-center gap-2">
                          {block.nextNodeId && onFocusNode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFocusNode(block.nextNodeId!);
                              }}
                              className="transition-colors cursor-pointer flex-shrink-0 group"
                              title={`Focus on node: ${block.nextNodeId}`}
                            >
                              <EdgeIcon 
                                size={16} 
                                color={block.nextNodeId ? '#3b82f6' : '#2a2a3e'} 
                                className="group-hover:[&_circle]:fill-[#3b82f6] group-hover:[&_line]:stroke-[#3b82f6] transition-colors" 
                              />
                            </button>
                          )}
                          <div className="relative flex-1">
                            <select
                              value={block.nextNodeId || ''}
                              onChange={(e) => {
                                const newBlocks = [...node.conditionalBlocks!];
                                newBlocks[idx] = { ...block, nextNodeId: e.target.value || undefined };
                                onUpdate({ conditionalBlocks: newBlocks });
                              }}
                              className={`w-full bg-[#1a1a1a] border rounded px-2 py-1 pr-8 text-xs ${styles.text} outline-none`}
                              style={{
                                borderColor: block.nextNodeId ? '#3b82f6' : '#2a2a3e',
                              }}
                            >
                              <option value="">— Continue —</option>
                              {Object.keys(dialogue.nodes).filter(id => id !== node.id).map(id => (
                                <option key={id} value={id}>{id}</option>
                              ))}
                            </select>
                            {block.nextNodeId && (
                              <div 
                                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                                title={`Connects to node: ${block.nextNodeId}`}
                                style={{ color: '#3b82f6' }}
                              >
                                <GitBranch size={14} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                  <div className="flex gap-2">
                    {node.conditionalBlocks[node.conditionalBlocks.length - 1].type !== 'else' && (
                      <button
                        onClick={() => {
                          const newBlocks = [...node.conditionalBlocks!];
                          newBlocks.push({
                            id: `block_${Date.now()}`,
                            type: newBlocks.some(b => b.type === 'if') ? 'elseif' : 'if',
                            condition: [],
                            content: '',
                            speaker: undefined
                          });
                          onUpdate({ conditionalBlocks: newBlocks });
                        }}
                        className="text-xs px-2 py-1 bg-[#12121a] border border-[#2a2a3e] rounded text-gray-400 hover:text-gray-200"
                      >
                        + Add {node.conditionalBlocks.some(b => b.type === 'if') ? 'Else If' : 'If'}
                      </button>
                    )}
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
        )}

        {node.type === 'player' && (
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
                    speaker: character ? character.name : node.speaker, // Keep speaker as fallback
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
                  onChange={(e) => onUpdate({ speaker: e.target.value })}
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
                // Use debounced value for validation
                const validationResult = validateCondition(debouncedValue);
                
                const choiceColor = CHOICE_COLORS[idx % CHOICE_COLORS.length];
                // Darken the choice color for inputs (reduce brightness by ~40%)
                const darkenColor = (color: string): string => {
                  // Convert hex to RGB
                  const hex = color.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  // Darken by 40%
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
                    {/* Header with toggle and badge */}
                    <div 
                      className="flex items-center gap-2 pb-2 border-b"
                      style={{
                        borderBottomColor: hasCondition ? '#2a2a3e' : choiceColor
                      }}
                    >
                      {/* Toggle switch for conditional */}
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={hasCondition}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Initialize with empty array to show condition input
                                onUpdateChoice(idx, { conditions: [] });
                              } else {
                                // Remove condition
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
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
                          onChange={(e) => onUpdateChoice(idx, { nextNodeId: e.target.value || undefined })}
                          className="w-full bg-[#0d0d14] border rounded px-2 py-1 pr-8 text-xs text-gray-300 outline-none"
                          style={{
                            borderColor: choice.nextNodeId ? darkChoiceColor : '#2a2a3e',
                          }}
                          onFocus={(e) => {
                            if (choice.nextNodeId) {
                              e.target.style.borderColor = darkChoiceColor;
                            } else {
                              e.target.style.borderColor = '#e94560';
                            }
                          }}
                          onBlur={(e) => {
                            if (choice.nextNodeId) {
                              e.target.style.borderColor = darkChoiceColor;
                            } else {
                              e.target.style.borderColor = '#2a2a3e';
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
                    
                    {/* Dialogue text input - prominent */}
                    <div className="pt-2">
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => onUpdateChoice(idx, { text: e.target.value })}
                        className={`w-full bg-[#0d0d14] border rounded px-3 py-2 text-sm outline-none transition-colors ${
                          hasCondition ? 'text-gray-100' : 'text-gray-200'
                        }`}
                        style={{
                          borderColor: choice.text ? darkChoiceColor : '#2a2a3e'
                        }}
                        placeholder="Dialogue text..."
                      />
                    </div>
                    
                    {/* Condition section - only show if has condition or when adding */}
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
                              
                              // Parse and update condition immediately
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
                                      // Remove quotes if present
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
                            placeholder="e.g., $reputation &gt; 10 or $flag == &quot;value&quot;"
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
