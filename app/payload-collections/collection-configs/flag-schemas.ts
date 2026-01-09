import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const FlagSchemas: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
  trash: true,
  admin: {
    useAsTitle: 'schemaId',
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
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data?.schemaId && data?.project) {
          const existing = await req.payload.find({
            collection: PAYLOAD_COLLECTIONS.FLAG_SCHEMAS,
            where: {
              and: [
                { schemaId: { equals: data.schemaId } },
                { project: { equals: data.project } },
              ],
            },
            limit: 1,
          })
          if (existing.docs.length > 0 && existing.docs[0].id !== data.id) {
            throw new Error(`Flag schema ID "${data.schemaId}" already exists in this project`)
          }
        }
      },
    ],
  },
}
