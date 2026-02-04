import React from 'react';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { EdgeDropMenu } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeDropMenu';

interface ConditionalEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  fromBlockIdx?: number;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

/**
 * Conditional edge drop menu component
 * 
 * Now uses the generic EdgeDropMenu component with CONDITIONAL node type.
 * This eliminates ~50 lines of duplicate code.
 */
export function ConditionalEdgeDropMenu(props: ConditionalEdgeDropMenuProps) {
  return (
    <EdgeDropMenu
      {...props}
      sourceNodeType={FORGE_NODE_TYPE.CONDITIONAL}
    />
  );
}
