import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { VideoLayer } from '@magicborn/video/templates/types/video-layer';

interface CircleLayerProps {
  layer: VideoLayer;
  resolvedInputs?: Record<string, any>;
}

export function CircleLayer({ layer, resolvedInputs = {} }: CircleLayerProps) {
  const visual = layer.visual ?? {};
  const style = layer.style ?? {};
  
  const x = visual.x ?? 0;
  const y = visual.y ?? 0;
  const width = visual.width ?? 200;
  const height = visual.height ?? 200;
  const rotation = visual.rotation ?? 0;
  const anchorX = visual.anchorX ?? 0.5;
  const anchorY = visual.anchorY ?? 0.5;
  
  // Calculate position accounting for anchor
  const displayX = x - (width * anchorX);
  const displayY = y - (height * anchorY);
  
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: displayX,
          top: displayY,
          width,
          height,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${anchorX * 100}% ${anchorY * 100}%`,
          opacity: layer.opacity ?? 1,
          backgroundColor: style.backgroundColor ?? '#3b82f6',
          borderColor: style.borderColor,
          borderWidth: style.borderWidth ? `${style.borderWidth}px` : undefined,
          borderStyle: style.borderWidth ? 'solid' : undefined,
          borderRadius: '50%', // Circle
        }}
      />
    </AbsoluteFill>
  );
}
