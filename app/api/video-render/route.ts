import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { renderVideoToFile, startRenderJob } from '@/app/lib/video/remotion-renderer';
import {
  VIDEO_RENDER_FORMAT,
  VIDEO_RENDER_RESPONSE_MODE,
  type VideoRenderFormat,
  type VideoRenderJobResponseDTO,
  type VideoRenderRequestDTO,
  type VideoRenderResponseDTO,
  type VideoRenderResponseMode,
} from '@/app/lib/video/types';

const isValidFormat = (value: unknown): value is VideoRenderFormat =>
  Object.values(VIDEO_RENDER_FORMAT).includes(value as VideoRenderFormat);

const isValidResponseMode = (value: unknown): value is VideoRenderResponseMode =>
  Object.values(VIDEO_RENDER_RESPONSE_MODE).includes(value as VideoRenderResponseMode);

const buildDownloadUrl = (filename: string) => `/api/video-render/${filename}`;
const buildStatusUrl = (jobId: string) => `/api/video-render/status/${jobId}`;

const streamFileResponse = (filePath: string, filename: string, contentType: string) =>
  new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  });

export async function POST(request: Request) {
  const payload = (await request.json()) as VideoRenderRequestDTO;

  if (!payload?.composition || !payload?.settings) {
    return Response.json({ error: 'Missing composition or settings.' }, { status: 400 });
  }

  if (!isValidFormat(payload.settings.format)) {
    return Response.json({ error: 'Invalid render format.' }, { status: 400 });
  }

  if (payload.settings.fps <= 0 || payload.settings.width <= 0 || payload.settings.height <= 0) {
    return Response.json({ error: 'Invalid render settings.' }, { status: 400 });
  }

  const responseMode = isValidResponseMode(payload.responseMode)
    ? payload.responseMode
    : VIDEO_RENDER_RESPONSE_MODE.STREAM;

  if (responseMode === VIDEO_RENDER_RESPONSE_MODE.ASYNC) {
    const job = startRenderJob({
      composition: payload.composition,
      settings: payload.settings,
    });
    const body: VideoRenderJobResponseDTO = {
      id: job.id,
      status: job.status,
      statusUrl: buildStatusUrl(job.id),
    };
    return Response.json(body);
  }

  const asset = await renderVideoToFile({
    composition: payload.composition,
    settings: payload.settings,
  });

  if (responseMode === VIDEO_RENDER_RESPONSE_MODE.URL) {
    const body: VideoRenderResponseDTO = {
      id: asset.id,
      filename: asset.filename,
      url: buildDownloadUrl(asset.filename),
    };
    return Response.json(body);
  }

  return streamFileResponse(asset.filePath, asset.filename, asset.contentType);
}
