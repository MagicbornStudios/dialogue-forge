'use client';

import React from 'react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { DefaultTab } from './DefaultTab';
import { OverrideTab } from './OverrideTab';

export function OverrideEditor() {
  const overrideTab = useVideoWorkspaceStore((s) => s.overrideTab ?? 'default');

  return (
    <div className="flex flex-col h-full">
      {overrideTab === 'default' ? (
        <DefaultTab />
      ) : (
        <OverrideTab />
      )}
    </div>
  );
}
