import React from 'react';
import { ForgeNode } from '@magicborn/forge/types/forge-graph';
import { Label } from '@magicborn/shared/ui/label';
import { Input } from '@magicborn/shared/ui/input';

interface NodeEditorIdFieldProps {
  node: ForgeNode;
}

export function NodeEditorIdField({ node }: NodeEditorIdFieldProps) {
  return (
    <div>
      <Label className="text-[10px] text-df-text-tertiary uppercase">ID</Label>
      <Input 
        value={node.id} 
        disabled 
        className="mt-1 bg-df-surface border border-df-control-border text-xs text-df-text-tertiary font-mono" 
      />
    </div>
  );
}
