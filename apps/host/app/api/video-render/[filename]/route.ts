import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { VIDEO_RENDER_FORMAT } from '../../../lib/video/types';

const RENDER_STORAGE_DIR = path.join(os.tmpdir(), 'dialogue-forge-renders');

const getContentTypeForFilename = (filename: string) => {
  if (filename.endsWith(`.${VIDEO_RENDER_FORMAT.WEBM}`)) {
    return 'video/webm';
  }
  return 'video/mp4';
};

export async function GET(_: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const filePath = path.join(RENDER_STORAGE_DIR, filename);

  try {
    await fs.access(filePath);
  } catch {
    return Response.json({ error: 'Render not found.' }, { status: 404 });
  }

  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    headers: {
      'Content-Type': getContentTypeForFilename(filename),
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  });
}
