import React, { useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { NARRATIVE_ELEMENT, type NarrativeElement, type StoryThread } from '../../types/narrative';
import { convertNarrativeToReactFlow } from '../../utils/narrative-converter';
import { NPCEdgeV2 } from '../DialogueGraphEditor/components/NPCNode/NPCEdgeV2';
import { NarrativeElementNode } from './components/NarrativeElementNode';
import { GraphMiniMap } from '../EditorComponents/GraphMiniMap';
import { GraphLeftToolbar } from '../EditorComponents/GraphLeftToolbar';
import { GraphLayoutControls } from '../EditorComponents/GraphLayoutControls';
import { useReactFlowBehaviors } from '../EditorComponents/hooks/useReactFlowBehaviors';

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

function NarrativeGraphEditorInternal({
  thread,
  className = '',
  showMiniMap = true,
  onSelectElement,
  onToggleMiniMap,
  onPaneContextMenu,
  onPaneClick,
}: NarrativeGraphEditorProps) {
  const { nodes, edges } = useMemo(() => convertNarrativeToReactFlow(thread), [thread]);
  const { reactFlowWrapperRef } = useReactFlowBehaviors();
  const [layoutDirection, setLayoutDirection] = React.useState<'TB' | 'LR'>('TB');
  const [autoOrganize, setAutoOrganize] = React.useState(false);
  const [showPathHighlight, setShowPathHighlight] = React.useState(false);
  const [showBackEdges, setShowBackEdges] = React.useState(false);

  return (
    <div className={`h-full w-full rounded-xl border border-[#1a1a2e] bg-[#0b0b14] ${className}`} ref={reactFlowWrapperRef}>
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
        <GraphMiniMap showMiniMap={showMiniMap} />
        {onToggleMiniMap && (
          <GraphLeftToolbar
            layoutStrategy="dagre"
            showMiniMap={showMiniMap}
            onToggleMiniMap={onToggleMiniMap}
          />
        )}
        <GraphLayoutControls
          autoOrganize={autoOrganize}
          onToggleAutoOrganize={() => setAutoOrganize(!autoOrganize)}
          layoutDirection={layoutDirection}
          onLayoutDirectionChange={setLayoutDirection}
          onApplyLayout={() => {}}
          showPathHighlight={showPathHighlight}
          onTogglePathHighlight={() => setShowPathHighlight(!showPathHighlight)}
          showBackEdges={showBackEdges}
          onToggleBackEdges={() => setShowBackEdges(!showBackEdges)}
        />
        <Controls className="bg-[#0f0f1a] border border-[#1f1f2e]" />
      </ReactFlow>
    </div>
  );
}

export function NarrativeGraphEditor(props: NarrativeGraphEditorProps) {
  return (
    <ReactFlowProvider>
      <NarrativeGraphEditorInternal {...props} />
    </ReactFlowProvider>
  );
}
