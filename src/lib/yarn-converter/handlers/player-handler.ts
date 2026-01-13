/**
 * Player Node Handler
 * 
 * Handles PLAYER nodes (choice nodes).
 * Exports/imports player choices with conditions, flags, and next nodes.
 */

import { BaseNodeHandler } from './base-handler';
import { NodeBlockBuilder } from '../builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeNode, ForgeChoice } from '@/src/types/forge/forge-graph';
import type { YarnConverterContext, YarnNodeBlock } from '../types';
import { FORGE_NODE_TYPE } from '@/src/types/forge/forge-graph';
import { parseCondition } from '../utils/condition-parser';
import { extractSetCommands } from '../utils/content-formatter';
import { YARN_BLOCK_TYPE } from '@/src/types/constants';

export class PlayerHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.PLAYER;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: import('../types').YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');

    blockBuilder.startNode();

    // Export choices
    if (data.choices && data.choices.length > 0) {
      blockBuilder.addChoices(data.choices);
    }

    return blockBuilder.endNode();
  }

  async importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode> {
    const lines = yarnBlock.lines;
    const choices: ForgeChoice[] = [];
    
    let inConditionalChoice = false;
    let currentChoiceCondition: any[] = [];
    let currentChoice: any = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('->')) {
        const choiceText = trimmed.slice(2).trim();
        const setCommands = extractSetCommands(choiceText);
        let cleanText = choiceText;
        
        if (setCommands.length > 0) {
          setCommands.forEach(cmd => {
            cleanText = cleanText.replace(cmd, '').trim();
          });
        }

        currentChoice = {
          id: `c_${Date.now()}_${choices.length}`,
          text: cleanText,
          nextNodeId: '',
          conditions: inConditionalChoice && currentChoiceCondition.length > 0 
            ? currentChoiceCondition 
            : undefined,
          setFlags: setCommands.length > 0 
            ? setCommands.map(cmd => {
                const match = cmd.match(/<<set\s+\$(\w+)/);
                return match ? match[1] : '';
              }).filter(Boolean)
            : undefined,
        };
        
        choices.push(currentChoice);
        inConditionalChoice = false;
        currentChoiceCondition = [];
      } else if (trimmed.startsWith('<<jump')) {
        const jumpMatch = trimmed.match(/<<jump\s+(\S+)>>/);
        if (jumpMatch && currentChoice) {
          currentChoice.nextNodeId = jumpMatch[1];
        }
      } else if (trimmed.startsWith('<<set')) {
        const setMatch = trimmed.match(/<<set\s+\$(\w+)/);
        if (setMatch && currentChoice) {
          if (!currentChoice.setFlags) {
            currentChoice.setFlags = [];
          }
          currentChoice.setFlags.push(setMatch[1]);
          if (!currentChoice.text.includes('<<set')) {
            currentChoice.text += ` ${trimmed}`;
          }
        }
      } else if (trimmed.startsWith('<<if')) {
        const conditionStr = trimmed.replace(/<<if\s+/, '').replace(/>>/, '').trim();
        currentChoiceCondition = parseCondition(conditionStr);
        inConditionalChoice = true;
      } else if (trimmed.startsWith('<<endif')) {
        inConditionalChoice = false;
        currentChoiceCondition = [];
      }
    });

    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.PLAYER,
      choices: choices.length > 0 ? choices : undefined,
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.PLAYER,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
