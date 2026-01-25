import { getRenderJob } from '@/app/lib/video/remotion-renderer';
import {
  VIDEO_RENDER_JOB_STATUS,
  type VideoRenderJobStatusDTO,
} from '@/app/lib/video/types';

const buildDownloadUrl = (filename: string) => `/api/video-render/${filename}`;

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = getRenderJob(jobId);

  if (!job) {
    return Response.json({ error: 'Render job not found.' }, { status: 404 });
  }

  const body: VideoRenderJobStatusDTO = {
    id: job.id,
    status: job.status,
    progress: job.progress ?? undefined,
    url:
      job.status === VIDEO_RENDER_JOB_STATUS.COMPLETED && job.asset
        ? buildDownloadUrl(job.asset.filename)
        : undefined,
    error: job.error,
  };

  return Response.json(body);
}
