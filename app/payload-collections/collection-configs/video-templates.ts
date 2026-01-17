import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const VideoTemplates: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.VIDEO_TEMPLATES,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'updatedAt'],
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
      required: true,
    },
    {
      name: 'template',
      type: 'json',
      required: true,
    },
  ],
}
