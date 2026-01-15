import React from 'react';
import { ForgeNode } from '@/forge/types/forge-graph';
import { FlagSchema } from '@/forge/types/flags';
import { Label } from '@/shared/ui/label';
import { FlagSelector } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/FlagSelector';

interface NodeEditorSetFlagsFieldProps {
  node: ForgeNode;
  flagSchema?: FlagSchema;
  onUpdate: (updates: Partial<ForgeNode>) => void;
}

export function NodeEditorSetFlagsField({ node, flagSchema, onUpdate }: NodeEditorSetFlagsFieldProps) {
  return (
    <div>
      <Label className="text-[10px] text-gray-500 uppercase">Set Flags (on enter)</Label>
      <div className="mt-1">
        <FlagSelector
          value={node.setFlags || []}
          onChange={(flags) => onUpdate({ setFlags: flags.length > 0 ? flags : undefined })}
          flagSchema={flagSchema}
          placeholder="flag1, flag2"
        />
      </div>
    </div>
  );
}
