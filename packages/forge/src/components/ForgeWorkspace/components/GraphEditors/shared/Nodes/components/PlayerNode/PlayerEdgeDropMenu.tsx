import React from 'react';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { EdgeDropMenu } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeDropMenu';

interface PlayerEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  fromChoiceIdx?: number;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

/**
 * Player edge drop menu component
 * 
 * Now uses the generic EdgeDropMenu component with PLAYER node type.
 * This eliminates ~50 lines of duplicate code.
 */
export function PlayerEdgeDropMenu(props: PlayerEdgeDropMenuProps) {
  return (
    <EdgeDropMenu
      {...props}
      sourceNodeType={FORGE_NODE_TYPE.PLAYER}
    />
  );
}
