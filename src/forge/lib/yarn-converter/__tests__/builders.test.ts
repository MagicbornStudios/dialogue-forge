/**
 * Tests for Yarn Converter Builders
 * 
 * Tests YarnTextBuilder and NodeBlockBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import { NodeBlockBuilder } from '../builders/node-block-builder';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@/forge/types/constants';

describe('YarnTextBuilder', () => {
  let builder: YarnTextBuilder;

  beforeEach(() => {
    builder = new YarnTextBuilder();
  });

  describe('addNodeTitle', () => {
    it('should add node title', () => {
      builder.addNodeTitle('test_node');
      expect(builder.build()).toBe('title: test_node\n');
    });
  });

  describe('addNodeSeparator', () => {
    it('should add node separator', () => {
      builder.addNodeSeparator();
      expect(builder.build()).toBe('---\n');
    });
  });

  describe('addLine', () => {
    it('should add line without speaker', () => {
      builder.addLine('Hello, world!');
      expect(builder.build()).toBe('Hello, world!\n');
    });

    it('should add line with speaker', () => {
      builder.addLine('Hello, world!', 'NPC');
      expect(builder.build()).toBe('NPC: Hello, world!\n');
    });

    it('should handle multiline content with speaker', () => {
      builder.addLine('Line 1\nLine 2', 'NPC');
      expect(builder.build()).toBe('NPC: Line 1\nNPC: Line 2\n');
    });
  });

  describe('addOption', () => {
    it('should add option without indent', () => {
      builder.addOption('Yes');
      expect(builder.build()).toBe('-> Yes\n');
    });

    it('should add option with indent', () => {
      builder.addOption('Yes', 1);
      expect(builder.build()).toBe('    -> Yes\n');
    });
  });

  describe('addCommand', () => {
    it('should add command without args', () => {
      builder.addCommand('command');
      expect(builder.build()).toBe('<<command>>\n');
    });

    it('should add command with args', () => {
      builder.addCommand('command', 'args');
      expect(builder.build()).toBe('<<command args>>\n');
    });
  });

  describe('addConditionalBlock', () => {
    it('should add if block', () => {
      builder.addConditionalBlock('if', '$flag');
      expect(builder.build()).toBe('<<if $flag>>\n');
    });

    it('should add elseif block', () => {
      builder.addConditionalBlock('elseif', '$other');
      expect(builder.build()).toBe('<<elseif $other>>\n');
    });

    it('should add else block', () => {
      builder.addConditionalBlock('else');
      expect(builder.build()).toBe('<<else>>\n');
    });
  });

  describe('addEndConditional', () => {
    it('should add endif', () => {
      builder.addEndConditional();
      expect(builder.build()).toBe('<<endif>>\n');
    });
  });

  describe('addJump', () => {
    it('should add jump without indent', () => {
      builder.addJump('target_node');
      expect(builder.build()).toBe('<<jump target_node>>\n');
    });

    it('should add jump with indent', () => {
      builder.addJump('target_node', 1);
      expect(builder.build()).toBe('    <<jump target_node>>\n');
    });
  });

  describe('addSetCommand', () => {
    it('should add set command with boolean', () => {
      builder.addSetCommand('flag', true);
      expect(builder.build()).toBe('<<set $flag = true>>\n');
    });

    it('should add set command with number', () => {
      builder.addSetCommand('count', 5);
      expect(builder.build()).toBe('<<set $count = 5>>\n');
    });

    it('should add set command with string', () => {
      builder.addSetCommand('name', 'Alice');
      expect(builder.build()).toBe('<<set $name = "Alice">>\n');
    });

    it('should add set command with indent', () => {
      builder.addSetCommand('flag', true, 1);
      expect(builder.build()).toBe('    <<set $flag = true>>\n');
    });
  });

  describe('addNodeEnd', () => {
    it('should add node end marker', () => {
      builder.addNodeEnd();
      expect(builder.build()).toBe('===\n\n');
    });
  });

  describe('addRaw', () => {
    it('should add raw text', () => {
      builder.addRaw('raw text');
      expect(builder.build()).toBe('raw text');
    });
  });

  describe('build', () => {
    it('should build complete node', () => {
      builder
        .addNodeTitle('test')
        .addNodeSeparator()
        .addLine('Hello!', 'NPC')
        .addNodeEnd();
      
      const result = builder.build();
      expect(result).toBe('title: test\n---\nNPC: Hello!\n===\n\n');
    });
  });

  describe('clear', () => {
    it('should clear all lines', () => {
      builder.addLine('test');
      builder.clear();
      expect(builder.build()).toBe('');
    });
  });
});

describe('NodeBlockBuilder', () => {
  describe('startNode', () => {
    it('should start node with title and separator', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode();
      const result = blockBuilder.endNode();
      expect(result).toContain('title: test\n');
      expect(result).toContain('---\n');
    });
  });

  describe('addContent', () => {
    it('should add content without speaker', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addContent('Hello!');
      const result = blockBuilder.endNode();
      expect(result).toContain('Hello!\n');
    });

    it('should add content with speaker', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addContent('Hello!', 'NPC');
      const result = blockBuilder.endNode();
      expect(result).toContain('NPC: Hello!\n');
    });

    it('should extract and preserve set commands', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addContent('Hello! <<set $flag = true>>');
      const result = blockBuilder.endNode();
      expect(result).toContain('Hello!\n');
      expect(result).toContain('<<set $flag = true>>');
    });
  });

  describe('addConditionalBlocks', () => {
    it('should add if block', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addConditionalBlocks([
        {
          id: 'block1',
          type: 'if',
          condition: [
            { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
          ],
          content: 'Quest active!',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('<<if $quest>>');
      expect(result).toContain('Quest active!');
      expect(result).toContain('<<endif>>');
    });

    it('should add if/elseif/else blocks', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addConditionalBlocks([
        {
          id: 'block1',
          type: 'if',
          condition: [
            { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
          ],
          content: 'Door unlocked!',
        },
        {
          id: 'block2',
          type: 'elseif',
          condition: [
            { flag: 'has_lockpick', operator: CONDITION_OPERATOR.IS_SET },
          ],
          content: 'Can pick lock!',
        },
        {
          id: 'block3',
          type: 'else',
          content: 'Door locked!',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('<<if $has_key>>');
      expect(result).toContain('Door unlocked!');
      expect(result).toContain('<<elseif $has_lockpick>>');
      expect(result).toContain('Can pick lock!');
      expect(result).toContain('<<else>>');
      expect(result).toContain('Door locked!');
      expect(result).toContain('<<endif>>');
    });

    it('should add nextNodeId to conditional blocks', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addConditionalBlocks([
        {
          id: 'block1',
          type: 'if',
          condition: [
            { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
          ],
          content: 'Quest active!',
          nextNodeId: 'next_node',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('<<jump next_node>>');
    });
  });

  describe('addChoices', () => {
    it('should add simple choices', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addChoices([
        {
          id: 'choice1',
          text: 'Yes',
          nextNodeId: 'yes_node',
        },
        {
          id: 'choice2',
          text: 'No',
          nextNodeId: 'no_node',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('-> Yes');
      expect(result).toContain('<<jump yes_node>>');
      expect(result).toContain('-> No');
      expect(result).toContain('<<jump no_node>>');
    });

    it('should add conditional choices', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addChoices([
        {
          id: 'choice1',
          text: 'Use key',
          conditions: [
            { flag: 'has_key', operator: CONDITION_OPERATOR.IS_SET },
          ],
          nextNodeId: 'unlock_node',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('<<if $has_key>>');
      expect(result).toContain('-> Use key');
      expect(result).toContain('<<jump unlock_node>>');
      expect(result).toContain('<<endif>>');
    });

    it('should add choices with setFlags', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addChoices([
        {
          id: 'choice1',
          text: 'Accept',
          setFlags: ['quest_started'],
          nextNodeId: 'next',
        },
      ]);
      const result = blockBuilder.endNode();
      expect(result).toContain('-> Accept');
      expect(result).toContain('<<set $quest_started = true>>');
      expect(result).toContain('<<jump next>>');
    });
  });

  describe('addFlags', () => {
    it('should add flags as set commands', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addFlags(['flag1', 'flag2']);
      const result = blockBuilder.endNode();
      expect(result).toContain('<<set $flag1 = true>>');
      expect(result).toContain('<<set $flag2 = true>>');
    });
  });

  describe('addNextNode', () => {
    it('should add next node jump', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode().addNextNode('next_node');
      const result = blockBuilder.endNode();
      expect(result).toContain('<<jump next_node>>');
    });
  });

  describe('endNode', () => {
    it('should end node with === marker', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder.startNode();
      const result = blockBuilder.endNode();
      expect(result).toContain('===\n\n');
    });

    it('should build complete node', () => {
      const blockBuilder = new NodeBlockBuilder('test');
      blockBuilder
        .startNode()
        .addContent('Hello!', 'NPC')
        .addNextNode('next');
      
      const result = blockBuilder.endNode();
      expect(result).toContain('title: test');
      expect(result).toContain('---');
      expect(result).toContain('NPC: Hello!');
      expect(result).toContain('<<jump next>>');
      expect(result).toContain('===');
    });
  });
});
