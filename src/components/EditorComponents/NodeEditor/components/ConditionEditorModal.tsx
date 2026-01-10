import React, { useState, useEffect, useRef } from 'react';
import { DialogueNode, Choice } from '../../../../types';
import { FlagSchema } from '../../../../types/flags';
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { validateCondition, parseCondition } from '../../utils/condition-utils';

interface ConditionEditorModalProps {
  editingCondition: {
    id: string;
    value: string;
    type: 'block' | 'choice';
    blockIdx?: number;
    choiceIdx?: number;
  } | null;
  node: DialogueNode;
  flagSchema?: FlagSchema;
  onClose: () => void;
  onUpdate: (updates: Partial<DialogueNode>) => void;
  onUpdateChoice: (idx: number, updates: Partial<Choice>) => void;
  setConditionInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ConditionEditorModal({
  editingCondition,
  node,
  flagSchema,
  onClose,
  onUpdate,
  onUpdateChoice,
  setConditionInputs,
}: ConditionEditorModalProps) {
  const [value, setValue] = useState(editingCondition?.value || '');
  const [debouncedValue, setDebouncedValue] = useState(editingCondition?.value || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editingCondition) {
      setValue(editingCondition.value);
      setDebouncedValue(editingCondition.value);
    }
  }, [editingCondition]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  if (!editingCondition) return null;

  const validation = validateCondition(debouncedValue, flagSchema);
  const hasError = !validation.isValid;
  const hasWarning = validation.warnings.length > 0;
  const showValidation = debouncedValue.trim().length > 0 && value.trim().length > 0;

  const handleSave = () => {
    if (editingCondition.type === 'block' && editingCondition.blockIdx !== undefined) {
      const newBlocks = [...node.conditionalBlocks!];
      newBlocks[editingCondition.blockIdx] = {
        ...newBlocks[editingCondition.blockIdx],
        condition: parseCondition(value)
      };
      onUpdate({ conditionalBlocks: newBlocks });
      setConditionInputs(prev => ({ ...prev, [editingCondition.id]: value }));
    } else if (editingCondition.type === 'choice' && editingCondition.choiceIdx !== undefined) {
      if (value.trim()) {
        const newConditions = parseCondition(value);
        onUpdateChoice(editingCondition.choiceIdx, { 
          conditions: newConditions.length > 0 ? newConditions : []
        });
      } else {
        onUpdateChoice(editingCondition.choiceIdx, { conditions: [] });
      }
      setConditionInputs(prev => ({ ...prev, [editingCondition.id]: value }));
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#2a2a3e] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Edit Condition</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase mb-2 block">Yarn Condition Expression</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-4 py-3 text-base text-gray-200 font-mono outline-none focus:border-blue-500 min-h-[200px] resize-y"
                placeholder='e.g., $flag == "value" or $stat &gt;= 100'
                autoFocus
              />
              <p className="text-[10px] text-gray-500 mt-2">
                Type Yarn condition: $flag, $flag == value, $stat &gt;= 100, etc.
              </p>
            </div>

            {showValidation && (
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
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#2a2a3e] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
