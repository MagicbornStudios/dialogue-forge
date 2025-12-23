import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';

// Loop back edge color
const LOOP_COLOR = '#f59e0b'; // Amber/orange for visibility

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
  
  // Use orange for back edges, otherwise use grey
  const baseColor = isSelected ? '#8a8aaa' : '#4a4a6a';
  // When dimmed, use a darker grey
  const strokeColor = isDimmed ? '#2a2a3a' : (isBackEdge ? LOOP_COLOR : baseColor);
  const strokeWidth = isSelected ? 4 : 2;
  const opacity = isDimmed ? 0.2 : (isSelected ? 1 : 0.6);
  
  // Add glow effect when hovered (only if not dimmed)
  const filter = hovered && !isDimmed
    ? isBackEdge 
      ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))' 
      : 'drop-shadow(0 0 4px rgba(138, 138, 170, 0.8))' 
    : undefined;

  // Create a brighter version of the color for the pulse
  const brightenColor = (hex: string, percent: number = 40): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + percent);
    const g = Math.min(255, ((num >> 8) & 0xff) + percent);
    const b = Math.min(255, (num & 0xff) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const pulseColor = brightenColor(strokeColor, 50);
  const shouldAnimate = data?.isInPathToSelected ?? false;

  return (
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
          <circle cx="10" cy="10" r="12" fill="#1a1a2e" stroke={strokeColor} strokeWidth="2" />
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
              stroke={LOOP_COLOR}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={LOOP_COLOR}
              points="-5,-4 0,0 -5,4 -5,-4"
            />
          </marker>
        </defs>
      )}
    </>
  );
}

