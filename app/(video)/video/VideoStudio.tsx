'use client';

import React from 'react';
import { VideoWorkspaceTwick } from '@/video/workspace/VideoWorkspaceTwick';

export const dynamic = 'force-static';

export function VideoStudio() {
  return (
    <VideoWorkspaceTwick
      className="h-screen w-screen"
      contextId="video:studio:default"
    />
  );
}
