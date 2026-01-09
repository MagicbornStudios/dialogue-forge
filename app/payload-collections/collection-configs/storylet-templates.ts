import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const StoryletTemplates: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES,
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
      name: 'dialogue',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.DIALOGUES,
      required: true,
      index: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'defaultWeight',
      type: 'number',
      defaultValue: 1,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data?.templateId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES,
            where: {
              and: [
                { templateId: { equals: data.templateId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Storylet template ID "${data.templateId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
