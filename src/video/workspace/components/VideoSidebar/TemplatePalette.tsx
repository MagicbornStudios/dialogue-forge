'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, MoreVertical, RefreshCw, FileEdit, Film, Copy, Trash2 } from 'lucide-react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { DEFAULT_BLANK_TEMPLATE } from '@/video/templates/default-templates';
import { VIDEO_TEMPLATE_PRESET_BY_ID } from '@/video/templates/presets';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  const committedGraph = useVideoWorkspaceStore((s) => s.committedGraph);
  const lastCommittedAt = useVideoWorkspaceStore((s) => s.lastCommittedAt);
  const resetDraft = useVideoWorkspaceStore((s) => s.actions.resetDraft);
  const adapter = useVideoWorkspaceStore((s) => s.adapter);
  const selectedProjectId = useVideoWorkspaceStore((s) => s.selectedProjectId);
  
  // Use committedGraph ID for highlighting (the actual saved template)
  // Fall back to draftGraph ID if no committed template yet
  const activeTemplateId = committedGraph?.id || draftGraph?.id;
  
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Cache tracking: projectId -> { templates, timestamp }
  const cacheRef = useRef<{
    projectId: number | null;
    templates: TemplateSummary[];
    timestamp: number;
  }>({
    projectId: null,
    templates: [],
    timestamp: 0,
  });

  // Load templates from adapter (with caching)
  const loadTemplates = useCallback(async (forceRefresh = false) => {
    if (!adapter || !selectedProjectId) {
      setTemplates([]);
      cacheRef.current = { projectId: null, templates: [], timestamp: 0 };
      return;
    }
    
    // Check cache: if we have templates for this project and they're recent (< 30 seconds), use cache
    const cache = cacheRef.current;
    const now = Date.now();
    const cacheAge = now - cache.timestamp;
    const CACHE_TTL = 30000; // 30 seconds
    
    if (!forceRefresh && 
        cache.projectId === selectedProjectId && 
        cache.templates.length > 0 && 
        cacheAge < CACHE_TTL) {
      // Use cached templates
      setTemplates(cache.templates);
      return;
    }
    
    setIsLoading(true);
    try {
      const templateList = await adapter.listTemplates();
      setTemplates(templateList);
      // Update cache
      cacheRef.current = {
        projectId: selectedProjectId,
        templates: templateList,
        timestamp: now,
      };
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adapter, selectedProjectId]);

  // Load templates when project or adapter changes
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Refresh templates after save (only when lastCommittedAt changes, indicating a save)
  const lastCommittedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastCommittedAt && lastCommittedAt !== lastCommittedAtRef.current) {
      lastCommittedAtRef.current = lastCommittedAt;
      
      // Only refresh if we saved a user template (not a preset)
      if (committedGraph?.id && committedGraph.id !== DEFAULT_BLANK_TEMPLATE.id) {
        const templateId = committedGraph.id;
        const isPreset = templateId.startsWith('preset-') || VIDEO_TEMPLATE_PRESET_BY_ID[templateId];
        if (!isPreset) {
          // Small delay to ensure backend has processed the save, then force refresh
          const timeout = setTimeout(() => {
            loadTemplates(true);
          }, 500);
          return () => clearTimeout(timeout);
        }
      }
    }
  }, [lastCommittedAt, committedGraph?.id, loadTemplates]);

  const handleTemplateClick = async (templateId: string) => {
    if (!adapter) {
      console.error('❌ No adapter available');
      return;
    }
    
    console.log('📄 Loading template:', templateId);
    
    try {
      const template = await adapter.loadTemplate(templateId);
      if (template) {
        console.log('✅ Template loaded:', template.name, 'Layers:', template.scenes[0]?.layers.length);
        resetDraft(template);
      } else {
        console.error('❌ Template not found:', templateId);
      }
    } catch (error) {
      console.error('❌ Failed to load template:', error);
    }
  };
  
  const handleBlankClick = () => {
    console.log('📄 Loading blank template');
    console.log('📄 Blank template data:', DEFAULT_BLANK_TEMPLATE);
    resetDraft(DEFAULT_BLANK_TEMPLATE);
    console.log('✅ Blank template loaded into draft');
  };
  
  const handleRename = async (templateId: string, newName: string) => {
    if (!adapter || !newName.trim()) return;
    
    try {
      const template = await adapter.loadTemplate(templateId);
      if (template) {
        template.name = newName.trim();
        await adapter.saveTemplate(template);
        await loadTemplates(true); // Force refresh after rename
      }
    } catch (error) {
      console.error('Failed to rename template:', error);
    } finally {
      setEditingId(null);
      setEditName('');
    }
  };
  
  const handleDuplicate = async (templateId: string) => {
    if (!adapter) return;
    
    try {
      console.log('📄 Duplicating template:', templateId);
      const template = await adapter.loadTemplate(templateId);
      if (template) {
        // Create a copy with new ID and name
        const duplicatedTemplate = {
          ...template,
          id: `template_${Date.now()}`,
          name: `${template.name} (Copy)`,
        };
        
        console.log('📄 Created duplicate:', duplicatedTemplate.name);
        
        // Save the duplicate
        await adapter.saveTemplate(duplicatedTemplate);
        
        // Refresh list and load the duplicate
        await loadTemplates(true); // Force refresh after duplicate
        resetDraft(duplicatedTemplate);
        
        console.log('✅ Template duplicated successfully');
      }
    } catch (error) {
      console.error('❌ Failed to duplicate template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!adapter || !adapter.deleteTemplate) return;
    
    // Don't allow deleting presets or blank template
    const isPreset = templateId.startsWith('preset-') || VIDEO_TEMPLATE_PRESET_BY_ID[templateId];
    const isBlank = templateId === DEFAULT_BLANK_TEMPLATE.id;
    if (isPreset || isBlank) {
      console.warn('Cannot delete preset or blank template');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${templates.find(t => t.id === templateId)?.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(templateId);
    try {
      await adapter.deleteTemplate(templateId);
      
      // If the deleted template was active, reset to blank
      if (draftGraph?.id === templateId) {
        resetDraft(DEFAULT_BLANK_TEMPLATE);
      }
      
      // Refresh the list
      await loadTemplates(true); // Force refresh after delete
      console.log('✅ Template deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      alert(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const isPresetTemplate = (templateId: string): boolean => {
    return templateId.startsWith('preset-') || 
           templateId === DEFAULT_BLANK_TEMPLATE.id ||
           !!VIDEO_TEMPLATE_PRESET_BY_ID[templateId];
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header - No duplicate "Templates" text since tab already shows it */}
      <div className="px-3 py-2 border-b border-border">
        <div className="text-[10px] text-muted-foreground">
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
            activeTemplateId === DEFAULT_BLANK_TEMPLATE.id && 'bg-[var(--color-df-video)]/10 text-[var(--color-df-video)] border-l-2 border-l-[var(--color-df-video)]'
          )}
        >
          <Layout 
            size={14} 
            className={cn(
              'shrink-0',
              activeTemplateId === DEFAULT_BLANK_TEMPLATE.id ? 'text-[var(--color-df-video)]' : 'text-muted-foreground'
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
        ) : (() => {
          const userTemplates = templates.filter(t => !isPresetTemplate(t.id));
          return userTemplates.length > 0 ? (
            <>
              <div className="px-3 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">
                My Templates
              </div>
              {userTemplates.map((template) => {
                // Check both committedGraph and draftGraph IDs for highlighting
                // This handles cases where template is loaded but not yet saved
                const isActive = activeTemplateId === template.id || draftGraph?.id === template.id;
                const isEditing = editingId === template.id;
                const isDeleting = deletingId === template.id;
                const canDelete = adapter?.deleteTemplate && !isPresetTemplate(template.id);
                
                return (
                  <div
                    key={template.id}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2 text-xs',
                      'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'transition-colors relative',
                      isActive && 'bg-[var(--color-df-video)]/10 text-[var(--color-df-video)] border-l-2 border-l-[var(--color-df-video)]',
                      isDeleting && 'opacity-50'
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
                              disabled={isDeleting}
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
                            <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                              <Copy size={12} className="mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(template.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={12} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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
          );
        })()}
      </div>
    </div>
  );
}