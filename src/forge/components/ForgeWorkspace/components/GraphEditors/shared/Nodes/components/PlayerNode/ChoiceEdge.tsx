import React, { useCallback, useMemo, useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import type { ForgeReactFlowNode } from '@/forge/types/forge-graph';
import { EdgePulseAnimation, LoopIndicator } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeSVGElements';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  } from '@/shared/ui/context-menu';
import { ForgeNodeType } from '@/forge/types/forge-graph';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';

interface ChoiceEdgeData {
  insertElementTypes?: Array<{ type: ForgeNodeType; label: string }>; // Data only, not callback
  isBackEdge?: boolean;
  choiceIndex?: number;
  isDimmed?: boolean;
  isInPathToSelected?: boolean;
  sourceNode?: ForgeReactFlowNode;
}

function getChoiceIndex(sourceHandle?: string | null, fallback?: number): number | null {
  if (sourceHandle?.startsWith('choice-')) {
    const idx = parseInt(sourceHandle.replace('choice-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  if (sourceHandle?.startsWith('block-')) {
    const idx = parseInt(sourceHandle.replace('block-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  if (typeof fallback === 'number' && Number.isFinite(fallback)) {
    return fallback;
  }
  return null;
}

export const ChoiceEdge = React.memo(function ChoiceEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
  ...props
}: EdgeProps) {
  // Access sourceHandle from props (may not be in EdgeProps type but exists at runtime)
  const sourceHandle = (props as any).sourceHandle ?? data?.sourceHandle;
  const [hovered, setHovered] = useState(false);
  
  const edgeData = data as ChoiceEdgeData | undefined;
  const isBackEdge = edgeData?.isBackEdge ?? false;
  const choiceIndex = useMemo(
    () => getChoiceIndex(sourceHandle, edgeData?.choiceIndex) ?? 0,
    [sourceHandle, edgeData?.choiceIndex],
  );
  const dataChoiceIndex = ((choiceIndex % 5) + 5) % 5;
  
  // Use smooth step path for angular look (like the horizontal example)
  // For back edges, use bezier for a more curved appearance
  const [edgePath, labelX, labelY] = useMemo(() => {
    if (isBackEdge) {
      return getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.5,
      });
    }
    return getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition || Position.Bottom,
      targetX,
      targetY,
      targetPosition: targetPosition || Position.Top,
      borderRadius: 8,
    });
  }, [isBackEdge, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);

  // Use loop color for back edges, otherwise use choice color
  const colorVar = isBackEdge ? 'var(--color-df-edge-loop)' : 'var(--edge-color)';
  const isSelected = selected || hovered;
  const isDimmed = edgeData?.isDimmed ?? false;
  
  // Make edge thicker and more opaque when hovered or selected
  // Dim edges not in path when highlighting is on
  const strokeWidth = isSelected ? 4 : 2;
  const opacity = isDimmed ? 0.15 : (isSelected ? 1 : 0.7);
  
  // Use dimmed color when dimmed
  const strokeColor = isDimmed ? 'var(--color-df-edge-dimmed)' : colorVar;
  
  // Add glow effect when hovered (only if not dimmed)
  const filter = hovered && !isDimmed ? `drop-shadow(0 0 4px ${colorVar})` : undefined;

  // For pulse animation
  const pulseColor = colorVar;
  const shouldAnimate = edgeData?.isInPathToSelected ?? false;
  
  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);
  const handleDeleteEdge = useCallback(() => actions.deleteEdge(id), [actions, id]);
  
  // Get insert node types from edge data
  const insertNodeTypes = edgeData?.insertElementTypes;
  const hasContextMenu = !!insertNodeTypes && insertNodeTypes.length > 0;
  const edgeStyle = useMemo<React.CSSProperties>(() => ({
    strokeWidth,
    opacity,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    pointerEvents: 'none',
    filter,
    // Dashed line for back edges
    strokeDasharray: isBackEdge ? '8 4' : undefined,
  }), [strokeWidth, opacity, filter, isBackEdge]);

  const edgeContent = (
    <>
      {/* Invisible wider path for easier clicking and hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer', pointerEvents: 'all' as React.CSSProperties['pointerEvents'] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <BaseEdge 
        id={id} 
        path={edgePath}
        style={edgeStyle}
        markerEnd={isDimmed ? undefined : `url(#react-flow__arrowclosed-choice-${choiceIndex})`}
      />
      {/* Loop indicator icon for back edges */}
      <LoopIndicator 
        x={labelX} 
        y={labelY} 
        color={strokeColor} 
        visible={isBackEdge} 
      />
      {/* Pulsing forward animation - only if edge is in path to selected node */}
      <EdgePulseAnimation 
        path={edgePath} 
        color={pulseColor} 
        visible={shouldAnimate} 
      />
      {/* Define marker for this choice color */}
      <defs>
        <marker
          id={`react-flow__arrowclosed-choice-${choiceIndex}`}
          markerWidth="12.5"
          markerHeight="12.5"
          viewBox="-10 -10 20 20"
          markerUnits="strokeWidth"
          orient="auto"
          refX="0"
          refY="0"
        >
          <polyline
            className="forge-choice-arrow"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="-5,-4 0,0 -5,4 -5,-4"
          />
        </marker>
      </defs>
    </>
  );

  if (!hasContextMenu) {
    return (
      <g
        data-choice-index={dataChoiceIndex}
        className={`forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}`}
      >
        {edgeContent}
      </g>
    );
  }

  // Calculate midpoint for insert operations
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <g
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          data-choice-index={dataChoiceIndex}
          className={`forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}`}
        >
          {edgeContent}
        </g>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {insertNodeTypes && insertNodeTypes.length > 0 && (
          <>
            {insertNodeTypes.map((item) => (
              <ContextMenuItem
                key={item.type}
                onSelect={() => actions.insertNodeOnEdge(id, item.type, midX, midY)}
              >
                Insert {item.label}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onSelect={handleDeleteEdge}
          className="text-destructive focus:text-destructive"
        >
          Delete edge
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

ChoiceEdge.displayName = 'ChoiceEdge';
