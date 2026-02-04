import React from 'react';
import { Edit3, Home, Trash2 } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@magicborn/shared/ui/context-menu';

export interface StandardNodeContextMenuItemsProps {
  /** Node ID - required for most actions */
  nodeId: string | null | undefined;
  /** Whether this node is the start node */
  isStartNode?: boolean;
  /** Handler for edit action */
  onEdit: () => void;
  /** Handler for set as start node action */
  onSetAsStart: () => void;
  /** Handler for delete action */
  onDelete: () => void;
  /** Custom items to insert before the standard items (e.g., node-specific actions) */
  beforeStandardItems?: React.ReactNode;
  /** Custom items to insert after edit but before set as start */
  afterEditItems?: React.ReactNode;
  /** Whether to show delete option (default: true, but can be hidden for start nodes) */
  showDelete?: boolean;
  /** Custom edit label (default: "Edit Node") */
  editLabel?: string;
}

/**
 * Standard context menu items shared across all node types.
 * Provides: Edit, Set as Start Node (if not start), Delete (if not start)
 * 
 * Usage:
 * ```tsx
 * <ContextMenuContent>
 *   <StandardNodeContextMenuItems
 *     nodeId={node.id}
 *     isStartNode={isStartNode}
 *     onEdit={handleEdit}
 *     onSetAsStart={handleSetAsStart}
 *     onDelete={handleDelete}
 *     afterEditItems={
 *       <ContextMenuItem onSelect={handleAddChoice}>
 *         <Plus size={14} /> Add Choice
 *       </ContextMenuItem>
 *     }
 *   />
 * </ContextMenuContent>
 * ```
 */
export function StandardNodeContextMenuItems({
  nodeId,
  isStartNode = false,
  onEdit,
  onSetAsStart,
  onDelete,
  beforeStandardItems,
  afterEditItems,
  showDelete = true,
  editLabel = 'Edit Node',
}: StandardNodeContextMenuItemsProps) {
  if (!nodeId) {
    return null;
  }

  return (
    <>
      {beforeStandardItems}
      
      {/* Edit - always available */}
      <ContextMenuItem onSelect={onEdit}>
        <Edit3 size={14} className="mr-2 text-[var(--node-accent)]" /> {editLabel}
      </ContextMenuItem>
      
      {/* Node-specific items after edit */}
      {afterEditItems}
      
      {/* Set as Start Node - only if not already start */}
      {!isStartNode && (
        <ContextMenuItem onSelect={onSetAsStart}>
          <Home size={14} className="mr-2 text-[var(--node-accent)]" /> Set as Start Node
        </ContextMenuItem>
      )}
      
      {/* Delete - only if not start node and showDelete is true */}
      {!isStartNode && showDelete && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" /> Delete
          </ContextMenuItem>
        </>
      )}
    </>
  );
}
