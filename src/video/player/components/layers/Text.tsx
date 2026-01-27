import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { VideoLayer } from '@/video/templates/types/video-layer';

interface TextLayerProps {
  layer: VideoLayer;
  resolvedInputs?: Record<string, any>;
}

export function TextLayer({ layer, resolvedInputs = {} }: TextLayerProps) {
  const visual = layer.visual ?? {};
  const style = layer.style ?? {};
  const content = resolvedInputs.content ?? layer.inputs?.content ?? '';
  
  const x = visual.x ?? 0;
  const y = visual.y ?? 0;
  const width = visual.width ?? 400;
  const height = visual.height ?? 100;
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: style.textAlign === 'left' ? 'flex-start' : style.textAlign === 'right' ? 'flex-end' : 'center',
          padding: '0 8px',
        }}
      >
        <div
          style={{
            fontFamily: style.fontFamily ?? 'system-ui',
            fontSize: style.fontSize ?? 32,
            fontWeight: style.fontWeight ?? 'bold',
            color: style.color ?? '#ffffff',
            textAlign: style.textAlign ?? 'center',
            lineHeight: style.lineHeight ?? 1.2,
            letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
            width: '100%',
            wordWrap: 'break-word',
          }}
        >
          {content}
        </div>
      </div>
    </AbsoluteFill>
  );
}
