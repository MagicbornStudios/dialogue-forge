import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import { NARRATIVE_ELEMENT } from '../../../../../types/narrative';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../../ui/context-menu';

// Edge colors based on source type for narrative graph
const EDGE_COLORS_BY_SOURCE_TYPE: Record<string, string> = {
  [NARRATIVE_ELEMENT.THREAD]: '#8B5CF6', // purple
  [NARRATIVE_ELEMENT.ACT]: '#3B82F6',    // blue
  [NARRATIVE_ELEMENT.CHAPTER]: '#10B981', // green
  [NARRATIVE_ELEMENT.PAGE]: '#F59E0B',    // amber
};

interface EdgeContextMenuData {
  onInsertElement?: (type: any, edgeId: string, x: number, y: number) => void;
  onDelete?: (edgeId: string) => void;
  insertElementTypes?: Array<{ type: string; label: string }>;
}

export function NPCEdgeV2({
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
  const sourceType = data?.sourceType as string | undefined;
  const menuData = data as EdgeContextMenuData | undefined;
  
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
  
  // Get color based on source type (for narrative graph) or fall back to default
  const typeColor = sourceType ? EDGE_COLORS_BY_SOURCE_TYPE[sourceType] : undefined;
  
  // Use CSS variables for colors, with type-specific override
  const getStrokeColor = () => {
    if (isDimmed) return 'var(--color-df-edge-dimmed)';
    if (isBackEdge) return 'var(--color-df-edge-loop)';
    if (typeColor) {
      // Use brighter version when selected or in path
      return isSelected || isInPath ? typeColor : typeColor;
    }
    return isSelected ? 'var(--color-df-edge-default-hover)' : 'var(--color-df-edge-default)';
  };
  
  const strokeColor = getStrokeColor();
  const strokeWidth = isSelected || isInPath ? 4 : 2;
  const opacity = isDimmed ? 0.2 : (isSelected || isInPath ? 1 : 0.7);
  
  // Add glow effect when hovered or in path (only if not dimmed)
  const glowColor = typeColor || 'var(--color-df-edge-default-hover)';
  const filter = (hovered || isInPath) && !isDimmed 
    ? `drop-shadow(0 0 6px ${glowColor})`
    : undefined;

  // For pulse animation, use type color if available
  const pulseColor = isBackEdge 
    ? 'var(--color-df-edge-loop)' 
    : (typeColor || (isSelected ? 'var(--color-df-edge-default-hover)' : 'var(--color-df-edge-default)'));
  const shouldAnimate = isInPath;

  const hasContextMenu = menuData?.onInsertElement || menuData?.onDelete;

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
      {/* Define marker for back edge */}
      {isBackEdge && (
        <defs>
          <marker
            id={`loop-arrow-${id}`}
            markerWidth="12.5"
            markerHeight="12.5"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto"
            refX="0"
            refY="0"
          >
            <polyline
              stroke="var(--color-df-edge-loop)"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="var(--color-df-edge-loop)"
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        </defs>
      )}
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
        {menuData?.insertElementTypes && menuData.insertElementTypes.length > 0 && (
          <>
            {menuData.insertElementTypes.map(({ type, label }) => (
              <ContextMenuItem
                key={type}
                onSelect={() => menuData.onInsertElement?.(type, id, midX, midY)}
              >
                Insert {label}
              </ContextMenuItem>
            ))}
            {menuData.onDelete && <ContextMenuSeparator />}
          </>
        )}
        {menuData.onDelete && (
          <ContextMenuItem
            onSelect={() => menuData.onDelete?.(id)}
            className="text-destructive focus:text-destructive"
          >
            Delete edge
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

