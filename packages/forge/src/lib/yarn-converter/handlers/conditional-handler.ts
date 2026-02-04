/**
 * Conditional Node Handler
 * 
 * Handles CONDITIONAL nodes.
 * Exports/imports conditional blocks (if/elseif/else) with conditions and content.
 */

import { BaseNodeHandler } from '@magicborn/forge/lib/yarn-converter/handlers/base-handler';
import { NodeBlockBuilder } from '@magicborn/forge/lib/yarn-converter/builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock, YarnTextBuilder } from '@magicborn/forge/lib/yarn-converter/types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { extractSetCommands } from '@magicborn/forge/lib/yarn-converter/utils/content-formatter';
import { parseCondition } from '@magicborn/forge/lib/yarn-converter/utils/condition-parser';
import { CONDITION_BLOCK_TYPE } from '@magicborn/forge/lib/yarn-converter';

export class ConditionalHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.CONDITIONAL;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');

    blockBuilder.startNode();

    // Export conditional blocks
    if (data.conditionalBlocks && data.conditionalBlocks.length > 0) {
      blockBuilder.addConditionalBlocks(data.conditionalBlocks);
    }

    // Export flags as Yarn variable commands
    const setCommands = data.content ? extractSetCommands(data.content) : [];
    if (setCommands.length > 0) {
      // Set commands already handled in conditional blocks
    } else if (data.setFlags?.length) {
      blockBuilder.addFlags(data.setFlags);
    }

    // Conditional nodes don't have a main nextNodeId (each block has its own)

    return blockBuilder.endNode();
  }

  async importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode> {
    const lines = yarnBlock.lines;
    const conditionalBlocks: any[] = [];
    const setFlags: string[] = [];

    let inConditionalBlock = false;
    let currentBlock: any = null;
    let blockContent: string[] = [];
    let blockSpeaker: string = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('<<set')) {
        const setMatch = trimmed.match(/<<set\s+\$(\w+)/);
        if (setMatch) {
          setFlags.push(setMatch[1]);
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
      } else if (trimmed.startsWith('<<jump')) {
        const jumpMatch = trimmed.match(/<<jump\s+(\S+)>>/);
        if (jumpMatch && currentBlock) {
          currentBlock.nextNodeId = jumpMatch[1];
        }
      } else if (inConditionalBlock) {
        if (trimmed.includes(':') && !trimmed.startsWith('<<')) {
          const [spk, ...rest] = trimmed.split(':');
          blockSpeaker = spk.trim();
          blockContent.push(rest.join(':').trim());
        } else if (!trimmed.startsWith('<<')) {
          blockContent.push(trimmed);
        }
      }
    });

    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CONDITIONAL,
      conditionalBlocks: conditionalBlocks.length > 0 ? conditionalBlocks : undefined,
      setFlags: setFlags.length > 0 ? setFlags : undefined,
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CONDITIONAL,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
