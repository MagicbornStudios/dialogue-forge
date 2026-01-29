import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function validateRelationshipFlowJson(value: unknown): true | string {
  // allow empty/null -> workspace can initialize it
  if (value === null || value === undefined) return true
  if (!isObject(value)) return 'relationshipFlow must be an object'

  const nodes = (value as any).nodes
  const edges = (value as any).edges

  if (!Array.isArray(nodes)) return 'relationshipFlow.nodes must be an array'
  if (!Array.isArray(edges)) return 'relationshipFlow.edges must be an array'

  for (const n of nodes) {
    if (!n?.id || typeof n.id !== 'string') return 'Each relationshipFlow node must have a string id'
    if (!n?.type || typeof n.type !== 'string') return 'Each relationshipFlow node must have a string type'
    if (!n?.position || typeof n.position?.x !== 'number' || typeof n.position?.y !== 'number') {
      return 'Each relationshipFlow node must have numeric position {x,y}'
    }
  }

  for (const e of edges) {
    if (!e?.id || typeof e.id !== 'string') return 'Each relationshipFlow edge must have a string id'
    if (!e?.source || typeof e.source !== 'string') return 'Each relationshipFlow edge must have a string source'
    if (!e?.target || typeof e.target !== 'string') return 'Each relationshipFlow edge must have a string target'
  }

  return true
}

function enforceOptionA(value: unknown, characterId: string | undefined): true | string {
  // If we don't have an id yet (create), don't block creation.
  if (!characterId) return true
  if (!isObject(value)) return true

  const nodes = Array.isArray((value as any).nodes) ? (value as any).nodes : []
  const edges = Array.isArray((value as any).edges) ? (value as any).edges : []

  // If graph is empty, allow it.
  if (nodes.length === 0 && edges.length === 0) return true

  // Must contain the perspective node (self)
  const hasSelfNode = nodes.some((n: any) => n?.id === characterId)
  if (!hasSelfNode) return `relationshipFlow must include a node with id = "${characterId}" (the perspective character)`

  // Option A: every edge must originate from the perspective character
  for (const e of edges) {
    if (e?.source !== characterId) {
      return `All relationshipFlow edges must have source="${characterId}" (Option A POV rule)`
    }
    if (e?.target === characterId) {
      return 'relationshipFlow edges cannot target the perspective character (no self-edge)'
    }
  }

  return true
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
      validate: (value, ctx: any) => {
        const basic = validateRelationshipFlowJson(value)
        if (basic !== true) return basic

        const characterId: string | undefined = (ctx?.data as any)?.id
        const optionA = enforceOptionA(value, characterId)
        if (optionA !== true) return optionA

        return true
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
