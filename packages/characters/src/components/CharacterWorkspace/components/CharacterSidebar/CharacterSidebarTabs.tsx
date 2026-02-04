'use client';

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@magicborn/shared/ui/toggle-group';
import { Users, Link2 } from 'lucide-react';
import { cn } from '@magicborn/shared/lib/utils';
import type { SidebarTab } from './types';

interface CharacterSidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  characterCount: number;
  edgeCount: number;
}

export function CharacterSidebarTabs({
  activeTab,
  onTabChange,
  characterCount,
  edgeCount,
}: CharacterSidebarTabsProps) {
  return (
    <ToggleGroup
      type="single"
      value={activeTab}
      onValueChange={(value) => value && onTabChange(value as SidebarTab)}
      variant="outline"
      className="w-full flex rounded-none bg-transparent h-8 px-0 gap-0 m-0 min-w-0 overflow-hidden border-b border-border relative group"
    >
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      <ToggleGroupItem
        value="characters"
        aria-label="Characters"
        className={cn(
          'min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative',
          'text-muted-foreground hover:text-foreground transition-colors',
          'data-[state=on]:bg-muted data-[state=on]:text-foreground',
          activeTab === 'characters' && 'border-l-2 border-l-[var(--editor-info)]',
          activeTab !== 'characters' && 'border-l-2 border-l-[var(--color-df-info-muted,theme(colors.blue.300))]/30'
        )}
      >
        <Users
          size={12}
          className={cn(
            'mr-0.5 shrink-0 transition-colors',
            activeTab === 'characters' ? 'text-[var(--editor-info)]' : 'text-[var(--color-df-info-muted,theme(colors.blue.300))]'
          )}
        />
        <span className="truncate">Characters</span>
        {characterCount > 0 && (
          <span
            className={cn(
              'ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0',
              'bg-[var(--editor-info)]/20 text-[var(--editor-info)]'
            )}
          >
            {characterCount}
          </span>
        )}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="relationships"
        aria-label="Relationships"
        className={cn(
          'min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative',
          'text-muted-foreground hover:text-foreground transition-colors',
          'data-[state=on]:bg-muted data-[state=on]:text-foreground',
          activeTab === 'relationships' && 'border-l-2 border-l-[var(--editor-info)]',
          activeTab !== 'relationships' && 'border-l-2 border-l-[var(--color-df-info-muted,theme(colors.blue.300))]/30'
        )}
      >
        <Link2
          size={12}
          className={cn(
            'mr-0.5 shrink-0 transition-colors',
            activeTab === 'relationships' ? 'text-[var(--editor-info)]' : 'text-[var(--color-df-info-muted,theme(colors.blue.300))]'
          )}
        />
        <span className="truncate">Relationships</span>
        {edgeCount > 0 && (
          <span
            className={cn(
              'ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0',
              'bg-[var(--editor-info)]/20 text-[var(--editor-info)]'
            )}
          >
            {edgeCount}
          </span>
        )}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
