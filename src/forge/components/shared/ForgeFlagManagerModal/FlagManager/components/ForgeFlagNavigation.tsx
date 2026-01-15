import React from 'react';
import { flagTypeLabels, flagTypeIcons, flagTypes } from '@/forge/components/shared/ForgeFlagManagerModal/FlagManager/utils/flag-constants';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

interface ForgeFlagNavigationProps {
  selectedSection: string;
  sectionCounts: Record<string, number>;
  onSectionChange: (section: string) => void;
}

export function ForgeFlagNavigation({
  selectedSection,
  sectionCounts,
  onSectionChange,
}: ForgeFlagNavigationProps) {
  return (
    <div className="w-64 border-r bg-muted/50 flex flex-col flex-shrink-0">
      <div className="p-4 border-b">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Sections
        </div>
        <nav className="space-y-1">
          <Button
            variant={selectedSection === 'all' ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-between',
              selectedSection === 'all' && 'bg-primary/20 text-primary border border-primary/30'
            )}
            onClick={() => onSectionChange('all')}
          >
            <span>All Flags</span>
            <span className="text-xs text-muted-foreground">{sectionCounts.all}</span>
          </Button>
          {flagTypes.map(type => (
            <Button
              key={type}
              variant={selectedSection === type ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-between',
                selectedSection === type && 'bg-primary/20 text-primary border border-primary/30'
              )}
              onClick={() => onSectionChange(type)}
            >
              <span className="flex items-center gap-2">
                <span>{React.createElement(flagTypeIcons[type], { size: 16 })}</span>
                <span>{flagTypeLabels[type]}</span>
              </span>
              <span className="text-xs text-muted-foreground">{sectionCounts[type] || 0}</span>
            </Button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t mt-auto">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Info</div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="text-muted-foreground">Dialogue flags</span> (gray) are temporary
            and reset after dialogue ends.
          </p>
          <p>
            <span className="text-foreground">Game flags</span> (colored) persist and affect the
            entire game.
          </p>
        </div>
      </div>
    </div>
  );
}
