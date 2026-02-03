'use client';

import React, { useMemo } from 'react';
import { LivePlayerProvider } from '@twick/live-player';
import { TimelineProvider, INITIAL_TIMELINE_DATA } from '@twick/timeline';
import { TwickStudio } from '@twick/studio';
import { cn } from '@/shared/lib/utils';

export interface VideoWorkspaceTwickProps {
  className?: string;
  contextId?: string;
  width?: number;
  height?: number;
  frameRate?: number;
}

export function VideoWorkspaceTwick({
  className,
  contextId = 'video:default',
  width = 1920,
  height = 1080,
  frameRate = 30,
}: VideoWorkspaceTwickProps) {
  const initialTimeline = useMemo(() => INITIAL_TIMELINE_DATA, []);

  return (
    <div className={cn('h-full w-full', className)} data-domain="video">
      <LivePlayerProvider>
        <TimelineProvider
          initialData={initialTimeline}
          contextId={contextId}
          undoRedoPersistenceKey={contextId}
        >
          <TwickStudio
            studioConfig={{
              videoProps: {
                width,
                height,
              },
            }}
          />
        </TimelineProvider>
      </LivePlayerProvider>
    </div>
  );
}
