import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const FlagSchemas: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
  trash: true,
  admin: {
    useAsTitle: 'id',
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
      name: 'schema',
      type: 'json',
      required: true,
      // Stores FlagSchema structure
    },
    {
      name: '_status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      required: false,
    },
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        // Validate that schema JSON is properly structured
        if (data?.schema && typeof data.schema === 'object' && data.schema !== null) {
          const schema = data.schema as { flags?: unknown[] }
          if (!Array.isArray(schema.flags)) {
            throw new Error('Flag schema must have a "flags" array')
          }
        }
      },
    ],
  },
}
