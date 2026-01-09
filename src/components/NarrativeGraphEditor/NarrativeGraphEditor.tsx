import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NARRATIVE_ELEMENT, type NarrativeElement, type StoryThread } from '../../types/narrative';
import { convertNarrativeToReactFlow } from '../../utils/narrative-converter';
import { NPCEdgeV2 } from '../DialogueGraphEditor/components/NPCEdgeV2';
import { NarrativeElementNode } from './components/NarrativeElementNode';
import { MiniMapToggle } from './components/MiniMapToggle';

interface NarrativeGraphEditorProps {
  thread: StoryThread;
  className?: string;
  showMiniMap?: boolean;
  onSelectElement?: (element: NarrativeElement, id: string) => void;
  onToggleMiniMap?: () => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneClick?: () => void;
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
}: NarrativeGraphEditorProps) {
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
          <MiniMapToggle showMiniMap={showMiniMap} onToggle={onToggleMiniMap} />
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
