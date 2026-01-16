import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import type { ForgeReactFlowEdge, ForgeReactFlowNode, ForgeNodeType } from '@/forge/types/forge-graph';
import { edgeColorFor } from '@/forge/lib/utils/forge-edge-styles';
import { EdgePulseAnimation, LoopIndicator, LoopArrowMarker } from '../Nodes/components/shared/EdgeSVGElements';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { useForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';

interface EdgeContextMenuData {
  insertElementTypes?: Array<{ type: ForgeNodeType; label: string }>; // Data only, not callback
  sourceNode?: ForgeReactFlowNode;
  sourceType?: string; // Legacy support for narrative elements
}

function getChoiceIndex(sourceHandle?: string | null): number | null {
  if (!sourceHandle) return null;
  if (sourceHandle.startsWith('choice-')) {
    const idx = parseInt(sourceHandle.replace('choice-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  if (sourceHandle.startsWith('block-')) {
    const idx = parseInt(sourceHandle.replace('block-', ''), 10);
    return Number.isFinite(idx) ? idx : null;
  }
  return null;
}

export function ForgeEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  sourceHandle,
  selected,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  
  const isBackEdge = data?.isBackEdge ?? false;
  const menuData = data as EdgeContextMenuData | undefined;
  const sourceNode = menuData?.sourceNode;
  const choiceIndex = getChoiceIndex(sourceHandle ?? data?.sourceHandle ?? null);
  const dataChoiceIndex = choiceIndex !== null ? ((choiceIndex % 5) + 5) % 5 : null;
  const isChoiceHandle = dataChoiceIndex !== null;
  
  // Get edge color using centralized function
  const edge = { sourceHandle: sourceHandle ?? data?.sourceHandle } as ForgeReactFlowEdge;
  const baseColor = edgeColorFor(edge, sourceNode);
  const edgeColor = isChoiceHandle ? 'var(--edge-color)' : baseColor;
  
  // Use smooth step path for angular look (like the horizontal example)
  // For back edges, use bezier for a more curved appearance
  const [edgePath, labelX, labelY] = isBackEdge 
    ? getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.5,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition: sourcePosition || Position.Bottom,
        targetX,
        targetY,
        targetPosition: targetPosition || Position.Top,
        borderRadius: 8,
      });

  const isSelected = selected || hovered;
  const isDimmed = data?.isDimmed ?? false;
  const isInPath = data?.isInPathToSelected ?? false;
  
  // Determine stroke color - use vibrant green on hover/selected
  const strokeColor = isDimmed 
    ? 'var(--color-df-edge-dimmed)' 
    : (hovered || selected)
      ? 'var(--color-df-edge-default-hover)'
      : isBackEdge 
        ? 'var(--color-df-edge-loop)' 
        : edgeColor;
  
  const strokeWidth = isSelected || isInPath ? 4 : 3;
  const opacity = isDimmed ? 0.4 : (isSelected || isInPath ? 1 : 0.9);
  
  // Add glow effect when hovered or in path (only if not dimmed)
  const glowColor = isBackEdge ? 'var(--color-df-edge-loop)' : edgeColor;
  const filter = (hovered || isInPath) && !isDimmed 
    ? `drop-shadow(0 0 8px ${glowColor})`
    : !isDimmed
    ? `drop-shadow(0 0 2px ${glowColor})`
    : undefined;

  // For pulse animation
  const pulseColor = isBackEdge ? 'var(--color-df-edge-loop)' : edgeColor;
  const shouldAnimate = isInPath;
  
  // Loop arrow color
  const loopArrowColor = 'var(--color-df-edge-loop)';

  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
  
  const insertElementTypes = menuData?.insertElementTypes;
  const hasContextMenu = !!insertElementTypes && insertElementTypes.length > 0;

  const edgeContent = (
    <>
      {/* Invisible wider path for easier clicking and hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge 
        id={id} 
        path={edgePath}
        className="forge-edge-path"
        style={{ 
          stroke: strokeColor, 
          strokeWidth, 
          opacity,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          filter,
          // Dashed line for back edges
          strokeDasharray: isBackEdge ? '8 4' : undefined,
        }}
        markerEnd={isBackEdge ? `url(#loop-arrow-${id})` : 'url(#react-flow__arrowclosed)'}
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
      {/* Define marker for back edge */}
      <LoopArrowMarker 
        id={`loop-arrow-${id}`} 
        color={loopArrowColor} 
        visible={isBackEdge} 
      />
    </>
  );

  if (!hasContextMenu) {
    return (
      <g
        data-choice-index={dataChoiceIndex ?? undefined}
        className={isChoiceHandle ? `forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}` : undefined}
      >
        {edgeContent}
      </g>
    );
  }

  // Calculate midpoint for insert operations (if needed)
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
          data-choice-index={dataChoiceIndex ?? undefined}
          className={isChoiceHandle ? `forge-choice-edge${isDimmed ? ' is-dimmed' : ''}${isBackEdge ? ' is-loop' : ''}` : undefined}
        >
          {edgeContent}
        </g>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {insertElementTypes && insertElementTypes.length > 0 && (
          <>
            {insertElementTypes.map(({ type, label }) => (
              <ContextMenuItem
                key={type}
                onSelect={() => actions.insertNodeOnEdge(id, type, midX, midY)}
              >
                Insert {label}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onSelect={() => actions.deleteEdge(id)}
          className="text-destructive focus:text-destructive"
        >
          Delete edge
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
