import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import type { VideoLayer } from '@/video/templates/types/video-layer';

interface ImageLayerProps {
  layer: VideoLayer;
  resolvedInputs?: Record<string, any>;
}

export function ImageLayer({ layer, resolvedInputs = {} }: ImageLayerProps) {
  const visual = layer.visual ?? {};
  const imageUrl = resolvedInputs.imageUrl ?? layer.inputs?.imageUrl;
  
  if (!imageUrl) {
    return null;
  }
  
  const x = visual.x ?? 0;
  const y = visual.y ?? 0;
  const width = visual.width ?? 400;
  const height = visual.height ?? 300;
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
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
