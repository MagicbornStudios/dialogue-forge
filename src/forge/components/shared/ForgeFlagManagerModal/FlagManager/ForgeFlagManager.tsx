import React from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { ForgeFlagNavigation } from './components/ForgeFlagNavigation';
import { ForgeFlagList } from './components/ForgeFlagList';
import { ForgeFlagEditor } from './components/ForgeFlagEditor';
import { useFlagManager } from './hooks/useFlagManager';
import { useUsedFlags } from './hooks/useUsedFlags';
import type { FlagSchema } from '@/forge/types/flags';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

interface ForgeFlagManagerProps {
  flagSchema: FlagSchema;
  graph?: ForgeGraphDoc;
  onUpdate: (schema: FlagSchema) => void;
  onClose: () => void;
  /** If true, renders without Dialog wrapper (for embedding) */
  embedded?: boolean;
}

function ForgeFlagManagerContent({
  flagSchema,
  graph,
  onUpdate,
  onClose,
  usedFlags,
}: {
  flagSchema: FlagSchema;
  graph?: ForgeGraphDoc;
  onUpdate: (schema: FlagSchema) => void;
  onClose: () => void;
  usedFlags: Set<string>;
}) {
  const {
    editingFlag,
    isCreating,
    selectedSection,
    setSelectedSection,
    currentFlags,
    sectionCounts,
    handleCreateFlag,
    handleEditFlag,
    handleCancelEdit,
  } = useFlagManager(flagSchema);

  const handleSaveFlag = (flag: import('@/forge/types/flags').FlagDefinition) => {
    if (isCreating) {
      onUpdate({
        ...flagSchema,
        flags: [...flagSchema.flags, flag],
      });
    } else {
      onUpdate({
        ...flagSchema,
        flags: flagSchema.flags.map(f => (f.id === flag.id ? flag : f)),
      });
    }
    handleCancelEdit();
  };

  const handleDeleteFlag = (flagId: string) => {
    if (confirm(`Delete flag "${flagId}"?`)) {
      onUpdate({
        ...flagSchema,
        flags: flagSchema.flags.filter(f => f.id !== flagId),
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Flag Manager</h2>
            {graph && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="text-destructive font-semibold">{usedFlags.size}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-foreground">{flagSchema.flags.length}</span>
                <span className="text-muted-foreground"> flags used in dialogue</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                handleCreateFlag(selectedSection !== 'all' ? selectedSection : undefined)
              }
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Flag
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <ForgeFlagNavigation
          selectedSection={selectedSection}
          sectionCounts={sectionCounts}
          onSectionChange={setSelectedSection}
        />

        <div className="flex-1 overflow-y-auto">
          {editingFlag ? (
            <div className="p-6">
              <ForgeFlagEditor
                flag={editingFlag}
                categories={flagSchema.categories || []}
                onSave={handleSaveFlag}
                onCancel={handleCancelEdit}
              />
            </div>
          ) : (
            <div className="p-6">
              <ForgeFlagList
                flags={currentFlags}
                usedFlags={usedFlags}
                selectedSection={selectedSection}
                onEdit={handleEditFlag}
                onDelete={handleDeleteFlag}
                onCreate={handleCreateFlag}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ForgeFlagManager({
  flagSchema,
  graph,
  onUpdate,
  onClose,
  embedded = false,
}: ForgeFlagManagerProps) {
  const usedFlags = useUsedFlags(graph);

  const content = (
    <ForgeFlagManagerContent
      flagSchema={flagSchema}
      graph={graph}
      onUpdate={onUpdate}
      onClose={onClose}
      usedFlags={usedFlags}
    />
  );

  if (embedded) {
    return <div className="h-full">{content}</div>;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0 flex flex-col">
        {content}
      </DialogContent>
    </Dialog>
  );
}
