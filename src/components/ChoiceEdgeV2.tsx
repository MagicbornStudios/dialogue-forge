import React, { useState } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, getBezierPath, Position } from 'reactflow';
import { CHOICE_COLORS } from '../utils/reactflow-converter';

// Loop back edge color
const LOOP_COLOR = '#f59e0b'; // Amber/orange for visibility

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

  const choiceIndex = data?.choiceIndex ?? 0;
  const baseColor = CHOICE_COLORS[choiceIndex % CHOICE_COLORS.length];
  // Use orange for back edges, otherwise use choice color
  const color = isBackEdge ? LOOP_COLOR : baseColor;
  const isSelected = selected || hovered;
  const isDimmed = data?.isDimmed ?? false;
  
  // Make edge thicker and more opaque when hovered or selected
  // Dim edges not in path when highlighting is on
  const strokeWidth = isSelected ? 4 : 2;
  const opacity = isDimmed ? 0.15 : (isSelected ? 1 : 0.7);
  
  // Use grey color when dimmed
  const strokeColor = isDimmed ? '#3a3a4a' : color;
  
  // Add glow effect when hovered (only if not dimmed)
  const filter = hovered && !isDimmed ? `drop-shadow(0 0 4px ${color}80)` : undefined;

  // Create a brighter version of the color for the pulse
  const brightenColor = (hex: string, percent: number = 30): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + percent);
    const g = Math.min(255, ((num >> 8) & 0xff) + percent);
    const b = Math.min(255, (num & 0xff) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const pulseColor = brightenColor(color, 40);
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
          pointerEvents: 'none',
          filter,
          // Dashed line for back edges
          strokeDasharray: isBackEdge ? '8 4' : undefined,
        }}
        markerEnd={isDimmed ? undefined : `url(#react-flow__arrowclosed-${color.replace('#', '')})`}
      />
      {/* Loop indicator icon for back edges */}
      {isBackEdge && (
        <g transform={`translate(${labelX - 10}, ${labelY - 10})`}>
          <circle cx="10" cy="10" r="12" fill="#1a1a2e" stroke={color} strokeWidth="2" />
          <text x="10" y="14" textAnchor="middle" fontSize="12" fill={color}>↺</text>
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
      {/* Define marker for this color */}
      <defs>
        <marker
          id={`react-flow__arrowclosed-${color.replace('#', '')}`}
          markerWidth="12.5"
          markerHeight="12.5"
          viewBox="-10 -10 20 20"
          markerUnits="strokeWidth"
          orient="auto"
          refX="0"
          refY="0"
        >
          <polyline
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={color}
            points="-5,-4 0,0 -5,4 -5,-4"
          />
        </marker>
      </defs>
    </>
  );
}

