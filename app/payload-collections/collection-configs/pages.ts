import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Pages: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.PAGES,
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
      name: 'chapter',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.CHAPTERS,
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
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
      index: true,
    },
    {
      name: 'dialogueGraph',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
      required: false,
      admin: {
        description: 'Forge dialogue graph (kind=DIALOGUE) for this page.',
      },
    },
    {
      name: 'bookBody',
      type: 'textarea',
    },
    {
      name: 'archivedAt',
      type: 'date',
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
}
