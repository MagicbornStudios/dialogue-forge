import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { FlagCard } from './FlagCard';
import type { FlagDefinition, FlagType } from '@/src/types/flags';
import { flagTypeLabels } from '../utils/flag-constants';

interface FlagListProps {
  flags: FlagDefinition[];
  usedFlags: Set<string>;
  selectedSection: string;
  onEdit: (flag: FlagDefinition) => void;
  onDelete: (flagId: string) => void;
  onCreate: (type?: FlagType) => void;
}

export function FlagList({
  flags,
  usedFlags,
  selectedSection,
  onEdit,
  onDelete,
  onCreate,
}: FlagListProps) {
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
          <FlagCard
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
