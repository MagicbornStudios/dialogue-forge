/**
 * Integration Tests for Yarn Converter
 * 
 * Tests full graph conversion and round-trip scenarios
 */

import { describe, it, expect } from 'vitest';
import { exportToYarn, importFromYarn } from '../index';
import {
  createMockForgeGraphDoc,
  createSimpleCharacterNode,
  createSimplePlayerNode,
  createSimpleConditionalNode,
} from './helpers';
import { FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';
import { CONDITION_OPERATOR, YARN_BLOCK_TYPE } from '@/src/types/constants';

describe('Integration Tests', () => {
  describe('Full Graph Conversion', () => {
    it('should convert complete graph with all node types', async () => {
      const graph = createMockForgeGraphDoc('Test Graph', [
        createSimpleCharacterNode('char1', 'Hello!', 'NPC'),
        createSimplePlayerNode('player1', [
          { text: 'Yes', nextNodeId: 'char2' },
          { text: 'No', nextNodeId: 'char3' },
        ]),
        createSimpleCharacterNode('char2', 'You said yes!', 'NPC'),
        createSimpleCharacterNode('char3', 'You said no!', 'NPC'),
      ], 'char1');

      const yarn = await exportToYarn(graph);
      
      expect(yarn).toContain('title: char1');
      expect(yarn).toContain('title: player1');
      expect(yarn).toContain('title: char2');
      expect(yarn).toContain('title: char3');
    });

    it('should preserve node order', async () => {
      const graph = createMockForgeGraphDoc('Test Graph', [
        createSimpleCharacterNode('node1', 'First'),
        createSimpleCharacterNode('node2', 'Second'),
        createSimpleCharacterNode('node3', 'Third'),
      ]);

      const yarn = await exportToYarn(graph);
      const lines = yarn.split('\n');
      const node1Index = lines.findIndex(l => l.includes('title: node1'));
      const node2Index = lines.findIndex(l => l.includes('title: node2'));
      const node3Index = lines.findIndex(l => l.includes('title: node3'));
      
      expect(node1Index).toBeLessThan(node2Index);
      expect(node2Index).toBeLessThan(node3Index);
    });

    it('should preserve startNodeId', async () => {
      const graph = createMockForgeGraphDoc('Test Graph', [
        createSimpleCharacterNode('start', 'Start'),
        createSimpleCharacterNode('other', 'Other'),
      ], 'start');

      const imported = await importFromYarn(await exportToYarn(graph), 'Test');
      
      expect(imported.startNodeId).toBe('start');
    });
  });

  describe('Round-Trip Scenarios', () => {
    it('should round-trip complex graph with conditionals', async () => {
      const original = createMockForgeGraphDoc('Complex Graph', [
        createSimpleConditionalNode('cond1', [
          {
            type: 'if',
            condition: [
              { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Door unlocked!',
          },
          {
            type: 'else',
            content: 'Door locked!',
          },
        ]),
        createSimplePlayerNode('player1', [
          {
            text: 'Use key',
            nextNodeId: 'next',
          },
        ]),
      ]);

      const yarn = await exportToYarn(original);
      const imported = await importFromYarn(yarn, 'Complex Graph');
      
      expect(imported.flow.nodes.length).toBe(2);
      expect(imported.flow.nodes[0].data?.type).toBe(FORGE_NODE_TYPE.CONDITIONAL);
      expect(imported.flow.nodes[1].data?.type).toBe(FORGE_NODE_TYPE.PLAYER);
    });

    it('should round-trip graph with variable operations', async () => {
      const original = createMockForgeGraphDoc('Variable Graph', [
        createSimpleCharacterNode('merchant', 'You have {$stat_gold} gold.', 'Merchant'),
      ]);

      const yarn = await exportToYarn(original);
      const imported = await importFromYarn(yarn, 'Variable Graph');
      
      expect(imported.flow.nodes[0].data?.content).toContain('{$stat_gold}');
    });

    it('should round-trip graph with conditional choices', async () => {
      const original = createMockForgeGraphDoc('Conditional Choices', [
        createSimplePlayerNode('player1', [
          {
            text: 'Use key',
            nextNodeId: 'unlock',
          },
        ]),
      ]);

      // Add conditions to first choice
      if (original.flow.nodes[0].data?.choices?.[0]) {
        original.flow.nodes[0].data.choices[0].conditions = [
          { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
        ];
      }

      const yarn = await exportToYarn(original);
      const imported = await importFromYarn(yarn, 'Conditional Choices');
      
      expect(imported.flow.nodes[0].data?.choices?.[0].conditions).toBeDefined();
      expect(imported.flow.nodes[0].data?.choices?.[0].conditions?.[0].flag).toBe('has_key');
    });
  });

  describe('Yarn Spinner Feature Support', () => {
    it('should support variable interpolation', async () => {
      const graph = createMockForgeGraphDoc('Interpolation', [
        createSimpleCharacterNode('test', 'Hello {$player_name}!', 'NPC'),
      ]);

      const yarn = await exportToYarn(graph);
      
      expect(yarn).toContain('{$player_name}');
    });

    it('should support set command variations', async () => {
      const graph = createMockForgeGraphDoc('Set Commands', [
        createSimpleCharacterNode('test', 'Content <<set $gold += 100>>', 'NPC'),
      ]);

      const yarn = await exportToYarn(graph);
      
      expect(yarn).toContain('<<set $gold += 100>>');
    });

    it('should support jump commands', async () => {
      const graph = createMockForgeGraphDoc('Jumps', [
        createSimpleCharacterNode('node1', 'First', 'NPC'),
        createSimpleCharacterNode('node2', 'Second', 'NPC'),
      ]);

      if (graph.flow.nodes[0].data) {
        graph.flow.nodes[0].data.defaultNextNodeId = 'node2';
      }

      const yarn = await exportToYarn(graph);
      
      expect(yarn).toContain('<<jump node2>>');
    });

    it('should support conditional blocks', async () => {
      const graph = createMockForgeGraphDoc('Conditionals', [
        createSimpleConditionalNode('cond1', [
          {
            type: 'if',
            condition: [
              { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Quest active!',
          },
        ]),
      ]);

      const yarn = await exportToYarn(graph);
      
      expect(yarn).toContain('<<if $quest>>');
      expect(yarn).toContain('Quest active!');
      expect(yarn).toContain('<<endif>>');
    });
  });
});
