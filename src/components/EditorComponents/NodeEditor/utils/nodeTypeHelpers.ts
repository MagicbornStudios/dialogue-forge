import { NODE_TYPE } from '../../../../types/constants';
import type { NodeType } from '../../../../types/constants';

export function getNodeTypeBorderColor(nodeType: NodeType): string {
  if (nodeType === NODE_TYPE.NPC || nodeType === NODE_TYPE.STORYLET || nodeType === NODE_TYPE.STORYLET_POOL) {
    return 'border-df-npc-border';
  }
  if (nodeType === NODE_TYPE.PLAYER) {
    return 'border-df-player-border';
  }
  if (nodeType === NODE_TYPE.CONDITIONAL) return 'border-df-conditional-border';
  return 'border-df-control-border';
}

export function getNodeTypeBadge(nodeType: NodeType): string {
  if (nodeType === NODE_TYPE.NPC || nodeType === NODE_TYPE.STORYLET || nodeType === NODE_TYPE.STORYLET_POOL) {
    return 'bg-df-npc-selected/20 text-df-npc-selected';
  }
  if (nodeType === NODE_TYPE.PLAYER) {
    return 'bg-df-player-selected/20 text-df-player-selected';
  }
  if (nodeType === NODE_TYPE.CONDITIONAL) return 'bg-df-conditional-border/20 text-df-conditional-border';
  return 'bg-df-control-bg text-df-text-secondary';
}

export function getNodeTypeLabel(nodeType: NodeType): string {
  if (nodeType === NODE_TYPE.NPC) return 'NPC';
  if (nodeType === NODE_TYPE.PLAYER) return 'PLAYER';
  if (nodeType === NODE_TYPE.CONDITIONAL) return 'CONDITIONAL';
  if (nodeType === NODE_TYPE.STORYLET) return 'STORYLET';
  if (nodeType === NODE_TYPE.STORYLET_POOL) return 'STORYLET POOL';
  return 'UNKNOWN';
}
