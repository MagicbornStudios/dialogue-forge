'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import { Play, Pause, Download, Eye, Save, Undo2, Redo2 } from 'lucide-react';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';
import { cn } from '@/shared/lib/utils';

export function VideoWorkspaceToolbar() {
  const isPlaying = useVideoWorkspaceStore((s) => s.isPlaying);
  const currentFrame = useVideoWorkspaceStore((s) => s.currentFrame);
  const draftTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  const hasUncommittedChanges = useVideoWorkspaceStore((s) => s.hasUncommittedChanges);
  const setIsPlaying = useVideoWorkspaceStore((s) => s.actions.setIsPlaying);
  const openModal = useVideoWorkspaceStore((s) => s.actions.openModal);
  const commitDraft = useVideoWorkspaceStore((s) => s.actions.commitDraft);

  const handleSave = async () => {
    console.log('💾 Saving template...');
    await commitDraft();
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
      <div className="flex items-center gap-2">
        {/* Playback controls */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span className="ml-1.5 text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Save button */}
        <Button
          type="button"
          variant={hasUncommittedChanges ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-7 px-2',
            hasUncommittedChanges && 'bg-[var(--color-df-video)] hover:bg-[var(--color-df-video-hover)] text-white'
          )}
          onClick={handleSave}
          disabled={!hasUncommittedChanges}
          title="Save changes"
        >
          <Save size={14} />
          <span className="ml-1.5 text-xs">Save</span>
          {hasUncommittedChanges && (
            <span className="ml-1 text-[10px] opacity-70">●</span>
          )}
        </Button>

        {/* Undo/Redo - to be implemented */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled
          title="Undo (Coming soon)"
        >
          <Undo2 size={14} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled
          title="Redo (Coming soon)"
        >
          <Redo2 size={14} />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Preview/Export */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => openModal('preview')}
          title="Preview template"
        >
          <Eye size={14} />
          <span className="ml-1.5 text-xs">Preview</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={() => openModal('export')}
          title="Export video"
        >
          <Download size={14} />
          <span className="ml-1.5 text-xs">Export</span>
        </Button>
      </div>
      
      <div className="text-[11px] text-muted-foreground font-mono">
        {draftTemplate?.name || 'No template'} · {draftTemplate?.scenes[0]?.layers.length || 0} layers
      </div>
    </div>
  );
}