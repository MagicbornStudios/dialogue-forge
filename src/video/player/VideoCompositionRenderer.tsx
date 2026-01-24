import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoComposition, VideoCompositionLayer, VideoCompositionScene } from '@/video/templates/types/video-composition';

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
    <AbsoluteFill style={{ backgroundColor: '#0b0b16', color: '#f5f5ff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0a0c0' }}>
          <span>Template: {composition.templateId}</span>
          <span>
            Frame {frame} · {Math.floor(timeMs)}ms
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Active Scene: {activeScene?.templateSceneId ?? 'None'}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {timelineLayers.map(({ scene, layer, sceneIndex, layerIndex }) => {
            const startFrame = msToFrameOffset(layer.startMs, fps);
            const durationFrames = msToDurationFrames(layer.endMs - layer.startMs, fps);
            const hue = (sceneIndex * 60 + layerIndex * 35) % 360;
            const background = `hsla(${hue}, 70%, 30%, 0.35)`;
            const border = `hsla(${hue}, 70%, 55%, 0.8)`;

            return (
              <Sequence
                key={layer.id}
                from={startFrame}
                durationInFrames={durationFrames}
              >
                <div
                  style={{
                    border: `1px solid ${border}`,
                    background,
                    borderRadius: 16,
                    padding: 12,
                    opacity: layer.opacity ?? 1,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d1d1f1' }}>
                    Scene {scene.templateSceneId}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{layer.id}</div>
                  <div style={{ fontSize: 12, color: '#c6c6e0' }}>{formatResolvedInputs(layer.resolvedInputs)}</div>
                </div>
              </Sequence>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
