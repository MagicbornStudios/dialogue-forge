import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ForgeFlagCard } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/components/ForgeFlagManagerModal/FlagManager/components/ForgeFlagCard';
import type { FlagDefinition, FlagType } from '@/forge/types/flags';
import { flagTypeLabels } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/components/ForgeFlagManagerModal/FlagManager/utils/flag-constants';

interface ForgeFlagListProps {
  flags: FlagDefinition[];
  usedFlags: Set<string>;
  selectedSection: string;
  onEdit: (flag: FlagDefinition) => void;
  onDelete: (flagId: string) => void;
  onCreate: (type?: FlagType) => void;
}

export function ForgeFlagList({
  flags,
  usedFlags,
  selectedSection,
  onEdit,
  onDelete,
  onCreate,
}: ForgeFlagListProps) {
  if (flags.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="mb-4">
          No {selectedSection === 'all' ? '' : flagTypeLabels[selectedSection as FlagType]} flags
          defined yet.
        </p>
        <Button
          onClick={() => onCreate(selectedSection !== 'all' ? (selectedSection as FlagType) : undefined)}
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create {selectedSection === 'all' ? 'a' : flagTypeLabels[selectedSection as FlagType]} Flag
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map(flag => {
        const isUsed = usedFlags.has(flag.id);
        return (
          <ForgeFlagCard
            key={flag.id}
            flag={flag}
            isUsed={isUsed}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
