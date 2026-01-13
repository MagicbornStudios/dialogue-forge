// payload-collections/collection-configs/forge-graphs.ts
import type { CollectionConfig } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../enums';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function validateReactFlowJson(value: unknown): true | string {
  if (!isObject(value)) return 'flow must be an object';
  const nodes = (value as any).nodes;
  const edges = (value as any).edges;

  if (!Array.isArray(nodes)) return 'flow.nodes must be an array';
  if (!Array.isArray(edges)) return 'flow.edges must be an array';

  for (const n of nodes) {
    if (!n?.id || typeof n.id !== 'string') return 'Each node must have a string id';
    if (!n?.type || typeof n.type !== 'string') return 'Each node must have a string type';
    if (!n?.position || typeof n.position?.x !== 'number' || typeof n.position?.y !== 'number') {
      return 'Each node must have numeric position {x,y}';
    }
  }

  for (const e of edges) {
    if (!e?.id || typeof e.id !== 'string') return 'Each edge must have a string id';
    if (!e?.source || typeof e.source !== 'string') return 'Each edge must have a string source';
    if (!e?.target || typeof e.target !== 'string') return 'Each edge must have a string target';
  }

  return true;
}

function nodeIdExists(flow: any, nodeId: string): boolean {
  const nodes = Array.isArray(flow?.nodes) ? flow.nodes : [];
  return nodes.some((n: any) => n?.id === nodeId);
}

export const ForgeGraphs: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'project', 'updatedAt'],
    description: 'Tool-owned canonical graphs (React Flow JSON).',
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
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Narrative', value: 'NARRATIVE' },
        { label: 'Storylet', value: 'STORYLET' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    // Canonical flow JSON (React Flow)
    {
      name: 'flow',
      type: 'json',
      required: true,
      validate: (value) => validateReactFlowJson(value),
    },

    // Canonical start/end semantics (validated against flow.nodes)
    {
      name: 'startNodeId',
      type: 'text',
      required: true,
      validate: (value: unknown, { data }: { data: unknown }) => {
        const start = typeof value === 'string' ? value : '';
        if (!start) return 'startNodeId is required';
        return nodeIdExists((data as any)?.flow, start) ? true : 'startNodeId must match a node.id in flow.nodes';
      },
    },
    {
      name: 'endNodeIds',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'nodeId', type: 'text', required: true },
        { name: 'exitKey', type: 'text', required: false },
      ],
      validate: (value: unknown, { data }: { data: unknown }) => {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length < 1) return 'At least one end node is required';
        for (const row of arr) {
          const nodeId = (row as { nodeId?: string }).nodeId;
          if (!nodeId || typeof nodeId !== 'string') return 'Each endNodeIds row must contain nodeId';
          if (!nodeIdExists((data as any)?.flow, nodeId)) return `End nodeId "${nodeId}" must exist in flow.nodes`;
        }
        return true;
      },
    },

    // Optional cache (regen anytime)
    {
      name: 'compiledYarn',
      type: 'textarea',
      required: false,
    },
  ],
};
