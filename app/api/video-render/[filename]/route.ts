import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { getRenderStorageDir } from '@/app/lib/video/remotion-renderer';
import { VIDEO_RENDER_FORMAT } from '@/app/lib/video/types';

const getContentTypeForFilename = (filename: string) => {
  if (filename.endsWith(`.${VIDEO_RENDER_FORMAT.WEBM}`)) {
    return 'video/webm';
  }
  return 'video/mp4';
};

export async function GET(_: Request, { params }: { params: { filename: string } }) {
  const renderDir = getRenderStorageDir();
  const filename = params.filename;
  const filePath = path.join(renderDir, filename);

  try {
    await fs.access(filePath);
  } catch {
    return Response.json({ error: 'Render not found.' }, { status: 404 });
  }

  return new Response(Readable.toWeb(createReadStream(filePath)), {
    headers: {
      'Content-Type': getContentTypeForFilename(filename),
      'Content-Disposition': `attachment; filename=\"${filename}\"`,
    },
  });
}
