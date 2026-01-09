import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Dialogues: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.DIALOGUES,
  trash: true,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.PROJECTS,
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'tree',
      type: 'json',
      required: true,
      // Stores full DialogueTree snapshot
    },
    {
      name: 'startNodeId',
      type: 'text',
      // Denormalized from tree for indexing/search
    },
    {
      name: 'archivedAt',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Ensure dialogueId is unique within project
        if (data?.dialogueId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.DIALOGUES,
            where: {
              and: [
                { dialogueId: { equals: data.dialogueId } },
                { project: { equals: data.project } },
                { archivedAt: { exists: false } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Dialogue ID "${data.dialogueId}" already exists in this project`)
          }
        }
        // Denormalize startNodeId from tree
        if (data?.tree && typeof data.tree === 'object' && 'startNodeId' in data.tree) {
          data.startNodeId = (data.tree as { startNodeId?: string }).startNodeId
        }
      },
    ],
  },
}
