import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Threads: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.THREADS,
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
    },
    {
      name: 'summary',
      type: 'textarea',
    },
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data?.threadId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.THREADS,
            where: {
              and: [
                { threadId: { equals: data.threadId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Thread ID "${data.threadId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
