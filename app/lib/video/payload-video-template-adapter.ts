import { PayloadSDK } from '@payloadcms/sdk';
import type { VideoTemplate } from '@magicborn/dialogue-forge/video/templates/types/video-template';
import type {
  VideoTemplateMediaRequest,
  VideoTemplateMediaResolution,
  VideoTemplateWorkspaceAdapter,
  VideoTemplateWorkspaceTemplateSummary,
} from '@magicborn/dialogue-forge/video/workspace/video-template-workspace-contracts';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';
import { makePayloadMediaResolver } from '@/app/lib/video/payload-media-resolver';
import { VIDEO_TEMPLATE_PRESET_BY_ID, VIDEO_TEMPLATE_PRESETS } from '@/video/templates/presets';

interface PayloadVideoTemplateDoc {
  id: number;
  title: string;
  project: number | { id: number };
  template: unknown;
  updatedAt?: string;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getTemplateId = (templateId: string): number | null => {
  const parsed = Number(templateId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const mapTemplateSummary = (doc: PayloadVideoTemplateDoc): VideoTemplateWorkspaceTemplateSummary => ({
  id: String(doc.id),
  name: doc.title,
  updatedAt: doc.updatedAt,
});

const mapVideoTemplate = (doc: PayloadVideoTemplateDoc): VideoTemplate => {
  if (!isObject(doc.template)) {
    throw new Error(`Video template ${doc.id} is missing template JSON.`);
  }
  const template = doc.template as Partial<VideoTemplate>;
  // Always use the PayloadCMS document ID so saves update the existing record
  // This ensures that when you load a template and save it, it updates rather than creating a new one
  return {
    ...(template as VideoTemplate),
    id: String(doc.id), // Always use PayloadCMS ID
    name: template.name ?? doc.title,
  };
};

export function makePayloadVideoTemplateAdapter(opts?: {
  baseUrl?: string;
  projectId?: number;
}): VideoTemplateWorkspaceAdapter {
  const baseURL = opts?.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const payload = new PayloadSDK({
    baseURL: `${baseURL}/api`,
  });
  const projectId = opts?.projectId ?? null;
  const resolvePayloadMedia = makePayloadMediaResolver({ payload });

  return {
    async listTemplates(): Promise<VideoTemplateWorkspaceTemplateSummary[]> {
      const where = projectId
        ? {
            project: {
              equals: projectId,
            },
          }
        : undefined;
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
        where: where as any,
        limit: 200,
      });
      return [
        ...VIDEO_TEMPLATE_PRESETS.map((preset) => ({
          id: preset.id,
          name: preset.name,
        })),
        ...result.docs.map((doc) => mapTemplateSummary(doc as PayloadVideoTemplateDoc)),
      ];
    },

    async loadTemplate(templateId: string): Promise<VideoTemplate | null> {
      const preset = VIDEO_TEMPLATE_PRESET_BY_ID[templateId];
      if (preset) {
        return preset;
      }
      const parsedId = getTemplateId(templateId);
      if (!parsedId) {
        return null;
      }
      const doc = (await payload.findByID({
        collection: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
        id: parsedId,
      })) as PayloadVideoTemplateDoc;
      return mapVideoTemplate(doc);
    },

    async saveTemplate(template: VideoTemplate): Promise<VideoTemplate> {
      const existingId = getTemplateId(template.id);
      const data = {
        title: template.name,
        template,
      };

      if (existingId) {
        const doc = (await payload.update({
          collection: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
          id: existingId,
          data: data as any,
        })) as unknown as PayloadVideoTemplateDoc;
        return mapVideoTemplate(doc);
      }

      if (!projectId) {
        throw new Error('projectId is required to create a new video template.');
      }

      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
        data: {
          ...data,
          project: projectId,
        } as any,
      })) as unknown as PayloadVideoTemplateDoc;
      return mapVideoTemplate(doc);
    },

    async deleteTemplate(templateId: string): Promise<void> {
      const parsedId = getTemplateId(templateId);
      if (!parsedId) {
        throw new Error(`Invalid template ID: ${templateId}`);
      }
      await payload.delete({
        collection: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
        id: parsedId,
      });
    },

    async resolveMedia(request: VideoTemplateMediaRequest): Promise<VideoTemplateMediaResolution | null> {
      const resolved = await resolvePayloadMedia(request.mediaId);
      if (!resolved) {
        return null;
      }
      return {
        ...resolved,
        kind: request.kind,
      };
    },
  };
}
