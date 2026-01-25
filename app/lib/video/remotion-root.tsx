import React from 'react';
import { Composition } from 'remotion';

import { VideoCompositionRenderer } from '@/video/player/VideoCompositionRenderer';
import {
  VIDEO_RENDER_FORMAT,
  type VideoRenderInputProps,
  type VideoRenderSettingsDTO,
} from '@/app/lib/video/types';

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

export function RemotionVideoComposition({ composition }: VideoRenderInputProps) {
  return <VideoCompositionRenderer composition={composition} />;
}

export function RemotionRoot() {
  return (
    <Composition
      id={REMOTION_COMPOSITION_ID}
      component={RemotionVideoComposition}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={({ props }) => {
        const { fps, width, height } = resolveSettings(props.settings, props.composition);
        return {
          fps,
          width,
          height,
          durationInFrames: msToFrames(props.composition.durationMs, fps),
        };
      }}
    />
  );
}
