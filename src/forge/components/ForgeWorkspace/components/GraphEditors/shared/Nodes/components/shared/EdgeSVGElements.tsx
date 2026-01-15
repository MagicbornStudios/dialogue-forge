// src/components/GraphEditors/shared/EdgeSVGElements.tsx
import React from 'react';

interface EdgePulseAnimationProps {
  path: string;
  color: string;
  visible: boolean;
}

/**
 * Animated circle that follows the edge path to indicate flow direction
 */
export function EdgePulseAnimation({ path, color, visible }: EdgePulseAnimationProps) {
  if (!visible) return null;

  return (
    <circle r="6" fill={color} opacity={0.9}>
      <animateMotion 
        dur="2s" 
        repeatCount="indefinite" 
        path={path}
      />
    </circle>
  );
}

interface LoopIndicatorProps {
  x: number;
  y: number;
  color: string;
  visible: boolean;
}

/**
 * Circular icon with ↺ symbol to indicate a back edge/loop
 */
export function LoopIndicator({ x, y, color, visible }: LoopIndicatorProps) {
  if (!visible) return null;

  return (
    <g transform={`translate(${x - 10}, ${y - 10})`}>
      <circle cx="10" cy="10" r="12" fill="var(--color-df-base)" stroke={color} strokeWidth="2" />
      <text x="10" y="14" textAnchor="middle" fontSize="12" fill={color}>↺</text>
    </g>
  );
}

interface LoopArrowMarkerProps {
  id: string;
  color: string;
  visible: boolean;
}

/**
 * Custom arrow marker for back edges/loops
 */
export function LoopArrowMarker({ id, color, visible }: LoopArrowMarkerProps) {
  if (!visible) return null;

  return (
    <defs>
      <marker
        id={id}
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
  );
}
