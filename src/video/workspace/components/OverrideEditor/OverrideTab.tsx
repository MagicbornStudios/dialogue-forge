'use client';

import React, { useState } from 'react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { VideoCanvas } from '../VideoCanvas';
import { Button } from '@/shared/ui/button';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { TEMPLATE_INPUT_KEY } from '@/shared/types/bindings';
import type { VideoTemplateOverrides } from '@/video/templates/types/video-template-overrides';

export function OverrideTab() {
  const draftTemplate = useVideoWorkspaceStore((s) => s.draftGraph);
  const isPreviewMode = useVideoWorkspaceStore((s) => s.isPreviewMode);
  const setPreviewMode = useVideoWorkspaceStore((s) => s.actions.setPreviewMode);
  
  const [overrides, setOverrides] = useState<VideoTemplateOverrides>({});

  const handleOverrideChange = (key: string, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [key]: value || undefined,
      },
    }));
  };

  return (
    <div className="flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <VideoCanvas
          template={draftTemplate}
          selectedLayerId={null}
          showGrid={false}
          readonly={isPreviewMode}
          onLayerSelect={() => {}}
          onLayerMove={() => {}}
          onLayerResize={() => {}}
          onLayerAdd={() => {}}
        />
        
        {/* Lock Overlay (when preview mode active) */}
        {isPreviewMode && (
          <div className="absolute inset-0 bg-black/10 pointer-events-none flex items-center justify-center z-50">
            <div className="px-4 py-2 rounded-lg bg-black/80 text-white text-sm flex items-center gap-2">
              <Lock size={16} />
              Preview Mode - Canvas Locked
            </div>
          </div>
        )}
      </div>

      {/* Override Panel (Right Side) */}
      <div className="w-80 border-l border-border bg-background relative group">
        <div className="absolute inset-y-0 left-0 w-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 py-3 bg-background border-b border-border">
            <div className="text-sm font-semibold">Template Overrides</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Runtime data injection
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="p-4 border-b border-border">
            <Button
              type="button"
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              onClick={() => setPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? (
                <>
                  <Lock size={14} className="mr-2" />
                  Preview ON
                </>
              ) : (
                <>
                  <EyeOff size={14} className="mr-2" />
                  Preview OFF
                </>
              )}
            </Button>
            
            {isPreviewMode && (
              <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500">
                Canvas is locked. Toggle preview to edit template.
              </div>
            )}
          </div>

          {/* Override Inputs */}
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Background</Label>
              <Input
                type="text"
                placeholder="Override background..."
                className="text-sm"
                value={(overrides.inputs?.[TEMPLATE_INPUT_KEY.NODE_BACKGROUND] as string) ?? ''}
                onChange={(e) => handleOverrideChange(TEMPLATE_INPUT_KEY.NODE_BACKGROUND, e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Override the background image or color
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Dialogue</Label>
              <textarea
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-none"
                placeholder="Override dialogue text..."
                rows={3}
                value={(overrides.inputs?.[TEMPLATE_INPUT_KEY.NODE_DIALOGUE] as string) ?? ''}
                onChange={(e) => handleOverrideChange(TEMPLATE_INPUT_KEY.NODE_DIALOGUE, e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Override the dialogue content
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Image</Label>
              <Input
                type="text"
                placeholder="Override image URL..."
                className="text-sm"
                value={(overrides.inputs?.[TEMPLATE_INPUT_KEY.NODE_IMAGE] as string) ?? ''}
                onChange={(e) => handleOverrideChange(TEMPLATE_INPUT_KEY.NODE_IMAGE, e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Override the image source
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Speaker</Label>
              <Input
                type="text"
                placeholder="Override speaker name..."
                className="text-sm"
                value={(overrides.inputs?.[TEMPLATE_INPUT_KEY.NODE_SPEAKER] as string) ?? ''}
                onChange={(e) => handleOverrideChange(TEMPLATE_INPUT_KEY.NODE_SPEAKER, e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Override the speaker/character name
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
