import React from 'react';
import { ForgeNode } from '@/forge/types/forge-graph';
import { Label } from '@/shared/ui/label';

interface NodeEditorRuntimeDirectivesFieldProps {
  node: ForgeNode;
}

const directivePlaceholders = [
  { label: 'Scene', description: 'Placeholder' },
  { label: 'Media', description: 'Placeholder' },
  { label: 'Camera', description: 'Placeholder' },
  { label: 'Overlay', description: 'Placeholder' },
];

export function NodeEditorRuntimeDirectivesField({ node }: NodeEditorRuntimeDirectivesFieldProps) {
  const directiveCount = node.runtimeDirectives?.length ?? 0;

  return (
    <div>
      <Label className="text-[10px] text-gray-500 uppercase">Runtime Directives</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Placeholder slots for runtime-only scene/media/camera/overlay directives.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {directivePlaceholders.map(item => (
          <div
            key={item.label}
            className="rounded border border-df-node-border bg-[#12121a] px-2 py-1 text-[11px] text-muted-foreground"
          >
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="ml-2 text-[10px] text-muted-foreground">{item.description}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {directiveCount > 0
          ? `${directiveCount} directive${directiveCount === 1 ? '' : 's'} configured.`
          : 'No runtime directives configured.'}
      </p>
    </div>
  );
}
