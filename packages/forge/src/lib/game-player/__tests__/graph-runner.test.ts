import { describe, expect, it } from 'vitest';
import {
  FORGE_CONDITIONAL_BLOCK_TYPE,
  FORGE_EDGE_KIND,
  FORGE_GRAPH_KIND,
  FORGE_NODE_TYPE,
  type ForgeGraphDoc,
} from '@magicborn/forge/types/forge-graph';
import { createGraphRunner, RUNNER_STATUS } from '@magicborn/forge/lib/game-player/graph-runner';
import { RUNNER_EVENT_TYPE } from '@magicborn/forge/lib/game-player/runner-events';
import { CONDITION_OPERATOR } from '@magicborn/forge/types/constants';

function createGraph(): ForgeGraphDoc {
  return {
    id: 1,
    project: 1,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Runner Test',
    startNodeId: 'n1',
    endNodeIds: [{ nodeId: 'n4' }],
    compiledYarn: null,
    flow: {
      nodes: [
        {
          id: 'n1',
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 0, y: 0 },
          data: {
            id: 'n1',
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Guide',
            content: 'Welcome',
          },
        },
        {
          id: 'n2',
          type: FORGE_NODE_TYPE.PLAYER,
          position: { x: 200, y: 0 },
          data: {
            id: 'n2',
            type: FORGE_NODE_TYPE.PLAYER,
            choices: [
              { id: 'c1', text: 'Accept', nextNodeId: 'n3', setFlags: ['accepted'] },
              { id: 'c2', text: 'Decline', nextNodeId: 'n4' },
            ],
          },
        },
        {
          id: 'n3',
          type: FORGE_NODE_TYPE.CONDITIONAL,
          position: { x: 400, y: 0 },
          data: {
            id: 'n3',
            type: FORGE_NODE_TYPE.CONDITIONAL,
            conditionalBlocks: [
              {
                id: 'cb1',
                type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
                condition: [{ flag: 'accepted', operator: CONDITION_OPERATOR.IS_SET }],
                content: 'Deal accepted.',
                nextNodeId: 'n4',
              },
            ],
          },
        },
        {
          id: 'n4',
          type: FORGE_NODE_TYPE.END,
          position: { x: 600, y: 0 },
          data: {
            id: 'n4',
            type: FORGE_NODE_TYPE.END,
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          kind: FORGE_EDGE_KIND.FLOW,
        },
      ],
    },
  };
}

describe('graph-runner', () => {
  it('emits line -> choice -> conditional line -> end flow', () => {
    const runner = createGraphRunner({
      rootGraph: createGraph(),
      initialGameState: { flags: { gold: 0 } },
    });

    const first = runner.step();
    expect(first.some((event) => event.type === RUNNER_EVENT_TYPE.LINE)).toBe(true);
    expect(runner.getState().status).toBe(RUNNER_STATUS.WAITING_FOR_ADVANCE);

    const second = runner.advance();
    const choiceEvent = second.find(
      (event) => event.type === RUNNER_EVENT_TYPE.CHOICES
    );
    expect(choiceEvent && 'choices' in choiceEvent ? choiceEvent.choices.length : 0).toBe(2);
    expect(runner.getState().status).toBe(RUNNER_STATUS.WAITING_FOR_CHOICE);

    const third = runner.selectChoice('c1');
    expect(
      third.some((event) => event.type === RUNNER_EVENT_TYPE.SET_VARIABLES)
    ).toBe(true);
    expect(third.some((event) => event.type === RUNNER_EVENT_TYPE.LINE)).toBe(true);
    expect(runner.getVariableSnapshot().accepted).toBe(true);
    expect(runner.getVariableSnapshot().flags_gold).toBe(0);

    const fourth = runner.advance();
    expect(fourth.some((event) => event.type === RUNNER_EVENT_TYPE.END)).toBe(true);
    expect(runner.getState().status).toBe(RUNNER_STATUS.ENDED);
  });
});
