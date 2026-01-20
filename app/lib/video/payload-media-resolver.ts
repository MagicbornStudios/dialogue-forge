import { PayloadSDK } from '@payloadcms/sdk';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';
import type { VideoTemplateMediaRecord, VideoTemplateMediaResolver } from '@/video/lib/media-resolver';

interface PayloadMediaDoc {
  id: number;
  url?: string | null;
  width?: number | null;
  height?: number | null;
  externalUrl?: string | null;
  secureUrl?: string | null;
}

const getMediaId = (mediaId: string): number | null => {
  const parsed = Number(mediaId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveMediaUrl = (doc: PayloadMediaDoc): string | null =>
  doc.externalUrl ?? doc.secureUrl ?? doc.url ?? null;

const mapPayloadMedia = (doc: PayloadMediaDoc): VideoTemplateMediaRecord | null => {
  const url = resolveMediaUrl(doc);
  if (!url) {
    return null;
  }
  return {
    id: String(doc.id),
    url,
    externalUrl: doc.externalUrl ?? null,
    secureUrl: doc.secureUrl ?? null,
    width: doc.width ?? null,
    height: doc.height ?? null,
  };
};

export const makePayloadMediaResolver = (opts: {
  payload: PayloadSDK;
}): VideoTemplateMediaResolver => {
  return async (mediaId: string) => {
    const parsedId = getMediaId(mediaId);
    if (!parsedId) {
      return null;
    }
    const doc = (await opts.payload.findByID({
      collection: PAYLOAD_COLLECTIONS.MEDIA,
      id: parsedId,
    })) as PayloadMediaDoc;
    return mapPayloadMedia(doc);
  };
};
