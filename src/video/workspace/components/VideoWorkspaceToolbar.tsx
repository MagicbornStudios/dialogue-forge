'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Play, Pause, Download, Eye, Save, Undo2, Redo2, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useVideoWorkspaceStore } from '../store/video-workspace-store';
import { cn } from '@/shared/lib/utils';

export function VideoWorkspaceToolbar() {
  const isPlaying = useVideoWorkspaceStore((s) => s.isPlaying);
  const currentFrame = useVideoWorkspaceStore((s) => s.currentFrame);
  const draftTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  const hasUncommittedChanges = useVideoWorkspaceStore((s) => s.hasUncommittedChanges);
  const adapter = useVideoWorkspaceStore((s) => s.adapter);
  const setIsPlaying = useVideoWorkspaceStore((s) => s.actions.setIsPlaying);
  const openModal = useVideoWorkspaceStore((s) => s.actions.openModal);
  const commitDraft = useVideoWorkspaceStore((s) => s.actions.commitDraft);
  const resetDraft = useVideoWorkspaceStore((s) => s.actions.resetDraft);
  
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');

  const handleSave = async () => {
    console.log('💾 Saving template...');
    await commitDraft();
  };
  
  const selectedProjectId = useVideoWorkspaceStore((s) => s.selectedProjectId);
  
  const handleSaveAs = async () => {
    if (!adapter || !draftTemplate || !saveAsName.trim()) return;
    
    if (!selectedProjectId) {
      console.error('❌ No project selected');
      alert('Please select a project before saving templates.');
      return;
    }
    
    try {
      console.log('💾 Saving as new template:', saveAsName, 'to project:', selectedProjectId);
      
      // Create new template with new ID and name
      const newTemplate = {
        ...draftTemplate,
        id: `template_${Date.now()}`,
        name: saveAsName.trim(),
      };
      
      // Save the new template
      const savedTemplate = await adapter.saveTemplate(newTemplate);
      
      // Load the saved template (with PayloadCMS ID) as current
      resetDraft(savedTemplate);
      
      // Close dialog
      setSaveAsDialogOpen(false);
      setSaveAsName('');
      
      console.log('✅ Template saved as:', savedTemplate.name, 'ID:', savedTemplate.id);
    } catch (error) {
      console.error('❌ Failed to save as:', error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

        {/* Save dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={hasUncommittedChanges ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-7 px-2',
                hasUncommittedChanges && 'bg-[var(--color-df-video)] hover:bg-[var(--color-df-video-hover)] text-white'
              )}
              title="Save options"
            >
              <Save size={14} />
              <span className="ml-1.5 text-xs">Save</span>
              {hasUncommittedChanges && (
                <span className="ml-1 text-[10px] opacity-70">●</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleSave} disabled={!hasUncommittedChanges}>
              <Save size={12} className="mr-2" />
              Save
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setSaveAsName(draftTemplate?.name ? `${draftTemplate.name} Copy` : 'New Template');
                setSaveAsDialogOpen(true);
              }}
              disabled={!selectedProjectId}
            >
              <Copy size={12} className="mr-2" />
              Save As...
              {!selectedProjectId && <span className="ml-2 text-[10px]">(Select project first)</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
      
      {/* Save As Dialog */}
      <Dialog open={saveAsDialogOpen} onOpenChange={setSaveAsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template As</DialogTitle>
            <DialogDescription>
              Create a new copy of this template with a different name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                placeholder="My Template"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveAsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAs}
              disabled={!saveAsName.trim()}
            >
              Save As New Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}