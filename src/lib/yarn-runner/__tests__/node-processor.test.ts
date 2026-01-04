import { describe, it, expect, beforeEach } from 'vitest';
import { processNode, isValidNextNode, ProcessedNodeResult } from '../node-processor';
import { VariableManager } from '../variable-manager';
import { DialogueNode, DialogueTree } from '../../../types';

describe('node-processor', () => {
  let variableManager: VariableManager;
  let availableNodes: Record<string, DialogueNode>;

  beforeEach(() => {
    variableManager = new VariableManager({ flag1: true, flag2: 42 });
    availableNodes = {
      node1: {
        id: 'node1',
        type: 'npc',
        content: 'Hello',
        x: 0,
        y: 0,
      },
      node2: {
        id: 'node2',
        type: 'npc',
        content: 'World',
        x: 0,
        y: 0,
      },
    };
  });

  describe('processNode', () => {
    describe('NPC nodes', () => {
      it('should process simple NPC node', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'npc',
          content: 'Hello world',
          speaker: 'NPC',
          nextNodeId: 'node1',
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.content).toBe('Hello world');
        expect(result.speaker).toBe('NPC');
        expect(result.nextNodeId).toBe('node1');
        expect(result.isEnd).toBe(false);
        expect(result.isPlayerChoice).toBe(false);
      });

      it('should mark as end when no nextNodeId', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'npc',
          content: 'End',
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.isEnd).toBe(true);
        expect(result.nextNodeId).toBeUndefined();
      });
    });

    describe('Player nodes', () => {
      it('should return choices for player node', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'player',
          content: '',
          choices: [
            {
              id: 'c1',
              text: 'Choice 1',
              nextNodeId: 'node1',
            },
            {
              id: 'c2',
              text: 'Choice 2',
              nextNodeId: 'node2',
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.isPlayerChoice).toBe(true);
        expect(result.choices).toHaveLength(2);
        expect(result.choices?.[0].text).toBe('Choice 1');
      });

      it('should filter choices based on conditions', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'player',
          content: '',
          choices: [
            {
              id: 'c1',
              text: 'Choice 1',
              nextNodeId: 'node1',
              conditions: [
                { flag: 'flag1', operator: 'is_set' },
              ],
            },
            {
              id: 'c2',
              text: 'Choice 2',
              nextNodeId: 'node2',
              conditions: [
                { flag: 'flag3', operator: 'is_set' },
              ],
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.choices).toHaveLength(1);
        expect(result.choices?.[0].text).toBe('Choice 1');
      });
    });

    describe('Conditional nodes', () => {
      it('should process conditional node with matching if block', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'conditional',
          content: '',
          conditionalBlocks: [
            {
              id: 'b1',
              type: 'if',
              condition: [{ flag: 'flag1', operator: 'is_set' }],
              content: 'If content',
              speaker: 'Speaker',
              nextNodeId: 'node1',
            },
            {
              id: 'b2',
              type: 'else',
              content: 'Else content',
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.content).toBe('If content');
        expect(result.speaker).toBe('Speaker');
        expect(result.nextNodeId).toBe('node1');
      });

      it('should process conditional node with matching elseif block', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'conditional',
          content: '',
          conditionalBlocks: [
            {
              id: 'b1',
              type: 'if',
              condition: [{ flag: 'flag3', operator: 'is_set' }],
              content: 'If content',
            },
            {
              id: 'b2',
              type: 'elseif',
              condition: [{ flag: 'flag1', operator: 'is_set' }],
              content: 'Elseif content',
            },
            {
              id: 'b3',
              type: 'else',
              content: 'Else content',
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.content).toBe('Elseif content');
      });

      it('should process conditional node with else block when no conditions match', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'conditional',
          content: '',
          conditionalBlocks: [
            {
              id: 'b1',
              type: 'if',
              condition: [{ flag: 'flag3', operator: 'is_set' }],
              content: 'If content',
            },
            {
              id: 'b2',
              type: 'else',
              content: 'Else content',
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.content).toBe('Else content');
      });

      it('should return end when no block matches', () => {
        const node: DialogueNode = {
          id: 'test',
          type: 'conditional',
          content: '',
          conditionalBlocks: [
            {
              id: 'b1',
              type: 'if',
              condition: [{ flag: 'flag3', operator: 'is_set' }],
              content: 'If content',
            },
          ],
          x: 0,
          y: 0,
        };
        const result = processNode(node, variableManager);
        expect(result.isEnd).toBe(true);
        expect(result.content).toBe('');
      });
    });
  });

  describe('isValidNextNode', () => {
    it('should return true for valid node ID', () => {
      expect(isValidNextNode('node1', availableNodes)).toBe(true);
    });

    it('should return false for undefined', () => {
      expect(isValidNextNode(undefined, availableNodes)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidNextNode('', availableNodes)).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isValidNextNode('   ', availableNodes)).toBe(false);
    });

    it('should return false for non-existent node', () => {
      expect(isValidNextNode('nonexistent', availableNodes)).toBe(false);
    });
  });
});





