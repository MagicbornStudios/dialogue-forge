import React from 'react';
import { Users, Plus, Save, Eye } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { TOOL_MODE, type ToolMode } from '@/characters/types';

interface CharacterWorkspaceToolbarProps {
  onSaveClick?: () => void;
  toolbarActions?: React.ReactNode;
  toolMode?: ToolMode;
  onToolModeChange?: (mode: ToolMode) => void;
  activeProjectId?: string | null;
  counts?: {
    characterCount: number;
    relationshipCount: number;
  };
}

/**
 * Character workspace toolbar
 * Provides tool selection and workspace actions for character relationships
 */
export function CharacterWorkspaceToolbar({
  onSaveClick,
  toolbarActions,
  toolMode = TOOL_MODE.SELECT,
  onToolModeChange,
  activeProjectId,
  counts,
}: CharacterWorkspaceToolbarProps) {
  const relationshipCount = counts?.relationshipCount || 0;

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
      <div className="flex items-center gap-2">
        {/* Tool Mode Selection */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            type="button"
            variant={toolMode === TOOL_MODE.SELECT ? 'default' : 'outline'}
            size="icon"
            onClick={() => onToolModeChange?.(TOOL_MODE.SELECT)}
            title="Select and move nodes"
          >
            <Users size={16} />
          </Button>
          <Button
            type="button"
            variant={toolMode === TOOL_MODE.PAN ? 'default' : 'outline'}
            size="icon"
            onClick={() => onToolModeChange?.(TOOL_MODE.PAN)}
            title="Pan and zoom canvas"
          >
            <Eye size={16} />
          </Button>
          <Button
            type="button"
            variant={toolMode === TOOL_MODE.LINK ? 'default' : 'outline'}
            size="icon"
            onClick={() => onToolModeChange?.(TOOL_MODE.LINK)}
            title="Create relationship links"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Project Info */}
        {activeProjectId && (
          <div className="text-sm text-muted-foreground">
            Project {activeProjectId}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Character/Relationship Count */}
        {counts && (
          <div className="text-sm text-muted-foreground">
            {counts.characterCount} characters · {relationshipCount} relationships
          </div>
        )}

        {/* Workspace Actions */}
        <div className="flex items-center gap-2">
          {onSaveClick && (
            <Button type="button" size="icon" onClick={onSaveClick} title="Save changes">
              <Save size={16} />
            </Button>
          )}
          
          {toolbarActions}
        </div>
      </div>
    </div>
  );
}