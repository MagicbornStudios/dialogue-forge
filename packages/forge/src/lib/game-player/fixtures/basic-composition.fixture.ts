import {
  COMPOSITION_CUE_TYPE,
  COMPOSITION_TRACK_TYPE,
  FORGE_COMPOSITION_SCHEMA,
  type ForgeCompositionV1,
} from '@magicborn/shared/types/composition';
import { FORGE_EDGE_KIND, FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';

export function createBasicCompositionFixture(): ForgeCompositionV1 {
  return {
    schema: FORGE_COMPOSITION_SCHEMA.V1,
    rootGraphId: 1,
    entry: {
      graphId: 1,
      nodeId: 'start',
    },
    resolvedGraphIds: [1],
    generatedAt: new Date().toISOString(),
    scenes: [
      {
        id: 'scene-1',
        graphId: 1,
        title: 'Fixture Graph',
        nodeIds: ['start', 'choice', 'end'],
      },
    ],
    tracks: [
      { id: 'track-system', type: COMPOSITION_TRACK_TYPE.SYSTEM, cueIds: ['cue-1', 'cue-4'] },
      { id: 'track-dialogue', type: COMPOSITION_TRACK_TYPE.DIALOGUE, cueIds: ['cue-2'] },
      { id: 'track-choice', type: COMPOSITION_TRACK_TYPE.CHOICE, cueIds: ['cue-3'] },
      { id: 'track-presentation', type: COMPOSITION_TRACK_TYPE.PRESENTATION, cueIds: [] },
    ],
    cues: [
      {
        id: 'cue-1',
        type: COMPOSITION_CUE_TYPE.ENTER_NODE,
        graphId: 1,
        nodeId: 'start',
        trackId: 'track-system',
        timing: { atMs: 0 },
      },
      {
        id: 'cue-2',
        type: COMPOSITION_CUE_TYPE.LINE,
        graphId: 1,
        nodeId: 'start',
        trackId: 'track-dialogue',
        timing: { atMs: 0, waitForInput: true },
        speaker: 'Narrator',
        text: 'Welcome to the fixture composition.',
      },
      {
        id: 'cue-3',
        type: COMPOSITION_CUE_TYPE.CHOICES,
        graphId: 1,
        nodeId: 'choice',
        trackId: 'track-choice',
        timing: { atMs: 1, waitForInput: true },
        choices: [
          { id: 'c1', text: 'Continue', nextNodeId: 'end' },
        ],
      },
      {
        id: 'cue-4',
        type: COMPOSITION_CUE_TYPE.END,
        graphId: 1,
        nodeId: 'end',
        trackId: 'track-system',
        timing: { atMs: 2 },
      },
    ],
    graphs: [
      {
        graphId: 1,
        kind: 'STORYLET',
        title: 'Fixture Graph',
        startNodeId: 'start',
        nodeOrder: ['start', 'choice', 'end'],
        nodesById: {
          start: {
            id: 'start',
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Narrator',
            content: 'Welcome to the fixture composition.',
          },
          choice: {
            id: 'choice',
            type: FORGE_NODE_TYPE.PLAYER,
            choices: [{ id: 'c1', text: 'Continue', nextNodeId: 'end' }],
          },
          end: {
            id: 'end',
            type: FORGE_NODE_TYPE.END,
          },
        },
        edges: [
          { id: 'e-start-choice', source: 'start', target: 'choice', kind: FORGE_EDGE_KIND.FLOW },
          { id: 'e-choice-end', source: 'choice', target: 'end', kind: FORGE_EDGE_KIND.CHOICE },
        ],
      },
    ],
    characterBindings: [],
    backgroundBindings: [],
    diagnostics: [],
  };
}
