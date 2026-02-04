import { PayloadSDK } from '@payloadcms/sdk';
import type { ProjectSummary, ProjectAdapter } from '@magicborn/video/workspace/video-template-workspace-contracts';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';

interface PayloadProject {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
}

export function makePayloadProjectAdapter(opts?: { baseUrl?: string }): ProjectAdapter {
  const baseURL = opts?.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const payload = new PayloadSDK({
    baseURL: `${baseURL}/api`,
  });

  return {
    async listProjects(): Promise<ProjectSummary[]> {
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        limit: 200,
        sort: '-updatedAt',
      });
      
      return result.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
      }));
    },

    async createProject(input: { name: string; description?: string | null }): Promise<ProjectSummary> {
      const doc = await payload.create({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        data: {
          name: input.name,
          description: input.description || null,
        },
      }) as PayloadProject;
      
      return {
        id: doc.id,
        name: doc.name,
        slug: doc.slug,
      };
    },
  };
}
