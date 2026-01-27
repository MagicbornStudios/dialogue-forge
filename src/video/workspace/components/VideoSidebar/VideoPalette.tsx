'use client';

import React from 'react';
import { Video, Film } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface VideoPaletteProps {
  className?: string;
}

export function VideoPalette({ className }: VideoPaletteProps) {
  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Video size={14} className="text-[var(--color-df-video)]" />
          <span className="text-sm font-semibold">Videos</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Your saved video templates
        </div>
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          No saved videos yet
        </div>
      </div>
    </div>
  );
}