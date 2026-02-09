import { describe, expect, it } from 'vitest';
import {
  FORGE_GRAPH_KIND,
  FORGE_NODE_TYPE,
  FORGE_STORYLET_CALL_MODE,
  type ForgeGraphDoc,
} from '@magicborn/forge/types/forge-graph';
import { graphToComposition } from '@magicborn/forge/lib/game-player/composition/graph-to-composition';
import { FORGE_COMPOSITION_SCHEMA } from '@magicborn/shared/types/composition';

function createRootGraph(): ForgeGraphDoc {
  return {
    id: 10,
    project: 1,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Root',
    startNodeId: 'root-start',
    endNodeIds: [{ nodeId: 'root-end' }],
    compiledYarn: null,
    flow: {
      nodes: [
        {
          id: 'root-start',
          type: FORGE_NODE_TYPE.STORYLET,
          position: { x: 0, y: 0 },
          data: {
            id: 'root-start',
            type: FORGE_NODE_TYPE.STORYLET,
            storyletCall: {
              mode: FORGE_STORYLET_CALL_MODE.JUMP,
              targetGraphId: 20,
            },
          },
        },
      ],
      edges: [],
    },
  };
}

function createReferencedGraph(): ForgeGraphDoc {
  return {
    id: 20,
    project: 1,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Referenced',
    startNodeId: 'ref-start',
    endNodeIds: [{ nodeId: 'ref-end' }],
    compiledYarn: null,
    flow: {
      nodes: [
        {
          id: 'ref-start',
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 0, y: 0 },
          data: {
            id: 'ref-start',
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Guide',
            content: 'Hello from referenced graph',
          },
        },
        {
          id: 'ref-end',
          type: FORGE_NODE_TYPE.END,
          position: { x: 200, y: 0 },
          data: {
            id: 'ref-end',
            type: FORGE_NODE_TYPE.END,
          },
        },
      ],
      edges: [{ id: 'e1', source: 'ref-start', target: 'ref-end' }],
    },
  };
}

describe('graphToComposition', () => {
  it('includes resolved referenced graphs in composition', async () => {
    const root = createRootGraph();
    const referenced = createReferencedGraph();
    const result = await graphToComposition(root, {
      resolveStorylets: true,
      resolver: async (graphId) => (graphId === referenced.id ? referenced : null),
    });

    expect(result.composition.schema).toBe(FORGE_COMPOSITION_SCHEMA.V1);
    expect(result.resolvedGraphIds).toContain(root.id);
    expect(result.resolvedGraphIds).toContain(referenced.id);
    expect(result.composition.graphs.find((graph) => graph.graphId === referenced.id)).toBeTruthy();
  });

  it('fails on missing referenced graph by default', async () => {
    const root = createRootGraph();
    await expect(
      graphToComposition(root, {
        resolveStorylets: true,
        resolver: async () => null,
      })
    ).rejects.toThrow(/Referenced graph/);
  });
});
