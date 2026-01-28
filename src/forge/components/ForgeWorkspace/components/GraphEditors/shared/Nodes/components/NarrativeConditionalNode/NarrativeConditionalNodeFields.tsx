import React, { useMemo, useState, useRef } from 'react';
import { ExternalLink, Plus, X } from 'lucide-react';
import { ForgeGraphDoc } from '@/forge/types/forge-graph';
import { NextNodeSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/NodeEditor/NextNodeSelector';
import { ForgeNode, FORGE_GRAPH_KIND, type ForgeNarrativeConditionalCall, type ForgeCondition } from '@/forge/types/forge-graph';
import { useForgeWorkspaceActions } from '@/forge/components/ForgeWorkspace/hooks/useForgeWorkspaceActions';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { Button } from '@/shared/ui/button';
import { ConditionAutocomplete } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/ConditionAutocomplete';
import { parseCondition, validateCondition } from '@/forge/lib/yarn-converter/utils/condition-utils';
import type { FlagSchema } from '@/forge/types/flags';

interface NarrativeConditionalNodeFieldsProps {
  node: ForgeNode;
  graph: ForgeGraphDoc;
  onUpdate: (updates: Partial<ForgeNode>) => void;
  onFocusNode?: (nodeId: string) => void;
  flagSchema?: FlagSchema;
}

export function NarrativeConditionalNodeFields({
  node,
  graph,
  onUpdate,
  onFocusNode,
  flagSchema,
}: NarrativeConditionalNodeFieldsProps) {
  const workspaceActions = useForgeWorkspaceActions();
  const pushBreadcrumb = useForgeWorkspaceStore((s) => s.actions.pushBreadcrumb);
  const targetGraphId = node.narrativeConditionalCall?.targetGraphId;
  const conditions = node.narrativeConditionalCall?.conditions || [];
  
  // Get available narrative graphs from workspace store
  const allGraphs = useForgeWorkspaceStore(s => s.graphs.byId);
  const narrativeGraphs = useMemo(() => 
    Object.values(allGraphs).filter(g => g.kind === FORGE_GRAPH_KIND.NARRATIVE),
    [allGraphs]
  );
  
  // Condition input state
  const [conditionInputs, setConditionInputs] = useState<Record<string, string>>({});
  const [debouncedConditionInputs, setDebouncedConditionInputs] = useState<Record<string, string>>({});
  const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Initialize condition inputs from existing conditions
  React.useEffect(() => {
    const inputs: Record<string, string> = {};
    conditions.forEach((condition, idx) => {
      const key = `condition_${idx}`;
      // Format condition for display (simplified - just show flag and operator)
      inputs[key] = `${condition.flag} ${condition.operator} ${condition.value ?? ''}`.trim();
    });
    setConditionInputs(inputs);
    setDebouncedConditionInputs(inputs);
  }, []);
  
  const handleUpdateNarrativeConditionalCall = (updates: Partial<NonNullable<ForgeNode['narrativeConditionalCall']>>) => {
    const nextCall = {
      ...(node.narrativeConditionalCall ?? { conditions: [] }),
      ...updates,
    };
    const hasValues = nextCall.targetGraphId !== undefined && nextCall.targetGraphId !== null;
    onUpdate({ 
      narrativeConditionalCall: hasValues ? nextCall as ForgeNarrativeConditionalCall : undefined 
    });
  };
  
  const handleAddCondition = () => {
    const newCondition: ForgeCondition = {
      flag: '',
      operator: 'IS_SET' as any,
    };
    handleUpdateNarrativeConditionalCall({
      conditions: [...conditions, newCondition],
    });
  };
  
  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, idx) => idx !== index);
    handleUpdateNarrativeConditionalCall({
      conditions: newConditions,
    });
  };
  
  const handleUpdateCondition = (index: number, conditionString: string) => {
    const key = `condition_${index}`;
    setConditionInputs(prev => ({ ...prev, [key]: conditionString }));
    
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    
      debounceTimersRef.current[key] = setTimeout(() => {
        setDebouncedConditionInputs(prev => ({ ...prev, [key]: conditionString }));
        const parsedConditions = parseCondition(conditionString);
        if (parsedConditions.length > 0) {
          // Replace the condition at this index with all parsed conditions
          // If multiple conditions are parsed, we'll replace just this one with the first
          // and add the rest as new conditions
          const newConditions = [...conditions];
          if (parsedConditions.length === 1) {
            newConditions[index] = parsedConditions[0];
          } else {
            // Multiple conditions parsed - replace current and add rest
            newConditions[index] = parsedConditions[0];
            newConditions.splice(index + 1, 0, ...parsedConditions.slice(1));
          }
          handleUpdateNarrativeConditionalCall({
            conditions: newConditions,
          });
        } else if (conditionString.trim().length === 0) {
          // Empty condition - remove it
          const newConditions = conditions.filter((_, idx) => idx !== index);
          handleUpdateNarrativeConditionalCall({
            conditions: newConditions,
          });
        }
      }, 500);
  };
  
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Title</label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(event) => onUpdate({ label: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-conditional-accent)] outline-none"
          placeholder="Narrative conditional title"
        />
      </div>
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={node.content || ''}
          onChange={(event) => onUpdate({ content: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-conditional-accent)] outline-none min-h-[60px] resize-y"
          placeholder="Narrative conditional summary/description"
        />
      </div>
      
      {targetGraphId && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Push current graph to breadcrumb before opening new one
              const currentGraphId = graph?.id ? String(graph.id) : null;
              if (currentGraphId && graph) {
                pushBreadcrumb({
                  graphId: currentGraphId,
                  title: graph.title || `Graph ${currentGraphId}`,
                  scope: 'narrative',
                });
              }
              workspaceActions.openNarrativeGraph(String(targetGraphId));
            }}
            className="w-full"
          >
            <ExternalLink size={14} className="mr-2" />
            Open Narrative Graph
          </Button>
        </div>
      )}
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Narrative Graph</label>
        <select
          value={targetGraphId || ''}
          onChange={(event) => {
            const newGraphId = event.target.value ? parseInt(event.target.value) : undefined;
            if (newGraphId) {
              handleUpdateNarrativeConditionalCall({ 
                targetGraphId: newGraphId,
                targetStartNodeId: node.narrativeConditionalCall?.targetStartNodeId,
                conditions: node.narrativeConditionalCall?.conditions || [],
              });
            } else {
              // Clear narrative conditional call if no graph selected
              onUpdate({ narrativeConditionalCall: undefined });
            }
          }}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-conditional-accent)] outline-none"
        >
          <option value="">Select narrative graph...</option>
          {narrativeGraphs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title || `Graph ${g.id}`}
            </option>
          ))}
        </select>
        <div className="text-[9px] text-[var(--color-df-text-tertiary)] mt-1">
          Target narrative graph for conditional routing
        </div>
      </div>
      
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Target Node ID (Optional)</label>
        <input
          type="text"
          value={node.narrativeConditionalCall?.targetStartNodeId || ''}
          onChange={(event) => {
            const targetStartNodeId = event.target.value || undefined;
            if (node.narrativeConditionalCall?.targetGraphId) {
              handleUpdateNarrativeConditionalCall({
                targetStartNodeId,
              });
            }
          }}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-conditional-accent)] outline-none"
          placeholder="target_start_node_id"
        />
        <div className="text-[9px] text-[var(--color-df-text-tertiary)] mt-1">
          Optional: specific node to jump to in target graph
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500 uppercase">Conditions</label>
          <button
            onClick={handleAddCondition}
            className="text-[10px] px-2 py-1 bg-card border border-border rounded text-foreground hover:bg-card/80 transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            Add Condition
          </button>
        </div>
        
        {conditions.length > 0 ? (
          <div className="space-y-2">
            {conditions.map((condition, idx) => {
              const key = `condition_${idx}`;
              const conditionValue = conditionInputs[key] || '';
              const debouncedValue = debouncedConditionInputs[key] || '';
              const valueToValidate = debouncedValue || conditionValue;
              const validation = validateCondition(valueToValidate, flagSchema);
              const hasError = !validation.isValid;
              const hasWarning = validation.warnings.length > 0;
              const showValidation = conditionValue.trim().length > 0;
              
              return (
                <div key={idx} className="bg-card border border-border rounded p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Condition {idx + 1}</span>
                    <button
                      onClick={() => handleRemoveCondition(idx)}
                      className="text-[10px] text-gray-500 hover:text-red-400"
                      title="Remove condition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <ConditionAutocomplete
                    value={conditionValue}
                    onChange={(newValue) => handleUpdateCondition(idx, newValue)}
                    placeholder="e.g., $reputation > 10 or $flag == 'value'"
                    className={`w-full bg-[#0d0d14] border rounded px-2 py-1 text-xs text-gray-300 font-mono outline-none transition-colors ${
                      hasError ? 'border-red-500' : hasWarning ? 'border-yellow-500' : 'border-[#2a2a3e]'
                    }`}
                    flagSchema={flagSchema}
                  />
                  {showValidation && (
                    <div className={`text-[9px] ${hasError ? 'text-red-500' : hasWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                      {hasError ? validation.errors[0] : hasWarning ? validation.warnings[0] : 'Valid condition'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-gray-500 p-4 text-center border border-border rounded">
            No conditions. Add a condition to enable conditional routing.
          </div>
        )}
      </div>
      
      <NextNodeSelector
        nodeId={node.id as string}
        nextNodeId={node.defaultNextNodeId}
        graph={graph}
        onUpdate={(updates) => onUpdate({ ...node, ...updates })}
        onFocusNode={onFocusNode}
      />
    </>
  );
}
