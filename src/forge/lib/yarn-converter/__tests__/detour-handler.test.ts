/**
 * Tests for DetourHandler
 * 
 * Tests export with mocked workspace context and return node handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DetourHandler } from '../handlers/detour-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import {
  createMockForgeFlowNode,
  createMockYarnConverterContext,
  createMockAdapter,
  createMockForgeGraphDoc,
} from './helpers';
import { FORGE_NODE_TYPE, FORGE_STORYLET_CALL_MODE } from '@/forge/types/forge-graph';

describe('DetourHandler', () => {
  let handler: DetourHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new DetourHandler();
    builder = new YarnTextBuilder();
  });

  describe('canHandle', () => {
    it('should handle DETOUR node type', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.DETOUR)).toBe(true);
    });

    it('should not handle other node types', () => {
      expect(handler.canHandle(FORGE_NODE_TYPE.CHARACTER)).toBe(false);
      expect(handler.canHandle(FORGE_NODE_TYPE.STORYLET)).toBe(false);
    });
  });

  describe('exportNode', () => {
    it('should export detour without storyletCall (fallback)', async () => {
      const node = createMockForgeFlowNode('detour1', FORGE_NODE_TYPE.DETOUR, {
        content: 'Regular content',
        speaker: 'NPC',
      });
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: detour1');
      expect(result).toContain('NPC: Regular content');
    });

    it('should export detour with return node', async () => {
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

      const node = createMockForgeFlowNode('detour1', FORGE_NODE_TYPE.DETOUR, {
        storyletCall: {
          mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
          targetGraphId: 1,
          targetStartNodeId: 'ref_node1',
          returnNodeId: 'return_node',
          returnGraphId: 0,
        },
      });

      const result = await handler.exportNode(node, builder, context);
      
      expect(result).toContain('title: detour1');
      expect(result).toContain('<<jump ref_node1>>');
    });

    it('should detect circular references', async () => {
      const context = createMockYarnConverterContext({
        visitedGraphs: new Set([1]),
      });

      const node = createMockForgeFlowNode('detour1', FORGE_NODE_TYPE.DETOUR, {
        storyletCall: {
          mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
          targetGraphId: 1,
        },
      });

      const result = await handler.exportNode(node, builder, context);
      
      expect(result).toContain('[Detour: 1]');
    });
  });

  describe('importNode', () => {
    it('should import detour node', async () => {
      const yarnBlock = {
        nodeId: 'detour1',
        lines: ['NPC: This is a detour'],
        rawContent: 'NPC: This is a detour',
      };

      const result = await handler.importNode(yarnBlock);
      
      expect(result.id).toBe('detour1');
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.DETOUR);
      expect(result.data?.content).toContain('This is a detour');
    });
  });
});
