'use client';

import React from 'react';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';

export function VideoWorkspaceModals() {
  const activeModal = useVideoWorkspaceStore((s) => s.activeModal);
  const closeModal = useVideoWorkspaceStore((s) => s.actions.closeModal);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => closeModal()}>
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
          <div className="text-lg font-semibold mb-4">
            {activeModal === 'preview' && 'Preview Template'}
            {activeModal === 'export' && 'Export Video'}
            {activeModal === 'templatePicker' && 'Choose Template'}
            {activeModal === 'settings' && 'Settings'}
          </div>
          <div className="text-sm text-gray-600">
            Modal content coming soon
          </div>
        </div>
      </div>
    </div>
  );
}