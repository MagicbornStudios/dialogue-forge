/**
 * Tests for ConditionalHandler
 * 
 * Comprehensive tests for export, import, and round-trip conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConditionalHandler } from '../handlers/conditional-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import {
  createMockForgeFlowNode,
  parseYarnNode,
  createSimpleConditionalNode,
} from './helpers';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@/forge/types/constants';
import { FORGE_CONDITIONAL_BLOCK_TYPE } from '@/forge/types/forge-graph';

describe('ConditionalHandler', () => {
  let handler: ConditionalHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new ConditionalHandler();
    builder = new YarnTextBuilder();
  });

  describe('canHandle', () => {
    it('should handle CONDITIONAL node type', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CONDITIONAL)).toBe(true);
    });

    it('should not handle other node types', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CHARACTER)).toBe(false);
      expect(handler.canHandle(FORGE_NODE_TYPE.PLAYER)).toBe(false);
    });
  });

  describe('exportNode', () => {
    it('should export if block', async () => {
      const node = createSimpleConditionalNode('cond1', [
        {
          type: 'if',
          condition: [
            { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
          ],
          content: 'Quest active!',
        },
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<if $quest>>');
      expect(result).toContain('Quest active!');
      expect(result).toContain('<<endif>>');
    });

    it('should export if/else blocks', async () => {
      const node = createSimpleConditionalNode('cond1', [
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
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<if $has_key>>');
      expect(result).toContain('Door unlocked!');
      expect(result).toContain('<<else>>');
      expect(result).toContain('Door locked!');
      expect(result).toContain('<<endif>>');
    });

    it('should export if/elseif/else blocks', async () => {
      const node = createSimpleConditionalNode('cond1', [
        {
          type: 'if',
          condition: [
            { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
          ],
          content: 'Can afford sword!',
        },
        {
          type: 'elseif',
          condition: [
            { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 },
          ],
          content: 'Can afford potion!',
        },
        {
          type: 'else',
          content: 'Not enough gold!',
        },
      ]);
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<if $gold > 100>>');
      expect(result).toContain('Can afford sword!');
      expect(result).toContain('<<elseif $gold > 50>>');
      expect(result).toContain('Can afford potion!');
      expect(result).toContain('<<else>>');
      expect(result).toContain('Not enough gold!');
      expect(result).toContain('<<endif>>');
    });

    it('should export blocks with speakers', async () => {
      const node = createMockForgeFlowNode('cond1', FORGE_NODE_TYPE.CONDITIONAL, {
        conditionalBlocks: [
          {
            id: 'block1',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [
              { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
            ],
            speaker: 'Guard',
            content: 'Quest active!',
          },
        ],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('Guard: Quest active!');
    });

    it('should export blocks with nextNodeId', async () => {
      const node = createMockForgeFlowNode('cond1', FORGE_NODE_TYPE.CONDITIONAL, {
        conditionalBlocks: [
          {
            id: 'block1',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [
              { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Quest active!',
            nextNodeId: 'next_node',
          },
        ],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<jump next_node>>');
    });

    it('should export blocks with setFlags', async () => {
      const node = createMockForgeFlowNode('cond1', FORGE_NODE_TYPE.CONDITIONAL, {
        conditionalBlocks: [
          {
            id: 'block1',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [
              { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Quest active!',
          },
        ],
        setFlags: ['flag1', 'flag2'],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<set $flag1 = true>>');
      expect(result).toContain('<<set $flag2 = true>>');
    });
  });

  describe('importNode', () => {
    it('should import if block', async () => {
      const yarnBlock = parseYarnNode(`title: cond1
---
<<if $quest>>
    Guard: Quest active!
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.id).toBe('cond1');
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.CONDITIONAL);
      expect(result.data?.conditionalBlocks?.length).toBe(1);
      expect(result.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(result.data?.conditionalBlocks?.[0].content).toContain('Quest active!');
    });

    it('should import if/else blocks', async () => {
      const yarnBlock = parseYarnNode(`title: cond1
---
<<if $has_key>>
    Guard: Door unlocked!
<<else>>
    Guard: Door locked!
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.conditionalBlocks?.length).toBe(2);
      expect(result.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(result.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });

    it('should import if/elseif/else blocks', async () => {
      const yarnBlock = parseYarnNode(`title: cond1
---
<<if $gold > 100>>
    Merchant: Can afford sword!
<<elseif $gold > 50>>
    Merchant: Can afford potion!
<<else>>
    Merchant: Not enough gold!
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.conditionalBlocks?.length).toBe(3);
      expect(result.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(result.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF);
      expect(result.data?.conditionalBlocks?.[2].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });

    it('should import blocks with nextNodeId', async () => {
      const yarnBlock = parseYarnNode(`title: cond1
---
<<if $quest>>
    Guard: Quest active!
    <<jump next_node>>
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.conditionalBlocks?.[0].nextNodeId).toBe('next_node');
    });
  });

  describe('round-trip', () => {
    it('should round-trip if/else blocks', async () => {
      const original = createSimpleConditionalNode('cond1', [
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
      ]);
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.conditionalBlocks?.length).toBe(2);
      expect(imported.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(imported.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });

    it('should round-trip if/elseif/else blocks', async () => {
      const original = createSimpleConditionalNode('cond1', [
        {
          type: 'if',
          condition: [
            { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
          ],
          content: 'Can afford sword!',
        },
        {
          type: 'elseif',
          condition: [
            { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 50 },
          ],
          content: 'Can afford potion!',
        },
        {
          type: 'else',
          content: 'Not enough gold!',
        },
      ]);
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.conditionalBlocks?.length).toBe(3);
      expect(imported.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(imported.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF);
      expect(imported.data?.conditionalBlocks?.[2].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });
  });

  describe('edge cases', () => {
    it('should handle node without conditional blocks', async () => {
      const node = createMockForgeFlowNode('cond1', FORGE_NODE_TYPE.CONDITIONAL, {});
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: cond1');
      expect(result).toContain('---');
    });
  });
});
