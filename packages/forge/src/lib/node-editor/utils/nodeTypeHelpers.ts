import type { ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS, NODE_TYPE_BORDER_COLORS, NODE_TYPE_BADGE_CLASSES } from '@magicborn/forge/types/ui-constants';

/**
 * Get border color CSS class for a node type
 */
export function getNodeTypeBorderColor(nodeType: ForgeNodeType | string | undefined): string {
  if (!nodeType) return 'border-df-control-border';
  return NODE_TYPE_BORDER_COLORS[nodeType as ForgeNodeType] || 'border-df-control-border';
}

/**
 * Get badge CSS classes for a node type
 */
export function getNodeTypeBadge(nodeType: ForgeNodeType | string | undefined): string {
  if (!nodeType) return 'bg-df-control-bg text-df-text-secondary';
  return NODE_TYPE_BADGE_CLASSES[nodeType as ForgeNodeType] || 'bg-df-control-bg text-df-text-secondary';
}

/**
 * Get label for a node type
 */
export function getNodeTypeLabel(nodeType: ForgeNodeType | string | undefined): string {
  if (!nodeType) return 'UNKNOWN';
  return FORGE_NODE_TYPE_LABELS[nodeType as ForgeNodeType] || 'UNKNOWN';
}
