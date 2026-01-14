import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import type { ForgeReactFlowEdge, ForgeReactFlowNode, ForgeNodeType } from '@/src/types/forge/forge-graph';
import { edgeColorFor } from '../../utils/forge-edge-styles';
import { EdgePulseAnimation, LoopIndicator, LoopArrowMarker } from '../EdgeSVGElements';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../ui/context-menu';
import { useForgeEditorActions } from '../../hooks/useForgeEditorActions';

interface EdgeContextMenuData {
  insertElementTypes?: Array<{ type: ForgeNodeType; label: string }>; // Data only, not callback
  sourceNode?: ForgeReactFlowNode;
  sourceType?: string; // Legacy support for narrative elements
}

export function ForgeEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  
  const isBackEdge = data?.isBackEdge ?? false;
  const menuData = data as EdgeContextMenuData | undefined;
  const sourceNode = menuData?.sourceNode;
  
  // Get edge color using centralized function
  const edge = { sourceHandle: data?.sourceHandle } as ForgeReactFlowEdge;
  const baseColor = edgeColorFor(edge, sourceNode);
  
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
        : baseColor;
  
  const strokeWidth = isSelected || isInPath ? 4 : 3;
  const opacity = isDimmed ? 0.4 : (isSelected || isInPath ? 1 : 0.9);
  
  // Add glow effect when hovered or in path (only if not dimmed)
  const glowColor = isBackEdge ? 'var(--color-df-edge-loop)' : baseColor;
  const filter = (hovered || isInPath) && !isDimmed 
    ? `drop-shadow(0 0 8px ${glowColor})`
    : !isDimmed
    ? `drop-shadow(0 0 2px ${glowColor})`
    : undefined;

  // For pulse animation
  const pulseColor = isBackEdge ? 'var(--color-df-edge-loop)' : baseColor;
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
    return edgeContent;
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
