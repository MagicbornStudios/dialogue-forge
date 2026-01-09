import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const StoryletPools: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.STORYLET_POOLS,
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
    {
      name: 'selectionMode',
      type: 'select',
      options: [
        { label: 'Weighted', value: 'WEIGHTED' },
        { label: 'Uniform', value: 'UNIFORM' },
      ],
      required: true,
      defaultValue: 'WEIGHTED',
    },
    {
      name: 'members',
      type: 'array',
      fields: [
        {
          name: 'template',
          type: 'relationship',
          relationTo: PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES,
          required: true,
        },
        {
          name: 'weight',
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data?.poolId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.STORYLET_POOLS,
            where: {
              and: [
                { poolId: { equals: data.poolId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Storylet pool ID "${data.poolId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
