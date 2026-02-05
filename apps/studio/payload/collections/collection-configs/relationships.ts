import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Relationships: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.RELATIONSHIPS,
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'sourceCharacter', 'targetCharacter', 'project'],
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
      name: 'sourceCharacter',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.CHARACTERS,
      required: true,
      index: true,
    },
    {
      name: 'targetCharacter',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.CHARACTERS,
      required: true,
      index: true,
    },
    {
      name: 'label',
      type: 'text',
      required: false,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
  ],
}
