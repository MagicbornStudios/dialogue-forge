import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Characters: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.CHARACTERS,
  trash: true,
  admin: {
    useAsTitle: 'name',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'meta',
      type: 'json',
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

  },
}
