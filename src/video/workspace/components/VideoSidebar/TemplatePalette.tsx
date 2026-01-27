'use client';

import React, { useState, useEffect } from 'react';
import { Layout, MoreVertical, RefreshCw, FileEdit, Film } from 'lucide-react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { DEFAULT_BLANK_TEMPLATE } from '@/video/templates/default-templates';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface TemplatePaletteProps {
  className?: string;
}

interface TemplateSummary {
  id: string;
  name: string;
  updatedAt?: string;
}

export function TemplatePalette({ className }: TemplatePaletteProps) {
  const draftGraph = useVideoWorkspaceStore((s) => s.draftGraph);
  const resetDraft = useVideoWorkspaceStore((s) => s.actions.resetDraft);
  const adapter = useVideoWorkspaceStore((s) => s.adapter);
  const selectedProjectId = useVideoWorkspaceStore((s) => s.selectedProjectId);
  
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load templates from adapter
  const loadTemplates = async () => {
    if (!adapter || !selectedProjectId) {
      setTemplates([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const templateList = await adapter.listTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [adapter, selectedProjectId]);

  const handleTemplateClick = async (templateId: string) => {
    if (!adapter) return;
    
    try {
      const template = await adapter.loadTemplate(templateId);
      if (template) {
        console.log('Loading template:', template.name);
        resetDraft(template);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };
  
  const handleBlankClick = () => {
    console.log('Loading blank template');
    resetDraft(DEFAULT_BLANK_TEMPLATE);
  };
  
  const handleRename = async (templateId: string, newName: string) => {
    if (!adapter || !newName.trim()) return;
    
    try {
      const template = await adapter.loadTemplate(templateId);
      if (template) {
        template.name = newName.trim();
        await adapter.saveTemplate(template);
        await loadTemplates();
      }
    } catch (error) {
      console.error('Failed to rename template:', error);
    } finally {
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Layout size={14} className="text-[var(--color-df-video)]" />
          <span className="text-sm font-semibold">Templates</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Click to load template
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Blank Template (Built-in) */}
        <div
          onClick={handleBlankClick}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs cursor-pointer',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
            'transition-colors',
            draftGraph?.id === DEFAULT_BLANK_TEMPLATE.id && 'bg-[var(--color-df-video)]/10 text-[var(--color-df-video)] border-l-2 border-l-[var(--color-df-video)]'
          )}
        >
          <Layout 
            size={14} 
            className={cn(
              'shrink-0',
              draftGraph?.id === DEFAULT_BLANK_TEMPLATE.id ? 'text-[var(--color-df-video)]' : 'text-muted-foreground'
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">Blank Canvas</div>
            <div className="text-[10px] text-muted-foreground truncate">
              Start from scratch
            </div>
          </div>
        </div>

        {/* User Templates from PayloadCMS */}
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Loading templates...
          </div>
        ) : templates.length > 0 ? (
          <>
            <div className="px-3 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">
              My Templates
            </div>
            {templates.map((template) => {
              const isActive = draftGraph?.id === template.id;
              const isEditing = editingId === template.id;
              
              return (
                <div
                  key={template.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 text-xs',
                    'text-muted-foreground hover:bg-muted hover:text-foreground',
                    'transition-colors relative',
                    isActive && 'bg-[var(--color-df-video)]/10 text-[var(--color-df-video)] border-l-2 border-l-[var(--color-df-video)]'
                  )}
                >
                  <Film 
                    size={14} 
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-[var(--color-df-video)]' : 'text-muted-foreground'
                    )}
                  />
                  
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(template.id, editName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(template.id, editName);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="h-5 text-xs flex-1"
                    />
                  ) : (
                    <>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleTemplateClick(template.id)}
                      >
                        <div className="font-medium truncate">{template.name}</div>
                        {template.updatedAt && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Context Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={12} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingId(template.id);
                              setEditName(template.name);
                            }}
                          >
                            <FileEdit size={12} className="mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTemplateClick(template.id)}>
                            <RefreshCw size={12} className="mr-2" />
                            Reload
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              );
            })}
          </>
        ) : selectedProjectId ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No templates yet. Click "New Template" to create one.
          </div>
        ) : (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Select a project to see templates
          </div>
        )}
      </div>
    </div>
  );
}