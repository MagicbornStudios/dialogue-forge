import React from 'react';
import { AbsoluteFill, Video as RemotionVideo } from 'remotion';
import type { VideoLayer } from '@/video/templates/types/video-layer';

interface VideoLayerProps {
  layer: VideoLayer;
  resolvedInputs?: Record<string, any>;
}

export function VideoLayer({ layer, resolvedInputs = {} }: VideoLayerProps) {
  const visual = layer.visual ?? {};
  const videoUrl = resolvedInputs.videoUrl ?? layer.inputs?.videoUrl;
  
  if (!videoUrl) {
    return null;
  }
  
  const x = visual.x ?? 0;
  const y = visual.y ?? 0;
  const width = visual.width ?? 640;
  const height = visual.height ?? 360;
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
        <RemotionVideo
          src={videoUrl}
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
