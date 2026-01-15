import React from 'react';
import { Trash2, X } from 'lucide-react';
import { ForgeNode } from '@/forge/types/forge-graph';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { getNodeTypeBadge, getNodeTypeLabel } from '../../../../../../../lib/node-editor/utils/nodeTypeHelpers';

interface NodeEditorHeaderProps {
  node: ForgeNode;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeEditorHeader({ node, onDelete, onClose }: NodeEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded ${getNodeTypeBadge(node.type)}`}>
        {getNodeTypeLabel(node.type)}
      </Badge>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-7 w-7 text-gray-500 hover:text-red-400"
          title="Delete node"
        >
          <Trash2 size={14} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-gray-500 hover:text-white"
          title="Close"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
