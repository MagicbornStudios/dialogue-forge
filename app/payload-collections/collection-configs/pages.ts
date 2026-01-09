import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Pages: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.PAGES,
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
      name: 'chapter',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.CHAPTERS,
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'dialogue',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.DIALOGUES,
      required: true,
      index: true,
    },
    {
      name: 'dialogueId',
      type: 'text',
      // Denormalized for fast client access
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
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Ensure pageId is unique within project
        if (data?.pageId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.PAGES,
            where: {
              and: [
                { pageId: { equals: data.pageId } },
                { project: { equals: data.project } },
                { archivedAt: { exists: false } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Page ID "${data.pageId}" already exists in this project`)
          }
        }
        // Denormalize dialogueId from dialogue relationship if not already set
        if (!data?.dialogueId && data?.dialogue) {
          if (typeof data.dialogue === 'object' && 'dialogueId' in data.dialogue) {
            data.dialogueId = (data.dialogue as { dialogueId?: string }).dialogueId
          } else if (typeof data.dialogue === 'string' || typeof data.dialogue === 'number') {
            // If it's just an ID, fetch the dialogue to get dialogueId
            const dialogue = await req.payload.findByID({
              collection: PAYLOAD_COLLECTIONS.DIALOGUES,
              id: data.dialogue as string | number,
            })
            if (dialogue && 'dialogueId' in dialogue) {
              data.dialogueId = dialogue.dialogueId as string
            }
          }
        }
      },
    ],
  },
}
