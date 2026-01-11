import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../ui/context-menu';
import { NODE_TYPE } from '../../../../types/constants';
import type { NodeType } from '../../../../types/constants';

interface ChoiceEdgeData {
  onInsertNode?: (type: NodeType, edgeId: string, x: number, y: number) => void;
  onDelete?: (edgeId: string) => void;
  insertNodeTypes?: Array<{ type: NodeType; label: string }>;
  isBackEdge?: boolean;
  choiceIndex?: number;
  isDimmed?: boolean;
  isInPathToSelected?: boolean;
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

  const choiceIndex = edgeData?.choiceIndex ?? 0;
  // Map choice index to CSS variable
  const choiceColorVar = `var(--color-df-edge-choice-${Math.min(choiceIndex % 5, 4) + 1})`;
  // Use loop color for back edges, otherwise use choice color
  const colorVar = isBackEdge ? 'var(--color-df-edge-loop)' : choiceColorVar;
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

  // For pulse animation, we'll use a slightly brighter version
  // Since we can't easily brighten CSS variables, we'll use the same color with higher opacity
  const pulseColor = colorVar;
  const shouldAnimate = edgeData?.isInPathToSelected ?? false;

  const hasContextMenu = edgeData?.onInsertNode || edgeData?.onDelete;

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
      {isBackEdge && (
        <g transform={`translate(${labelX - 10}, ${labelY - 10})`}>
          <circle cx="10" cy="10" r="12" fill="var(--color-df-base)" stroke={strokeColor} strokeWidth="2" />
          <text x="10" y="14" textAnchor="middle" fontSize="12" fill={strokeColor}>↺</text>
        </g>
      )}
      {/* Pulsing forward animation - only if edge is in path to selected node */}
      {shouldAnimate && (
        <circle r="6" fill={pulseColor} opacity={0.9}>
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite" 
            path={edgePath}
          />
        </circle>
      )}
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
        {edgeData?.insertNodeTypes && edgeData.insertNodeTypes.length > 0 && (
          <>
            {edgeData.insertNodeTypes.map(({ type, label }) => (
              <ContextMenuItem
                key={type}
                onSelect={() => edgeData.onInsertNode?.(type, id, midX, midY)}
              >
                Insert {label}
              </ContextMenuItem>
            ))}
            {edgeData.onDelete && <ContextMenuSeparator />}
          </>
        )}
        {edgeData.onDelete && (
          <ContextMenuItem
            onSelect={() => edgeData.onDelete?.(id)}
            className="text-destructive focus:text-destructive"
          >
            Delete edge
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

