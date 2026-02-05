import { describe, it, expect } from 'vitest';
import { prepareGraphForYarnExport } from '../utils/runtime-export';
import { createMockForgeFlowNode, createMockForgeGraphDoc } from './helpers';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { RUNTIME_DIRECTIVE_TYPE } from '@magicborn/shared/types/runtime';

describe('prepareGraphForYarnExport', () => {
  it('strips runtime-only presentation/directives while preserving dialogue flow', () => {
    const characterNode = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
      content: 'Hello there.',
      defaultNextNodeId: 'player1',
      presentation: {
        imageId: 'image_1',
        backgroundId: 'background_1',
      },
      runtimeDirectives: [
        {
          type: RUNTIME_DIRECTIVE_TYPE.SCENE,
          refId: 'scene_1',
        },
      ],
    });

    const playerNode = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {
      choices: [
        {
          id: 'choice_1',
          text: 'Continue',
          nextNodeId: 'char2',
        },
      ],
      presentation: {
        portraitId: 'portrait_1',
      },
      runtimeDirectives: [
        {
          type: RUNTIME_DIRECTIVE_TYPE.MEDIA,
          refId: 'media_1',
        },
      ],
    });

    const followupNode = createMockForgeFlowNode('char2', FORGE_NODE_TYPE.CHARACTER, {
      content: 'Next line.',
    });

    const graph = createMockForgeGraphDoc('Runtime export test', [
      characterNode,
      playerNode,
      followupNode,
    ]);

    graph.flow.edges = [
      { id: 'edge_1', source: 'char1', target: 'player1' },
      { id: 'edge_2', source: 'player1', target: 'char2' },
    ];

    const result = prepareGraphForYarnExport(graph);

    const exportedCharacter = result.nodes.find(node => node.id === 'char1');
    const exportedPlayer = result.nodes.find(node => node.id === 'player1');

    expect(exportedCharacter?.data?.presentation).toBeUndefined();
    expect(exportedCharacter?.data?.runtimeDirectives).toBeUndefined();
    expect(exportedPlayer?.data?.presentation).toBeUndefined();
    expect(exportedPlayer?.data?.runtimeDirectives).toBeUndefined();
    expect(exportedCharacter?.data?.defaultNextNodeId).toBe('player1');
    expect(exportedPlayer?.data?.choices?.[0]?.nextNodeId).toBe('char2');
    expect(result.edges).toHaveLength(2);
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'char1', target: 'player1' }),
        expect.objectContaining({ source: 'player1', target: 'char2' }),
      ])
    );
  });
});
