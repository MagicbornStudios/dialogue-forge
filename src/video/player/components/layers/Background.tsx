import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { VideoLayer } from '@/video/templates/types/video-layer';

interface BackgroundLayerProps {
  layer: VideoLayer;
  resolvedInputs?: Record<string, any>;
}

export function BackgroundLayer({ layer, resolvedInputs = {} }: BackgroundLayerProps) {
  const style = layer.style ?? {};
  const backgroundImage = resolvedInputs.backgroundImage ?? layer.inputs?.backgroundImage;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor ?? '#000000',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: layer.opacity ?? 1,
      }}
    />
  );
}
