import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function normalizeRelationshipFlow(value: unknown): { nodes: any[]; edges: any[] } {
  if (!isObject(value)) return { nodes: [], edges: [] }
  const nodes = Array.isArray((value as any).nodes) ? (value as any).nodes : []
  const edges = Array.isArray((value as any).edges) ? (value as any).edges : []
  return { nodes, edges }
}

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

    // --- Minimal editor fields ---
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: false,
      admin: {
        description: 'URL to a character portrait. UI should fall back to a placeholder when empty.',
      },
    },

    // --- Existing fields (keep for compatibility / later use) ---
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

    // --- NEW: POV relationship graph stored on the character ---
    {
      name: 'relationshipFlow',
      type: 'json',
      required: false,
      admin: {
        description:
          'POV graph: { nodes: [{ id, type, position: {x,y} }], edges: [{ id, source, target }] }. Must include a node with id = this character; all edges must have source = this character.',
      },
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
  hooks: {
    // Optional safety: keep relationshipFlow shaped, even if empty.
    // Also a good place to ensure nodes/edges arrays exist for the UI.
    beforeValidate: [
      async ({ data }) => {
        if (!data) return data
        const rf = normalizeRelationshipFlow((data as any).relationshipFlow)
        ;(data as any).relationshipFlow = rf
        return data
      },
    ],
  },
}
