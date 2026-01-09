import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Acts: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.ACTS,
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
      name: 'thread',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.THREADS,
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
        if (data?.actId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.ACTS,
            where: {
              and: [
                { actId: { equals: data.actId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Act ID "${data.actId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
