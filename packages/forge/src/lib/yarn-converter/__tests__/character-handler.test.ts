/**
 * Tests for CharacterHandler
 * 
 * Comprehensive tests for export, import, and round-trip conversion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterHandler } from '../handlers/character-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import {
  createMockForgeFlowNode,
  createMockYarnConverterContext,
  parseYarnNode,
  normalizeYarn,
  createSimpleCharacterNode,
} from './helpers';
import { FORGE_NODE_TYPE, FORGE_CONDITIONAL_BLOCK_TYPE } from '@magicborn/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@magicborn/forge/types/constants';

describe('CharacterHandler', () => {
  let handler: CharacterHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new CharacterHandler();
    builder = new YarnTextBuilder();
  });

  describe('canHandle', () => {
    it('should handle CHARACTER node type', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CHARACTER)).toBe(true);
    });

    it('should not handle other node types', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.PLAYER)).toBe(false);
      expect(handler.canHandle(FORGE_NODE_TYPE.CONDITIONAL)).toBe(false);
    });
  });

  describe('exportNode', () => {
    it('should export simple dialogue', async () => {
      const node = createSimpleCharacterNode('char1', 'Hello, world!');
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: char1');
      expect(result).toContain('---');
      expect(result).toContain('Hello, world!');
      expect(result).toContain('===');
    });

    it('should export dialogue with speaker', async () => {
      const node = createSimpleCharacterNode('char1', 'Hello, world!', 'NPC');
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('NPC: Hello, world!');
    });

    it('should export dialogue with nextNodeId', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        content: 'Hello!',
        defaultNextNodeId: 'next_node',
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<jump next_node>>');
    });

    it('should export dialogue with setFlags', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        content: 'Hello!',
        setFlags: ['flag1', 'flag2'],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<set $flag1 = true>>');
      expect(result).toContain('<<set $flag2 = true>>');
    });

    it('should export multiline content', async () => {
      const node = createSimpleCharacterNode('char1', 'Line 1\nLine 2\nLine 3', 'NPC');
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('NPC: Line 1');
      expect(result).toContain('NPC: Line 2');
      expect(result).toContain('NPC: Line 3');
    });

    it('should export conditional blocks', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        conditionalBlocks: [
          {
            id: 'block1',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [
              { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Door unlocked!',
          },
          {
            id: 'block2',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.ELSE,
            content: 'Door locked!',
          },
        ],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<if $has_key>>');
      expect(result).toContain('Door unlocked!');
      expect(result).toContain('<<else>>');
      expect(result).toContain('Door locked!');
      expect(result).toContain('<<endif>>');
    });

    it('should export conditional blocks with speakers', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
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

    it('should handle empty content', async () => {
      const node = createSimpleCharacterNode('char1', '');
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: char1');
      expect(result).toContain('---');
    });
  });

  describe('importNode', () => {
    it('should import simple dialogue', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
NPC: Hello, world!
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.id).toBe('char1');
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.CHARACTER);
      expect(result.data?.content).toBe('Hello, world!');
      expect(result.data?.speaker).toBe('NPC');
    });

    it('should import dialogue without speaker', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
Hello, world!
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.content).toBe('Hello, world!');
      expect(result.data?.speaker).toBeUndefined();
    });

    it('should import dialogue with nextNodeId', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
NPC: Hello!
<<jump next_node>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.defaultNextNodeId).toBe('next_node');
    });

    it('should import dialogue with setFlags', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
NPC: Hello!
<<set $flag1 = true>>
<<set $flag2 = true>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.setFlags).toContain('flag1');
      expect(result.data?.setFlags).toContain('flag2');
    });

    it('should import conditional blocks', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
<<if $has_key>>
    Guard: Door unlocked!
<<else>>
    Guard: Door locked!
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.conditionalBlocks).toBeDefined();
      expect(result.data?.conditionalBlocks?.length).toBe(2);
      expect(result.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(result.data?.conditionalBlocks?.[0].content).toContain('Door unlocked!');
      expect(result.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
      expect(result.data?.conditionalBlocks?.[1].content).toContain('Door locked!');
    });

    it('should import if/elseif/else blocks', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
<<if $has_key>>
    Guard: Door unlocked!
<<elseif $has_lockpick>>
    Guard: Can pick lock!
<<else>>
    Guard: Door locked!
<<endif>>
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.conditionalBlocks?.length).toBe(3);
      expect(result.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(result.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE_IF);
      expect(result.data?.conditionalBlocks?.[2].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });

    it('should import multiline content', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
NPC: Line 1
NPC: Line 2
NPC: Line 3
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.content).toContain('Line 1');
      expect(result.data?.content).toContain('Line 2');
      expect(result.data?.content).toContain('Line 3');
    });
  });

  describe('round-trip', () => {
    it('should round-trip simple dialogue', async () => {
      const original = createSimpleCharacterNode('char1', 'Hello, world!', 'NPC');
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.content).toBe(original.data?.content);
      expect(imported.data?.speaker).toBe(original.data?.speaker);
    });

    it('should round-trip dialogue with nextNodeId', async () => {
      const original = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        content: 'Hello!',
        defaultNextNodeId: 'next_node',
      });
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.defaultNextNodeId).toBe(original.data?.defaultNextNodeId);
    });

    it('should round-trip dialogue with setFlags', async () => {
      const original = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        content: 'Hello!',
        setFlags: ['flag1', 'flag2'],
      });
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.setFlags).toEqual(original.data?.setFlags);
    });

    it('should round-trip conditional blocks', async () => {
      const original = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        conditionalBlocks: [
          {
            id: 'block1',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
            condition: [
              { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
            ],
            content: 'Door unlocked!',
            speaker: 'Guard',
          },
          {
            id: 'block2',
            type: FORGE_CONDITIONAL_BLOCK_TYPE.ELSE,
            content: 'Door locked!',
            speaker: 'Guard',
          },
        ],
      });
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.conditionalBlocks?.length).toBe(2);
      expect(imported.data?.conditionalBlocks?.[0].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.IF);
      expect(imported.data?.conditionalBlocks?.[1].type).toBe(FORGE_CONDITIONAL_BLOCK_TYPE.ELSE);
    });

    it('should round-trip multiline content', async () => {
      const original = createSimpleCharacterNode('char1', 'Line 1\nLine 2\nLine 3', 'NPC');
      const exported = await handler.exportNode(original, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.content).toContain('Line 1');
      expect(imported.data?.content).toContain('Line 2');
      expect(imported.data?.content).toContain('Line 3');
    });
  });

  describe('edge cases', () => {
    it('should handle node without content', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {});
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: char1');
      expect(result).toContain('---');
    });

    it('should handle node with only setFlags', async () => {
      const node = createMockForgeFlowNode('char1', FORGE_NODE_TYPE.CHARACTER, {
        setFlags: ['flag1'],
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('<<set $flag1 = true>>');
    });

    it('should handle empty Yarn block', async () => {
      const yarnBlock = parseYarnNode(`title: char1
---
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.content).toBe('');
    });
  });
});
