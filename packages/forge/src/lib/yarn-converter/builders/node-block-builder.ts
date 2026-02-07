/**
 * Node Block Builder
 * 
 * Higher-level API for building complete Yarn node blocks.
 * Uses YarnTextBuilder internally for transparent text generation.
 */

import { YarnTextBuilder } from './yarn-text-builder';
import type { ForgeConditionalBlock, ForgeChoice } from '@magicborn/forge/types/forge-graph';
import { formatConditions } from '@magicborn/forge/lib/yarn-converter/utils/condition-formatter';
import { extractSetCommands } from '@magicborn/forge/lib/yarn-converter/utils/content-formatter';
import { CONDITION_BLOCK_TYPE } from '@magicborn/forge/lib/yarn-converter/constants';

/**
 * NodeBlockBuilder - Builds complete Yarn node blocks
 * 
 * Provides a convenient API for building a complete node:
 * - Start node (title + separator)
 * - Add content, conditionals, choices, flags, jumps
 * - End node (=== marker)
 */
export class NodeBlockBuilder {
  private builder: YarnTextBuilder;

  constructor(private nodeId: string) {
    this.builder = new YarnTextBuilder();
  }

  /**
   * Start the node block
   * Adds: "title: NodeName\n---\n"
   */
  startNode(): this {
    this.builder.addNodeTitle(this.nodeId);
    this.builder.addNodeSeparator();
    return this;
  }

  /**
   * Add dialogue content
   * Handles speaker prefix and extracts set commands
   */
  addContent(content: string, speaker?: string): this {
    // Extract set commands from content
    const setCommands = extractSetCommands(content);
    let cleanContent = content;
    
    // Remove set commands from content
    if (setCommands.length > 0) {
      setCommands.forEach(cmd => {
        cleanContent = cleanContent.replace(cmd, '').trim();
      });
    }

    // Add content line
    if (cleanContent) {
      this.builder.addLine(cleanContent, speaker);
    }

    // Add set commands after content
    if (setCommands.length > 0) {
      setCommands.forEach(cmd => {
        this.builder.addRaw(cmd + '\n');
      });
    }

    return this;
  }

  /**
   * Add conditional blocks (if/elseif/else)
   */
  addConditionalBlocks(blocks: ForgeConditionalBlock[]): this {
    blocks.forEach(block => {
      if (block.type === CONDITION_BLOCK_TYPE.IF || block.type === CONDITION_BLOCK_TYPE.ELSEIF) {
        // Format condition
        const conditionStr = block.condition ? formatConditions(block.condition) : '';
        this.builder.addConditionalBlock(block.type, conditionStr);
      } else if (block.type === CONDITION_BLOCK_TYPE.ELSE) {
        this.builder.addConditionalBlock('else');
      }

      // Add block content
      if (block.content) {
        this.addContent(block.content, block.speaker);
      }

      // Add block's nextNodeId if present
      if (block.nextNodeId) {
        this.builder.addJump(block.nextNodeId);
      }
    });

    // End conditional
    this.builder.addEndConditional();
    return this;
  }

  /**
   * Add player choices
   * Handles conditional choices and set commands
   */
  addChoices(choices: ForgeChoice[]): this {
    choices.forEach(choice => {
      // Add conditional wrapper if needed
      if (choice.conditions && choice.conditions.length > 0) {
        const conditionStr = formatConditions(choice.conditions);
        this.builder.addConditionalBlock('if', conditionStr);
      }

      // Extract set commands from choice text
      const setCommands = extractSetCommands(choice.text);
      let choiceText = choice.text;
      
      if (setCommands.length > 0) {
        setCommands.forEach(cmd => {
          choiceText = choiceText.replace(cmd, '').trim();
        });
      }

      // Add option
      this.builder.addOption(choiceText, 0);

      // Add set commands with indent
      if (setCommands.length > 0) {
        setCommands.forEach(cmd => {
          this.builder.addRaw('    ' + cmd + '\n');
        });
      } else if (choice.setFlags?.length) {
        choice.setFlags.forEach(flag => {
          this.builder.addSetCommand(flag, true, 1);
        });
      }

      // Add jump if present
      if (choice.nextNodeId) {
        this.builder.addJump(choice.nextNodeId, 1);
      }

      // End conditional if needed
      if (choice.conditions && choice.conditions.length > 0) {
        this.builder.addEndConditional();
      }
    });

    return this;
  }

  /**
   * Add flags as set commands
   */
  addFlags(flags: string[]): this {
    flags.forEach(flag => {
      this.builder.addSetCommand(flag, true);
    });
    return this;
  }

  /**
   * Add next node jump
   */
  addNextNode(nextNodeId: string): this {
    this.builder.addJump(nextNodeId);
    return this;
  }

  /**
   * End the node block
   * Adds: "===\n\n"
   * Returns the complete node block as a string
   */
  endNode(): string {
    this.builder.addNodeEnd();
    return this.builder.build();
  }

  /**
   * Get the internal builder (for advanced use cases)
   */
  getBuilder(): YarnTextBuilder {
    return this.builder;
  }
}
