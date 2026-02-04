import React from 'react';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { EdgeDropMenu } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeDropMenu';

interface CharacterEdgeDropMenuProps {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
  fromNodeId: string;
  sourceHandle?: string;
  edgeId?: string;
  onClose: () => void;
}

/**
 * Character edge drop menu component
 * 
 * Now uses the generic EdgeDropMenu component with CHARACTER node type.
 * This eliminates ~45 lines of duplicate code.
 */
export function CharacterEdgeDropMenu(props: CharacterEdgeDropMenuProps) {
  return (
    <EdgeDropMenu
      {...props}
      sourceNodeType={FORGE_NODE_TYPE.CHARACTER}
    />
  );
}
