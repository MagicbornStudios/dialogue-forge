import type { CollectionConfig } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../enums';

/**
 * Notion-inspired block storage for Writer compatibility migration.
 * This runs in parallel with legacy page-level body fields.
 */
export const Blocks: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.BLOCKS,
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'page',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.PAGES,
      required: true,
      index: true,
    },
    {
      name: 'parent_block',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.BLOCKS as any,
      required: false,
      index: true,
      admin: {
        description: 'Optional parent for nested blocks.',
      },
    },
    {
      name: 'type',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'Block type (paragraph, heading_1, heading_2, bulleted_list_item, code, etc).',
      },
    },
    {
      name: 'position',
      type: 'number',
      required: true,
      defaultValue: 0,
      index: true,
      admin: {
        description: 'Sibling order index.',
      },
    },
    {
      name: 'payload',
      type: 'json',
      required: true,
      defaultValue: {},
      admin: {
        description:
          'Type-specific data; may contain lexicalSerialized for compatibility.',
      },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'in_trash',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'has_children',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
  ],
};
