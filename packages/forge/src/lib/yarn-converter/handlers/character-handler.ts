/**
 * Character Node Handler
 * 
 * Handles CHARACTER nodes (formerly NPC nodes).
 * Exports/imports dialogue content, speaker, conditional blocks, flags, and next node.
 */

import { BaseNodeHandler } from '@magicborn/forge/lib/yarn-converter/handlers/base-handler';
import { NodeBlockBuilder } from '@magicborn/forge/lib/yarn-converter/builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock, YarnTextBuilder } from '@magicborn/forge/lib/yarn-converter/types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { removeSetCommands, extractSetCommands } from '@magicborn/forge/lib/yarn-converter/utils/content-formatter';
import { parseCondition } from '@magicborn/forge/lib/yarn-converter/utils/condition-parser';
import { CONDITION_BLOCK_TYPE } from '@magicborn/forge/lib/yarn-converter/constants';

export class CharacterHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.CHARACTER;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');

    blockBuilder.startNode();

    // Export conditional blocks if present
    if (data.conditionalBlocks && data.conditionalBlocks.length > 0) {
      blockBuilder.addConditionalBlocks(data.conditionalBlocks);
    } else {
      // Regular content (no conditionals)
      const content = data.content ?? '';
      const cleanContent = removeSetCommands(content);
      blockBuilder.addContent(cleanContent, data.speaker);
    }

    // Export flags as Yarn variable commands
    // Check if content contains variable operations first
    const setCommands = data.content ? extractSetCommands(data.content) : [];
    if (setCommands.length > 0) {
      // Set commands already extracted and added in addContent
    } else if (data.setFlags?.length) {
      // Fallback: export as boolean flags
      blockBuilder.addFlags(data.setFlags);
    }

    // Export next node jump
    if (data.defaultNextNodeId) {
      blockBuilder.addNextNode(data.defaultNextNodeId);
    }

    return blockBuilder.endNode();
  }

  async importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode> {
    const lines = yarnBlock.lines;
    let dialogueContent = '';
    let speaker = '';
    const setFlags: string[] = [];
    let nextNodeId = '';
    const conditionalBlocks: any[] = [];

    // Track conditional block state
    let inConditionalBlock = false;
    let currentBlock: any = null;
    let blockContent: string[] = [];
    let blockSpeaker: string = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('<<jump')) {
        const jumpMatch = trimmed.match(/<<jump\s+(\S+)>>/);
        if (jumpMatch) {
          nextNodeId = jumpMatch[1];
        }
      } else if (trimmed.startsWith('<<set')) {
        const setMatch = trimmed.match(/<<set\s+\$(\w+)\s*([+\-*/=]+)\s*(.+?)>>/);
        if (setMatch) {
          const varName = setMatch[1];
          setFlags.push(varName);
          if (!dialogueContent.includes(trimmed)) {
            dialogueContent += trimmed + '\n';
          }
        }
      } else if (trimmed.startsWith('<<if')) {
        if (inConditionalBlock && currentBlock) {
          currentBlock.content = blockContent.join('\n').trim();
          currentBlock.speaker = blockSpeaker || undefined;
          conditionalBlocks.push(currentBlock);
        }
        inConditionalBlock = true;
        const conditionStr = trimmed.replace(/<<if\s+/, '').replace(/>>/, '').trim();
        currentBlock = {
          id: `block_${Date.now()}_${conditionalBlocks.length}`,
          type: CONDITION_BLOCK_TYPE.IF,
          condition: parseCondition(conditionStr),
          content: '',
          speaker: undefined,
        };
        blockContent = [];
        blockSpeaker = '';
      } else if (trimmed.startsWith('<<elseif')) {
        if (currentBlock) {
          currentBlock.content = blockContent.join('\n').trim();
          currentBlock.speaker = blockSpeaker || undefined;
          conditionalBlocks.push(currentBlock);
        }
        const conditionStr = trimmed.replace(/<<elseif\s+/, '').replace(/>>/, '').trim();
        currentBlock = {
          id: `block_${Date.now()}_${conditionalBlocks.length}`,
          type: CONDITION_BLOCK_TYPE.ELSEIF,
          condition: parseCondition(conditionStr),
          content: '',
          speaker: undefined,
        };
        blockContent = [];
        blockSpeaker = '';
      } else if (trimmed.startsWith('<<else')) {
        if (currentBlock) {
          currentBlock.content = blockContent.join('\n').trim();
          currentBlock.speaker = blockSpeaker || undefined;
          conditionalBlocks.push(currentBlock);
        }
        currentBlock = {
          id: `block_${Date.now()}_${conditionalBlocks.length}`,
          type: CONDITION_BLOCK_TYPE.ELSE,
          condition: undefined,
          content: '',
          speaker: undefined,
        };
        blockContent = [];
        blockSpeaker = '';
      } else if (trimmed.startsWith('<<endif')) {
        if (currentBlock) {
          currentBlock.content = blockContent.join('\n').trim();
          currentBlock.speaker = blockSpeaker || undefined;
          conditionalBlocks.push(currentBlock);
          inConditionalBlock = false;
          currentBlock = null;
          blockContent = [];
          blockSpeaker = '';
        }
      } else if (inConditionalBlock) {
        if (trimmed.includes(':') && !trimmed.startsWith('<<')) {
          const [spk, ...rest] = trimmed.split(':');
          blockSpeaker = spk.trim();
          blockContent.push(rest.join(':').trim());
        } else if (!trimmed.startsWith('<<')) {
          blockContent.push(trimmed);
        }
      } else if (trimmed.includes(':') && !trimmed.startsWith('<<')) {
        const [spk, ...rest] = trimmed.split(':');
        speaker = spk.trim();
        dialogueContent += rest.join(':').trim() + '\n';
      } else if (!trimmed.startsWith('<<')) {
        dialogueContent += trimmed + '\n';
      }
    });

    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CHARACTER,
      speaker: speaker || undefined,
      content: dialogueContent.trim(),
      defaultNextNodeId: nextNodeId || undefined,
      setFlags: setFlags.length > 0 ? setFlags : undefined,
      conditionalBlocks: conditionalBlocks.length > 0 ? conditionalBlocks : undefined,
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CHARACTER,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
