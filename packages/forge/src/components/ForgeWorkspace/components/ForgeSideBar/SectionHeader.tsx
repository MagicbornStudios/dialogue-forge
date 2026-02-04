'use client';

import React from 'react';
import { Badge } from '@magicborn/shared/ui/badge';
import { SearchInput } from '@magicborn/shared/ui/SearchInput';
import { SectionToolbar, type SectionToolbarAction } from './SectionToolbar';
import { cn } from '@magicborn/shared/lib/utils';

// Re-export for convenience
export type { SectionToolbarAction };

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  };
  focusedEditor?: 'narrative' | 'storylet' | null;
  toolbarActions?: SectionToolbarAction[];
  className?: string;
}

/**
 * Reusable section header component for sidebar sections
 * Matches the NodePalette header pattern with theme-aware colors
 */
export function SectionHeader({
  title,
  icon,
  iconColor,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  badge,
  focusedEditor,
  toolbarActions = [],
  className,
}: SectionHeaderProps) {
  // Determine colors based on focused editor
  const headerBgColor = focusedEditor === 'narrative' 
    ? 'bg-[var(--editor-info)]/10' 
    : focusedEditor === 'storylet'
    ? 'bg-[var(--editor-edge-choice)]/10'
    : 'bg-transparent';
  
  const headerBorderColor = focusedEditor === 'narrative'
    ? 'border-b-[var(--editor-info)]'
    : focusedEditor === 'storylet'
    ? 'border-b-[var(--editor-edge-choice)]'
    : 'border-b-border';
  
  const headerTextColor = focusedEditor === 'narrative'
    ? 'text-[var(--editor-info)]'
    : focusedEditor === 'storylet'
    ? 'text-[var(--editor-edge-choice)]'
    : 'text-muted-foreground';
  
  const headerIconColorValue = iconColor || (focusedEditor === 'narrative'
    ? 'var(--editor-info)'
    : focusedEditor === 'storylet'
    ? 'var(--editor-edge-choice)'
    : 'var(--editor-muted-foreground)');

  const editorBadge = focusedEditor && (
    <Badge 
      variant="secondary" 
      className={cn(
        "h-4 px-1.5 text-[10px]",
        focusedEditor === 'narrative' && "bg-[var(--editor-info)]/20 text-[var(--editor-info)] border-[var(--editor-info)]/30",
        focusedEditor === 'storylet' && "bg-[var(--editor-edge-choice)]/20 text-[var(--editor-edge-choice)] border-[var(--editor-edge-choice)]/30"
      )}
    >
      {focusedEditor === 'narrative' ? 'Narrative' : 'Storylet'}
    </Badge>
  );

  return (
    <div className={cn(
      "flex flex-col border-b-1",
      headerBgColor,
      headerBorderColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <div style={{ color: headerIconColorValue }}>
            {icon}
          </div>
          <span className={cn("text-xs font-medium", headerTextColor)}>{title}</span>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className={cn("h-4 px-1.5 text-[10px]", badge.className)}>
              {badge.label}
            </Badge>
          )}
          {editorBadge}
        </div>
        {toolbarActions.length > 0 && (
          <SectionToolbar actions={toolbarActions} />
        )}
      </div>

      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="px-2 py-1.5">
          <SearchInput
            value={searchValue || ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
    </div>
  );
}
