/**
 * Tests for PlayerHandler
 * 
 * Comprehensive tests for export, import, and round-trip conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerHandler } from '../handlers/player-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import {
  createMockForgeFlowNode,
  parseYarnNode,
  createSimplePlayerNode,
} from './helpers';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@magicborn/forge/types/constants';

describe('PlayerHandler', () => {
  let handler: PlayerHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new PlayerHandler();
    builder = new YarnTextBuilder();
  });

  describe('canHandle', () => {
    it('should handle PLAYER node type', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.PLAYER)).toBe(true);
    });

    it('should not handle other node types', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CHARACTER)).toBe(false);
      expect(handler.canHandle(FORGE_NODE_TYPE.CONDITIONAL)).toBe(false);
    });
  });

  describe('exportNode', () => {
    it('should export simple choices', async () => {
      const node = createSimplePlayerNode('player1', [
        { text: 'Yes', nextNodeId: 'yes_node' },
        { text: 'No', nextNodeId: 'no_node' },
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: player1');
      expect(result).toContain('-> Yes');
      expect(result).toContain('<<jump yes_node>>');
      expect(result).toContain('-> No');
      expect(result).toContain('<<jump no_node>>');
    });

    it('should export choices with conditions', async () => {
      const node = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {
        choices: [
          {
            id: 'choice1',
            text: 'Use key',
            conditions: [
              { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
            ],
            nextNodeId: 'unlock_node',
          },
        ],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<if $has_key>>');
      expect(result).toContain('-> Use key');
      expect(result).toContain('<<jump unlock_node>>');
      expect(result).toContain('<<endif>>');
    });

    it('should export choices with setFlags', async () => {
      const node = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {
        choices: [
          {
            id: 'choice1',
            text: 'Accept',
            setFlags: ['quest_started'],
            nextNodeId: 'next',
          },
        ],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('-> Accept');
      expect(result).toContain('<<set $quest_started = true>>');
      expect(result).toContain('<<jump next>>');
    });

    it('should export multiple choices', async () => {
      const node = createSimplePlayerNode('player1', [
        { text: 'Option 1', nextNodeId: 'opt1' },
        { text: 'Option 2', nextNodeId: 'opt2' },
        { text: 'Option 3', nextNodeId: 'opt3' },
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('-> Option 1');
      expect(result).toContain('-> Option 2');
      expect(result).toContain('-> Option 3');
    });
  });

  describe('importNode', () => {
    it('should import simple choices', async () => {
      const yarnBlock = parseYarnNode(`title: player1
---
-> Yes
    <<jump yes_node>>
-> No
    <<jump no_node>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.id).toBe('player1');
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.PLAYER);
      expect(result.data?.choices?.length).toBe(2);
      expect(result.data?.choices?.[0].text).toBe('Yes');
      expect(result.data?.choices?.[0].nextNodeId).toBe('yes_node');
      expect(result.data?.choices?.[1].text).toBe('No');
      expect(result.data?.choices?.[1].nextNodeId).toBe('no_node');
    });

    it('should import choices with conditions', async () => {
      const yarnBlock = parseYarnNode(`title: player1
---
<<if $has_key>>
    -> Use key
        <<jump unlock_node>>
<<endif>>
-> Try to force
    <<jump force_node>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.choices?.length).toBeGreaterThan(0);
      const conditionalChoice = result.data?.choices?.find((c: { text: string }) => c.text === 'Use key');
      expect(conditionalChoice?.conditions).toBeDefined();
      expect(conditionalChoice?.conditions?.[0].flag).toBe('has_key');
    });

    it('should import choices with setFlags', async () => {
      const yarnBlock = parseYarnNode(`title: player1
---
-> Accept
    <<set $quest_started = true>>
    <<jump next>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      const choice = result.data?.choices?.[0];
      expect(choice?.setFlags).toContain('quest_started');
    });
  });

  describe('round-trip', () => {
    it('should round-trip simple choices', async () => {
      const original = createSimplePlayerNode('player1', [
        { text: 'Yes', nextNodeId: 'yes_node' },
        { text: 'No', nextNodeId: 'no_node' },
      ]);
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.choices?.length).toBe(original.data?.choices?.length);
      expect(imported.data?.choices?.[0].text).toBe(original.data?.choices?.[0].text);
      expect(imported.data?.choices?.[0].nextNodeId).toBe(original.data?.choices?.[0].nextNodeId);
    });

    it('should round-trip choices with conditions', async () => {
      const original = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {
        choices: [
          {
            id: 'choice1',
            text: 'Use key',
            conditions: [
              { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
            ],
            nextNodeId: 'unlock_node',
          },
        ],
      });
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.choices?.[0].conditions).toBeDefined();
      expect(imported.data?.choices?.[0].conditions?.[0].flag).toBe('has_key');
    });

    it('should round-trip choices with setFlags', async () => {
      const original = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {
        choices: [
          {
            id: 'choice1',
            text: 'Accept',
            setFlags: ['quest_started'],
            nextNodeId: 'next',
          },
        ],
      });
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.choices?.[0].setFlags).toEqual(original.data?.choices?.[0].setFlags);
    });
  });

  describe('edge cases', () => {
    it('should handle node without choices', async () => {
      const node = createMockForgeFlowNode('player1', FORGE_NODE_TYPE.PLAYER, {});
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: player1');
      expect(result).toContain('---');
    });

    it('should handle choice without nextNodeId', async () => {
      const node = createSimplePlayerNode('player1', [
        { text: 'Choice without next' },
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('-> Choice without next');
    });
  });
});
