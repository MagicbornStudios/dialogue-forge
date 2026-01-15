import React from 'react';
import { ForgeNode } from '@/forge/types/forge-graph';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';

interface NodeEditorIdFieldProps {
  node: ForgeNode;
}

export function NodeEditorIdField({ node }: NodeEditorIdFieldProps) {
  return (
    <div>
      <Label className="text-[10px] text-gray-500 uppercase">ID</Label>
      <Input 
        value={node.id} 
        disabled 
        className="mt-1 bg-[#12121a] border border-[#2a2a3e] text-xs text-gray-500 font-mono" 
      />
    </div>
  );
}
