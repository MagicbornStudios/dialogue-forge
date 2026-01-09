import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Panel,
  Position,
  type NodeProps,
} from 'reactflow';
import { BookOpen, Files, Layers, ScrollText, Map } from 'lucide-react';
import 'reactflow/dist/style.css';

import { NARRATIVE_ELEMENT, type NarrativeElement, type StoryThread } from '../types/narrative';
import {
  convertNarrativeToReactFlow,
  type NarrativeFlowNodeData,
} from '../utils/narrative-converter';
import { NPCEdgeV2 } from './NPCEdgeV2';

interface NarrativeGraphEditorProps {
  thread: StoryThread;
  className?: string;
  showMiniMap?: boolean;
  onSelectElement?: (element: NarrativeElement, id: string) => void;
  onToggleMiniMap?: () => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneClick?: () => void;
}

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

function NarrativeElementNode({ data, selected }: NodeProps<NarrativeFlowNodeData>) {
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

const nodeTypes = {
  [NARRATIVE_ELEMENT.THREAD]: NarrativeElementNode,
  [NARRATIVE_ELEMENT.ACT]: NarrativeElementNode,
  [NARRATIVE_ELEMENT.CHAPTER]: NarrativeElementNode,
  [NARRATIVE_ELEMENT.PAGE]: NarrativeElementNode,
  [NARRATIVE_ELEMENT.STORYLET]: NarrativeElementNode,
};

const edgeTypes = {
  default: NPCEdgeV2,
};

export function NarrativeGraphEditor({
  thread,
  className = '',
  showMiniMap = true,
  onSelectElement,
  onToggleMiniMap,
  onPaneContextMenu,
  onPaneClick,
}: NarrativeGraphViewProps) {
  const { nodes, edges } = useMemo(() => convertNarrativeToReactFlow(thread), [thread]);

  return (
    <div className={`h-full w-full rounded-xl border border-[#1a1a2e] bg-[#0b0b14] ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-df-canvas-bg"
        minZoom={0.1}
        maxZoom={1.5}
        onNodeClick={(_, node) => {
          const elementType = node.type as NarrativeElement | undefined;
          if (elementType) {
            onSelectElement?.(elementType, node.id);
          }
        }}
        onPaneContextMenu={event => onPaneContextMenu?.(event)}
        onPaneClick={() => onPaneClick?.()}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        {onToggleMiniMap && (
          <Panel position="top-left" className="!p-0 !m-2">
            <button
              type="button"
              onClick={onToggleMiniMap}
              className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
              title={showMiniMap ? 'Hide minimap' : 'Show minimap'}
            >
              <Map size={14} />
            </button>
          </Panel>
        )}
        {showMiniMap && (
          <MiniMap
            nodeColor={node => {
              if (node.type === NARRATIVE_ELEMENT.ACT) return 'var(--color-df-player-border)';
              if (node.type === NARRATIVE_ELEMENT.CHAPTER) return 'var(--color-df-conditional-border)';
              if (node.type === NARRATIVE_ELEMENT.PAGE) return 'var(--color-df-node-border)';
              return 'var(--color-df-npc-border)';
            }}
            maskColor="rgba(11, 11, 20, 0.8)"
            className="border border-df-node-border"
          />
        )}
        <Controls className="bg-[#0f0f1a] border border-[#1f1f2e]" />
      </ReactFlow>
    </div>
  );
}
