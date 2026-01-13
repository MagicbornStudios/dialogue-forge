// src/components/GraphEditors/utils/node-type-mapping.ts
import type { ForgeNodeType } from '@/src/types/forge/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@/src/types/ui-constants';

/**
 * Get node type label for ForgeNodeType
 */
export function getForgeNodeTypeLabel(forgeType: ForgeNodeType): string {
  return FORGE_NODE_TYPE_LABELS[forgeType] || forgeType;
}
