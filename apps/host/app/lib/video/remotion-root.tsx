import React from 'react';
import { Composition } from 'remotion';

import { VideoCompositionRenderer } from '@magicborn/video/player/VideoCompositionRenderer';
import {
  VIDEO_RENDER_FORMAT,
  type VideoRenderInputProps,
  type VideoRenderSettingsDTO,
} from './types';
import { mapDTOToVideoComposition } from './map-composition';

export const REMOTION_COMPOSITION_ID = 'VideoComposition';

const DEFAULT_SETTINGS: VideoRenderSettingsDTO = {
  fps: 30,
  width: 1920,
  height: 1080,
  format: VIDEO_RENDER_FORMAT.MP4,
};

const DEFAULT_PROPS: VideoRenderInputProps = {
  composition: {
    id: 'default',
    templateId: 'default',
    width: DEFAULT_SETTINGS.width,
    height: DEFAULT_SETTINGS.height,
    frameRate: DEFAULT_SETTINGS.fps,
    durationMs: 1000,
    scenes: [],
  },
  settings: DEFAULT_SETTINGS,
};

const msToFrames = (durationMs: number, fps: number) => Math.max(1, Math.ceil((durationMs / 1000) * fps));

const resolveSettings = (settings: VideoRenderSettingsDTO, composition: VideoRenderInputProps['composition']) => ({
  fps: settings?.fps ?? composition.frameRate,
  width: settings?.width ?? composition.width,
  height: settings?.height ?? composition.height,
});

export function RemotionVideoComposition(props: Record<string, unknown>) {
  const { composition } = props as unknown as VideoRenderInputProps;
  // Convert DTO to full VideoComposition (adds missing kind/component fields)
  const fullComposition = mapDTOToVideoComposition(composition);
  return <VideoCompositionRenderer composition={fullComposition} />;
}

export function RemotionRoot() {
  return (
    <Composition
      id={REMOTION_COMPOSITION_ID}
      component={RemotionVideoComposition}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => {
        const typedProps = props as unknown as VideoRenderInputProps;
        const { fps, width, height } = resolveSettings(typedProps.settings, typedProps.composition);
        return {
          fps,
          width,
          height,
          durationInFrames: msToFrames(typedProps.composition.durationMs, fps),
        };
      }}
    />
  );
}
