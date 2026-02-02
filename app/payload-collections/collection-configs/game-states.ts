import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const GameStates: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.GAME_STATES,
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'Authored', value: 'AUTHORED' },
        { label: 'Runtime', value: 'RUNTIME' },
      ],
      required: true,
      defaultValue: 'AUTHORED',
    },
    {
      name: 'playerKey',
      type: 'text',
      // For runtime states - player identifier
      index: true,
    },
    {
      name: 'state',
      type: 'json',
      required: true,
      // Stores authored schema (players/characters/flags) or runtime values
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
}
