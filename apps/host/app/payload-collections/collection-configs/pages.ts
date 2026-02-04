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
      name: 'narrativeGraph',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
      required: false,
      index: true,
      admin: {
        description: 'Narrative forge graph this page belongs to (act/chapter/page in Writer)',
      },
    },
    {
      name: 'pageType',
      type: 'select',
      options: [
        { label: 'Act', value: 'ACT' },
        { label: 'Chapter', value: 'CHAPTER' },
        { label: 'Page', value: 'PAGE' },
      ],
      required: true,
      index: true,
      admin: {
        description: 'Type of page in narrative hierarchy',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.PAGES,
      required: false,
      index: true,
      admin: {
        description: 'Parent page (Chapter for Page, Act for Chapter, null for Act)',
        condition: (data) => data.pageType !== 'ACT',
      },
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
      name: 'content',
      type: 'json',
      admin: {
        description: 'Rich content/metadata (optional)',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      index: true,
    },
    {
      name: 'bookHeading',
      type: 'text',
      admin: {
        description: 'Optional heading for book export',
      },
    },
    {
      name: 'bookBody',
      type: 'textarea',
      admin: {
        description: 'Main text content for this page',
      },
    },
    {
      name: 'comments',
      type: 'json',
      admin: {
        description: 'Comments and threads associated with this page',
      },
    },
    {
      name: 'dialogueGraph',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
      required: false,
      admin: {
        description: 'Dialogue graph for PAGE type',
        condition: (data) => data.pageType === 'PAGE',
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when page was archived',
      },
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
}
