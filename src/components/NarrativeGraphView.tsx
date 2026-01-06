import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider } from 'reactflow';
import { convertNarrativeToReactFlow } from '../utils/narrative-converter';
import { type NarrativeStructure, type NarrativeEntityMeta } from '../types/narrative';
import { type LayoutDirection } from '../utils/layout';

interface NarrativeGraphViewProps {
  narrative: NarrativeStructure;
  layoutDirection?: LayoutDirection;
  height?: number;
  onSelectNode?: (meta: NarrativeEntityMeta) => void;
  className?: string;
}

export function NarrativeGraphView({
  narrative,
  layoutDirection = 'TB',
  height = 420,
  onSelectNode,
  className = '',
}: NarrativeGraphViewProps) {
  const { nodes, edges } = useMemo(() => convertNarrativeToReactFlow(narrative, layoutDirection), [narrative, layoutDirection]);

  return (
    <div className={`border border-df-border rounded-lg overflow-hidden bg-df-surface ${className}`} style={{ height }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => onSelectNode?.(node.data.meta)}
          className="bg-df-surface"
        >
          <MiniMap pannable zoomable className="!bg-df-muted" />
          <Controls showInteractive={false} />
          <Background gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

NarrativeGraphView.displayName = 'NarrativeGraphView';
