import type { Payload } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../collections/enums';

/**
 * Seed a demo project without any graphs.
 * Users can create graphs from scratch in the UI.
 */
export async function seedProjectWithNarrativeGraph(payload: Payload) {
  // Avoid dupes
  const existing = await payload.find({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    where: { name: { equals: 'Demo Project' } },
    limit: 1,
  });

  if (existing.docs.length > 0) return;

  // Create project only (no graphs)
  await payload.create({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    data: {
      name: 'Demo Project',
      slug: 'demo-project',
      description: 'Seeded demo project. Create your graphs from scratch.',
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Seeded Demo Project (no graphs)');
}
