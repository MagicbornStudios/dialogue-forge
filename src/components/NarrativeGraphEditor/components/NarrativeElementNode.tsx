import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { BookOpen, Files, Layers, ScrollText } from 'lucide-react';
import { NARRATIVE_ELEMENT, type NarrativeElement } from '../../../types/narrative';
import type { NarrativeFlowNodeData } from '../../../utils/narrative-converter';

const elementMeta: Record<
  NarrativeElement,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; accent: string }
> = {
  [NARRATIVE_ELEMENT.THREAD]: {
    label: 'Thread',
    icon: ScrollText,
    accent: 'text-df-npc-selected border-df-npc-selected bg-df-npc-header/30',
  },
  [NARRATIVE_ELEMENT.ACT]: {
    label: 'Act',
    icon: Layers,
    accent: 'text-df-player-selected border-df-player-selected bg-df-player-header/30',
  },
  [NARRATIVE_ELEMENT.CHAPTER]: {
    label: 'Chapter',
    icon: BookOpen,
    accent: 'text-df-conditional-text border-df-conditional-border bg-df-conditional-header/30',
  },
  [NARRATIVE_ELEMENT.PAGE]: {
    label: 'Page',
    icon: Files,
    accent: 'text-df-text-primary border-df-node-border bg-df-node-bg/40',
  },
  [NARRATIVE_ELEMENT.STORYLET]: {
    label: 'Storylet',
    icon: BookOpen,
    accent: 'text-df-text-primary border-df-node-border bg-df-node-bg/40',
  },
};

export function NarrativeElementNode({ data, selected }: NodeProps<NarrativeFlowNodeData>) {
  const meta = elementMeta[data.elementType];
  const Icon = meta.icon;
  const title = data.element.title || data.element.id;
  const summary = data.element.summary;

  return (
    <div
      className={`min-w-[220px] max-w-[320px] rounded-lg border-2 shadow-sm bg-df-node-bg ${
        selected ? 'border-df-node-selected shadow-df-glow' : 'border-df-node-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
      />
      <div className="px-3 py-2 border-b border-df-node-border flex items-center gap-2 bg-df-control-bg">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${meta.accent}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-df-text-tertiary">{meta.label}</div>
          <div className="text-sm font-semibold text-df-text-primary truncate">{title}</div>
        </div>
      </div>
      <div className="px-3 py-2 space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-df-text-tertiary">ID</div>
        <div className="text-xs font-mono text-df-text-secondary bg-df-base/40 border border-df-node-border rounded px-2 py-1">
          {data.element.id}
        </div>
        {summary && (
          <div className="text-xs text-df-text-secondary leading-relaxed">{summary}</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-df-control-bg !border-df-control-border !w-3 !h-3"
      />
    </div>
  );
}
