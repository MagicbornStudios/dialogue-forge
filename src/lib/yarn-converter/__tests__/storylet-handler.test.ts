/**
 * Tests for StoryletHandler
 * 
 * Tests export with mocked workspace context and graph resolution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StoryletHandler } from '../handlers/storylet-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import {
  createMockForgeFlowNode,
  createMockYarnConverterContext,
  createMockAdapter,
  createMockForgeGraphDoc,
} from './helpers';
import { FORGE_NODE_TYPE, FORGE_STORYLET_CALL_MODE } from '@/src/types/forge/forge-graph';

describe('StoryletHandler', () => {
  let handler: StoryletHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new StoryletHandler();
    builder = new YarnTextBuilder();
  });

  describe('canHandle', () => {
    it('should handle STORYLET node type', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.STORYLET)).toBe(true);
    });

    it('should not handle other node types', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CHARACTER)).toBe(false);
      expect(handler.canHandle(FORGE_NODE_TYPE.PLAYER)).toBe(false);
    });
  });

  describe('exportNode', () => {
    it('should export storylet without storyletCall (fallback)', async () => {
      const node = createMockForgeFlowNode('storylet1', FORGE_NODE_TYPE.STORYLET, {
        content: 'Regular content',
        speaker: 'NPC',
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: storylet1');
      expect(result).toContain('NPC: Regular content');
    });

    it('should export storylet with storyletCall and graph resolution', async () => {
      const referencedGraph = createMockForgeGraphDoc('Referenced Graph', [
        createMockForgeFlowNode('ref_node1', FORGE_NODE_TYPE.CHARACTER, {
          content: 'Referenced content',
        }),
      ]);
      
      const adapter = createMockAdapter();
      adapter.setGraph(1, referencedGraph);
      
      const context = createMockYarnConverterContext({
        adapter,
        cache: new Map([['1', referencedGraph]]),
      });

      const node = createMockForgeFlowNode('storylet1', FORGE_NODE_TYPE.STORYLET, {
        storyletCall: {
          mode: FORGE_STORYLET_CALL_MODE.JUMP,
          targetGraphId: 1,
          targetStartNodeId: 'ref_node1',
        },
      });

      const result = await handler.exportNode(node, builder, context);
      
      expect(result).toContain('title: storylet1');
      expect(result).toContain('<<jump ref_node1>>');
    });

    it('should detect circular references', async () => {
      const context = createMockYarnConverterContext({
        visitedGraphs: new Set([1]),
      });

      const node = createMockForgeFlowNode('storylet1', FORGE_NODE_TYPE.STORYLET, {
        storyletCall: {
          mode: FORGE_STORYLET_CALL_MODE.JUMP,
          targetGraphId: 1,
        },
      });

      const result = await handler.exportNode(node, builder, context);
      
      expect(result).toContain('[Storylet: 1]');
    });

    it('should handle missing graph gracefully', async () => {
      const context = createMockYarnConverterContext({
        adapter: createMockAdapter(), // Empty adapter
      });

      const node = createMockForgeFlowNode('storylet1', FORGE_NODE_TYPE.STORYLET, {
        storyletCall: {
          mode: FORGE_STORYLET_CALL_MODE.JUMP,
          targetGraphId: 999, // Non-existent graph
        },
      });

      await expect(handler.exportNode(node, builder, context)).rejects.toThrow();
    });
  });

  describe('importNode', () => {
    it('should import storylet node', async () => {
      const yarnBlock = {
        nodeId: 'storylet1',
        lines: ['NPC: This is a storylet'],
        rawContent: 'NPC: This is a storylet',
      };

      const result = await handler.importNode(yarnBlock);
      
      expect(result.id).toBe('storylet1');
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.STORYLET);
      expect(result.data?.content).toContain('This is a storylet');
    });
  });
});
