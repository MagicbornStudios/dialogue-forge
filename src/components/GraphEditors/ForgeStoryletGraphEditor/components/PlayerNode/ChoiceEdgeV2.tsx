import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import type { ForgeReactFlowEdge, ForgeReactFlowNode } from '@/src/types/forge/forge-graph';
import { edgeColorFor } from '../../../utils/forge-edge-styles';
import { EdgePulseAnimation, LoopIndicator } from '../../../shared/EdgeSVGElements';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../../ui/context-menu';
import { ForgeNodeType } from '@/src/types/forge/forge-graph';
import { useForgeEditorActions } from '../../../hooks/useForgeEditorActions';

interface ChoiceEdgeData {
  insertElementTypes?: Array<{ type: ForgeNodeType; label: string }>; // Data only, not callback
  isBackEdge?: boolean;
  choiceIndex?: number;
  isDimmed?: boolean;
  isInPathToSelected?: boolean;
  sourceNode?: ForgeReactFlowNode;
}

export function ChoiceEdgeV2({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  
  const edgeData = data as ChoiceEdgeData | undefined;
  const isBackEdge = edgeData?.isBackEdge ?? false;
  const sourceNode = edgeData?.sourceNode;
  
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

  // Get edge color using centralized function
  // The edgeColorFor function will use the sourceHandle (choice-X) to get the right color
  const edge = { 
    sourceHandle: `choice-${edgeData?.choiceIndex ?? 0}`,
    id,
  } as ForgeReactFlowEdge;
  const baseColor = edgeColorFor(edge, sourceNode);
  
  // Use loop color for back edges, otherwise use choice color
  const colorVar = isBackEdge ? 'var(--color-df-edge-loop)' : baseColor;
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
  
  const choiceIndex = edgeData?.choiceIndex ?? 0;
  
  // Use actions instead of callbacks
  const actions = useForgeEditorActions();
  
  // Get insert node types from edge data
  const insertNodeTypes = edgeData?.insertElementTypes;
  const hasContextMenu = !!insertNodeTypes && insertNodeTypes.length > 0;

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
          pointerEvents: 'none',
          filter,
          // Dashed line for back edges
          strokeDasharray: isBackEdge ? '8 4' : undefined,
        }}
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
            stroke={colorVar}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={colorVar}
            points="-5,-4 0,0 -5,4 -5,-4"
          />
        </marker>
      </defs>
    </>
  );

  if (!hasContextMenu) {
    return edgeContent;
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
          onSelect={() => actions.deleteEdge(id)}
          className="text-destructive focus:text-destructive"
        >
          Delete edge
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

