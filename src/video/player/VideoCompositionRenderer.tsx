import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoComposition, VideoCompositionLayer, VideoCompositionScene } from '@/video/templates/types/video-composition';
import { LAYER_COMPONENT_MAP } from './components/layers';
import type { VideoLayer } from '@/video/templates/types/video-layer';

interface VideoCompositionRendererProps {
  composition: VideoComposition;
}

type TimelineLayer = {
  scene: VideoCompositionScene;
  layer: VideoCompositionLayer;
  sceneIndex: number;
  layerIndex: number;
};

const msToFrameOffset = (ms: number, fps: number) => Math.max(0, Math.round((ms / 1000) * fps));
const msToDurationFrames = (ms: number, fps: number) => Math.max(1, Math.round((ms / 1000) * fps));

const formatResolvedInputs = (inputs?: Record<string, unknown>) => {
  if (!inputs) {
    return 'No inputs';
  }

  const entries = Object.entries(inputs);
  if (entries.length === 0) {
    return 'No inputs';
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
};

export function VideoCompositionRenderer({ composition }: VideoCompositionRendererProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  const timelineLayers = useMemo(
    () =>
      composition.scenes.flatMap((scene, sceneIndex) =>
        scene.layers.map((layer, layerIndex) => ({
          scene,
          layer,
          sceneIndex,
          layerIndex,
        })),
      ),
    [composition.scenes],
  );

  const activeScene = composition.scenes.find(
    (scene) => timeMs >= scene.startMs && timeMs < scene.startMs + scene.durationMs,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {timelineLayers.map(({ scene, layer, sceneIndex, layerIndex }) => {
        const startFrame = msToFrameOffset(layer.startMs, fps);
        const durationFrames = msToDurationFrames(layer.endMs - layer.startMs, fps);
        
        // Get the component for this layer kind
        const LayerComponent = LAYER_COMPONENT_MAP[layer.component as keyof typeof LAYER_COMPONENT_MAP];
        
        if (!LayerComponent) {
          console.warn('Unknown layer component:', layer.component);
          return null;
        }
        
        // Convert VideoCompositionLayer to VideoLayer for rendering
        // TODO: Enhance VideoCompositionLayer to include visual/style during compilation
        const videoLayer: VideoLayer = {
          id: layer.id,
          name: layer.id,
          kind: layer.component as any,
          startMs: layer.startMs,
          durationMs: layer.endMs - layer.startMs,
          opacity: layer.opacity ?? 1,
          visual: {
            x: 960,
            y: 540,
            width: 800,
            height: 200,
            rotation: 0,
            scale: 1,
            anchorX: 0.5,
            anchorY: 0.5,
          },
          style: {
            fontSize: 48,
            fontFamily: 'system-ui',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            backgroundColor: (layer.kind === 'rectangle' || layer.kind === 'circle') ? '#3b82f6' : 'transparent',
          },
          inputs: layer.resolvedInputs as any,
        };

        return (
          <Sequence
            key={layer.id}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <LayerComponent 
              layer={videoLayer}
              resolvedInputs={layer.resolvedInputs}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
