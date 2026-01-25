import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import {
  VIDEO_RENDER_FORMAT,
  VIDEO_RENDER_JOB_STATUS,
  type VideoRenderFormat,
  type VideoRenderInputProps,
  type VideoRenderJobStatus,
  type VideoRenderSettingsDTO,
} from '@/app/lib/video/types';
import { REMOTION_COMPOSITION_ID } from '@/app/lib/video/remotion-root';

export interface RenderedVideoAsset {
  id: string;
  filename: string;
  filePath: string;
  contentType: string;
}

export interface RenderJob {
  id: string;
  status: VideoRenderJobStatus;
  progress: number | null;
  asset?: RenderedVideoAsset;
  error?: string;
}

const RENDER_STORAGE_DIR = path.join(os.tmpdir(), 'dialogue-forge-renders');
const DEFAULT_RENDER_SETTINGS: VideoRenderSettingsDTO = {
  fps: 30,
  width: 1920,
  height: 1080,
  format: VIDEO_RENDER_FORMAT.MP4,
};

let bundleLocation: string | null = null;
const renderJobs = new Map<string, RenderJob>();

const getCodecForFormat = (format: VideoRenderFormat) => {
  if (format === VIDEO_RENDER_FORMAT.WEBM) {
    return 'vp8';
  }
  return 'h264';
};

const getContentTypeForFormat = (format: VideoRenderFormat) => {
  if (format === VIDEO_RENDER_FORMAT.WEBM) {
    return 'video/webm';
  }
  return 'video/mp4';
};

const ensureRenderStorage = async () => {
  await fs.mkdir(RENDER_STORAGE_DIR, { recursive: true });
  return RENDER_STORAGE_DIR;
};

const resolveRenderSettings = (settings?: VideoRenderSettingsDTO): VideoRenderSettingsDTO => ({
  fps: settings?.fps ?? DEFAULT_RENDER_SETTINGS.fps,
  width: settings?.width ?? DEFAULT_RENDER_SETTINGS.width,
  height: settings?.height ?? DEFAULT_RENDER_SETTINGS.height,
  format: settings?.format ?? DEFAULT_RENDER_SETTINGS.format,
});

const getBundleLocation = async () => {
  if (bundleLocation) {
    return bundleLocation;
  }

  const { bundle } = await import(
    /* webpackIgnore: true */
    '@remotion/bundler'
  );
  const entryPoint = path.join(process.cwd(), 'app/lib/video/remotion-entry.tsx');
  const outDir = path.join(os.tmpdir(), 'dialogue-forge-remotion-bundle');
  const bundled = await bundle({
    entryPoint,
    outDir,
    enableCaching: true,
    overwrite: true,
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
  });
  bundleLocation = bundled;
  return bundled;
};

const resolveProgressValue = (progress: unknown) => {
  if (typeof progress === 'number') {
    return progress;
  }
  if (progress && typeof progress === 'object') {
    const progressRecord = progress as Record<string, number | undefined>;
    if (typeof progressRecord.overallProgress === 'number') {
      return progressRecord.overallProgress;
    }
    if (typeof progressRecord.progress === 'number') {
      return progressRecord.progress;
    }
  }
  return 0;
};

export const renderVideoToFile = async (
  inputProps: VideoRenderInputProps,
  onProgress?: (progress: number) => void
): Promise<RenderedVideoAsset> => {
  const settings = resolveRenderSettings(inputProps.settings);
  const serveUrl = await getBundleLocation();
  const { renderMedia, selectComposition } = await import(
    /* webpackIgnore: true */
    '@remotion/renderer'
  );
  const composition = await selectComposition({
    serveUrl,
    id: REMOTION_COMPOSITION_ID,
    inputProps,
  });

  const renderDir = await ensureRenderStorage();
  const id = randomUUID();
  const filename = `${id}.${settings.format}`;
  const outputLocation = path.join(renderDir, filename);

  await renderMedia({
    composition,
    serveUrl,
    codec: getCodecForFormat(settings.format),
    outputLocation,
    inputProps,
    overwrite: true,
    onProgress: (progress) => {
      onProgress?.(resolveProgressValue(progress));
    },
  });

  return {
    id,
    filename,
    filePath: outputLocation,
    contentType: getContentTypeForFormat(settings.format),
  };
};

export const startRenderJob = (inputProps: VideoRenderInputProps): RenderJob => {
  const id = randomUUID();
  const job: RenderJob = {
    id,
    status: VIDEO_RENDER_JOB_STATUS.QUEUED,
    progress: 0,
  };
  renderJobs.set(id, job);

  const updateJob = (updates: Partial<RenderJob>) => {
    const existing = renderJobs.get(id);
    if (!existing) return;
    renderJobs.set(id, { ...existing, ...updates });
  };

  void (async () => {
    try {
      updateJob({ status: VIDEO_RENDER_JOB_STATUS.RENDERING, progress: 0 });
      const asset = await renderVideoToFile(inputProps, (progress) => {
        updateJob({ progress });
      });
      updateJob({ status: VIDEO_RENDER_JOB_STATUS.COMPLETED, progress: 1, asset });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to render video.';
      updateJob({ status: VIDEO_RENDER_JOB_STATUS.FAILED, error: message });
    }
  })();

  return job;
};

export const getRenderJob = (id: string) => renderJobs.get(id) ?? null;

export const getRenderStorageDir = () => RENDER_STORAGE_DIR;
