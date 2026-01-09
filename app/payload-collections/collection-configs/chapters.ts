import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Chapters: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.CHAPTERS,
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
      name: 'act',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.ACTS,
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
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data?.chapterId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.CHAPTERS,
            where: {
              and: [
                { chapterId: { equals: data.chapterId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Chapter ID "${data.chapterId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
