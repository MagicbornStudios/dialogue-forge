'use client';

import React from 'react';
// ElementRenderer components for visual canvas (non-Remotion version)
// TODO: Integrate with Remotion system when needed
import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoComposition } from '@/video/templates/types/video-composition';

interface ElementRendererProps {
  layer: VideoLayer;
  frame?: number;
}

// Text Element Renderer
export function TextElement({ layer, frame }: ElementRendererProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.visual?.x || 0,
        top: layer.visual?.y || 0,
        width: layer.visual?.width || 200,
        height: layer.visual?.height || 50,
        transform: `rotate(${layer.visual?.rotation || 0}deg) scale(${layer.visual?.scale || 1})`,
        transformOrigin: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: layer.style?.textAlign || 'center',
        fontFamily: layer.style?.fontFamily || 'system-ui',
        fontSize: `${layer.style?.fontSize || 16}px`,
        fontWeight: layer.style?.fontWeight || 'normal',
        color: layer.style?.color || '#000000',
        backgroundColor: layer.style?.backgroundColor || 'transparent',
        padding: '8px',
        borderRadius: `${layer.style?.borderRadius || 0}px`,
        border: layer.style?.borderWidth ? `${layer.style?.borderWidth}px solid ${layer.style?.borderColor || '#000000'}` : 'none',
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
      }}
    >
      {layer.inputs?.content || 'Text Element'}
    </div>
  );
}

// Rectangle Element Renderer
export function RectangleElement({ layer, frame }: ElementRendererProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.visual?.x || 0,
        top: layer.visual?.y || 0,
        width: layer.visual?.width || 200,
        height: layer.visual?.height || 150,
        transform: `rotate(${layer.visual?.rotation || 0}deg) scale(${layer.visual?.scale || 1})`,
        transformOrigin: 'center',
        backgroundColor: layer.style?.backgroundColor || '#3b82f6',
        borderRadius: `${layer.style?.borderRadius || 0}px`,
        border: layer.style?.borderWidth ? `${layer.style?.borderWidth}px solid ${layer.style?.borderColor || '#000000'}` : 'none',
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
      }}
    />
  );
}

// Circle Element Renderer
export function CircleElement({ layer, frame }: ElementRendererProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.visual?.x || 0,
        top: layer.visual?.y || 0,
        width: layer.visual?.width || 150,
        height: layer.visual?.height || 150,
        transform: `rotate(${layer.visual?.rotation || 0}deg) scale(${layer.visual?.scale || 1})`,
        transformOrigin: 'center',
        backgroundColor: layer.style?.backgroundColor || '#10b981',
        borderRadius: '50%',
        border: layer.style?.borderWidth ? `${layer.style?.borderWidth}px solid ${layer.style?.borderColor || '#000000'}` : 'none',
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
      }}
    />
  );
}

// Image Element Renderer
export function ImageElement({ layer, frame }: ElementRendererProps) {
  return (
    <img
      src={layer.inputs?.content || 'https://via.placeholder.com/200x150/3b82f6/ffffff?text=Image'}
      alt="Image element"
      style={{
        position: 'absolute',
        left: layer.visual?.x || 0,
        top: layer.visual?.y || 0,
        width: layer.visual?.width || 200,
        height: layer.visual?.height || 150,
        transform: `rotate(${layer.visual?.rotation || 0}deg) scale(${layer.visual?.scale || 1})`,
        transformOrigin: 'center',
        objectFit: 'cover',
        borderRadius: `${layer.style?.borderRadius || 0}px`,
        border: layer.style?.borderWidth ? `${layer.style?.borderWidth}px solid ${layer.style?.borderColor || '#000000'}` : 'none',
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
      }}
    />
  );
}

// Video Element Renderer
export function VideoElement({ layer, frame }: ElementRendererProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.visual?.x || 0,
        top: layer.visual?.y || 0,
        width: layer.visual?.width || 300,
        height: layer.visual?.height || 225,
        transform: `rotate(${layer.visual?.rotation || 0}deg) scale(${layer.visual?.scale || 1})`,
        transformOrigin: 'center',
        backgroundColor: '#000000',
        borderRadius: `${layer.style?.borderRadius || 0}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '14px',
        opacity: layer.opacity !== undefined ? layer.opacity : 1,
      }}
    >
      📹 Video
    </div>
  );
}

// Main element renderer that switches based on layer kind
export function ElementRenderer({ layer, frame }: ElementRendererProps) {
  switch (layer.kind) {
    case 'text':
      return <TextElement layer={layer} frame={frame} />;
    case 'rectangle':
      return <RectangleElement layer={layer} frame={frame} />;
    case 'circle':
      return <CircleElement layer={layer} frame={frame} />;
    case 'image':
      return <ImageElement layer={layer} frame={frame} />;
    case 'video':
      return <VideoElement layer={layer} frame={frame} />;
    default:
      return (
        <div
          style={{
            position: 'absolute',
            left: layer.visual?.x || 0,
            top: layer.visual?.y || 0,
            width: layer.visual?.width || 200,
            height: layer.visual?.height || 150,
            backgroundColor: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '12px',
            opacity: layer.opacity !== undefined ? layer.opacity : 1,
          }}
        >
          {layer.kind}
        </div>
      );
  }
}