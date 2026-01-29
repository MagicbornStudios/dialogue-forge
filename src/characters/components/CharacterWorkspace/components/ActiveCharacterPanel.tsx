'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { FileUpload } from '@/shared/ui/file-upload';
import type { CharacterDoc } from '@/characters/types';
import type { CharacterWorkspaceAdapter } from '@/characters/types';
import { Users, Edit2, Check, X, Edit } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ActiveCharacterPanelProps {
  character: CharacterDoc | null;
  onUpdate?: (updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }) => Promise<void>;
  dataAdapter?: CharacterWorkspaceAdapter;
  className?: string;
}

export function ActiveCharacterPanel({
  character,
  onUpdate,
  dataAdapter,
  className,
}: ActiveCharacterPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [name, setName] = useState(character?.name || '');
  const [description, setDescription] = useState(character?.description || '');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Update form when character changes
  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setDescription(character.description || '');
      // avatarId is not directly available on CharacterDoc, will be set via updates
    }
  }, [character]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField === 'name' && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    } else if (editingField === 'description' && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [editingField]);

  const handleSaveAll = async () => {
    if (!onUpdate || !character || !name.trim()) return;
    
    setIsSaving(true);
    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim() || undefined,
        avatarId: avatarId,
      });
      setIsEditing(false);
      setEditingField(null);
      setAvatarId(null); // Reset after save
    } catch (error) {
      console.error('Failed to update character:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAll = () => {
    if (character) {
      setName(character.name || '');
      setDescription(character.description || '');
    }
    setAvatarId(null);
    setIsEditing(false);
    setEditingField(null);
  };

  const handleSaveField = async (field: 'name' | 'description') => {
    if (!onUpdate || !character) return;
    
    if (field === 'name' && !name.trim()) {
      setName(character.name || '');
      setEditingField(null);
      return;
    }
    
    setIsSaving(true);
    try {
      const updates: { name?: string; description?: string } = {};
      if (field === 'name') updates.name = name.trim();
      if (field === 'description') updates.description = description.trim() || undefined;
      
      await onUpdate(updates);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update character:', error);
      // Reset on error
      if (character) {
        if (field === 'name') setName(character.name || '');
        if (field === 'description') setDescription(character.description || '');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelField = (field: 'name' | 'description') => {
    if (character) {
      if (field === 'name') setName(character.name || '');
      if (field === 'description') setDescription(character.description || '');
    }
    setEditingField(null);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    if (!dataAdapter) {
      throw new Error('Data adapter not available');
    }
    setIsUploading(true);
    try {
      const result = await dataAdapter.uploadMedia(file);
      setAvatarId(result.id);
      return result.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarId(null);
  };

  // Get display image URL (prefer avatarUrl, fallback to imageUrl)
  const displayImageUrl = character?.avatarUrl || character?.imageUrl;

  if (!character) {
    return (
      <div className={cn('w-64 h-full bg-background border-r border-border p-6', className)}>
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No active character</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-64 h-full bg-background border-r border-border flex flex-col', className)}>
      {/* Lore Book Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Character Portrait - Large, prominent at top */}
        <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden border-b border-border flex-shrink-0 group">
          {/* Edit button - positioned over image top-right */}
          {!isEditing && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10 shadow-md"
              onClick={() => setIsEditing(true)}
              title="Edit character"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {/* Save/Cancel buttons - positioned over image top-right when editing */}
          {isEditing && (
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={handleSaveAll}
                disabled={!name.trim() || isSaving || isUploading}
                title="Save changes"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                onClick={handleCancelAll}
                disabled={isSaving || isUploading}
                title="Cancel editing"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Background image - always visible */}
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-full flex items-center justify-center bg-muted';
                  placeholder.innerHTML = '<svg class="h-16 w-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                  target.parentElement.appendChild(placeholder);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Users className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
          )}
          
          {/* Edit overlay - appears only on hover when in editing mode */}
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-0">
              <div className="w-full h-full flex items-center justify-center">
                <FileUpload
                  value={displayImageUrl}
                  onUpload={handleFileUpload}
                  onRemove={handleRemoveAvatar}
                  disabled={isUploading || isSaving}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Character Details - Lore Book Style */}
        <div className="p-5 space-y-4 flex-1">
          {/* Character Name - Title Style */}
          <div className="space-y-1">
            {isEditing || editingField === 'name' ? (
              <Input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditing) {
                    e.preventDefault();
                    handleSaveField('name');
                  }
                  if (e.key === 'Escape' && !isEditing) {
                    handleCancelField('name');
                  }
                }}
                onBlur={() => {
                  if (!isEditing) {
                    handleSaveField('name');
                  }
                }}
                className="text-xl font-bold h-9 border-0 border-b-2 border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                placeholder="Character name"
              />
            ) : (
              <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">
                {name || 'Unnamed'}
              </h1>
            )}
            {/* Decorative line under name */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-2" />
          </div>

          {/* Description - Lore Text Style */}
          <div className="space-y-2">
            {isEditing || editingField === 'description' ? (
              <Textarea
                ref={descriptionInputRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && !isEditing) {
                    handleCancelField('description');
                  }
                }}
                onBlur={() => {
                  if (!isEditing) {
                    handleSaveField('description');
                  }
                }}
                className="min-h-[120px] text-sm leading-relaxed border-0 bg-transparent px-0 focus-visible:ring-0 resize-none"
                placeholder="Enter character lore and description..."
              />
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {description ? (
                  <p className="text-foreground/90">{description}</p>
                ) : (
                  <p className="italic text-muted-foreground/60">No description recorded in the archives.</p>
                )}
              </div>
            )}
          </div>

          {/* Active Badge - Subtle */}
          {!isEditing && (
            <div className="pt-2">
              <Badge variant="outline" className="text-xs font-normal">
                Active Character
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
