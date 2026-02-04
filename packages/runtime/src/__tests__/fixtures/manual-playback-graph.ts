import {
  FORGE_EDGE_KIND,
  FORGE_GRAPH_KIND,
  FORGE_NODE_TYPE,
  type ForgeGraphDoc,
} from '@magicborn/shared/types/forge-graph';

const now = '2024-01-01T00:00:00.000Z';

export const MANUAL_PLAYBACK_GRAPH_FIXTURE: ForgeGraphDoc = {
  id: 0,
  project: 0,
  kind: FORGE_GRAPH_KIND.NARRATIVE,
  title: 'Manual Playback Fixture',
  startNodeId: 'node-intro',
  endNodeIds: [{ nodeId: 'node-outro', exitKey: 'complete' }],
  flow: {
    nodes: [
      {
        id: 'node-intro',
        type: FORGE_NODE_TYPE.CHARACTER,
        position: { x: 0, y: 0 },
        data: {
          id: 'node-intro',
          type: FORGE_NODE_TYPE.CHARACTER,
          speaker: 'Guide',
          content: 'Welcome to Forge. Pick a path to continue.',
        },
      },
      {
        id: 'node-choice',
        type: FORGE_NODE_TYPE.PLAYER,
        position: { x: 320, y: 0 },
        data: {
          id: 'node-choice',
          type: FORGE_NODE_TYPE.PLAYER,
          speaker: 'Player',
          choices: [
            {
              id: 'choice-continue',
              text: 'Show me the demo flow',
              nextNodeId: 'node-outro',
            },
            {
              id: 'choice-skip',
              text: 'Skip ahead',
              nextNodeId: 'node-outro',
            },
          ],
        },
      },
      {
        id: 'node-outro',
        type: FORGE_NODE_TYPE.CHARACTER,
        position: { x: 640, y: -40 },
        data: {
          id: 'node-outro',
          type: FORGE_NODE_TYPE.CHARACTER,
          speaker: 'Guide',
          content: 'Great! The choice should update both the dialogue and the video preview.',
        },
      },
    ],
    edges: [
      {
        id: 'edge-intro-choice',
        source: 'node-intro',
        target: 'node-choice',
        kind: FORGE_EDGE_KIND.FLOW,
      },
      {
        id: 'edge-choice-outro-1',
        source: 'node-choice',
        target: 'node-outro',
        kind: FORGE_EDGE_KIND.CHOICE,
        label: 'Show me the demo flow',
      },
      {
        id: 'edge-choice-outro-2',
        source: 'node-choice',
        target: 'node-outro',
        kind: FORGE_EDGE_KIND.CHOICE,
        label: 'Skip ahead',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  compiledYarn: null,
  updatedAt: now,
  createdAt: now,
};
