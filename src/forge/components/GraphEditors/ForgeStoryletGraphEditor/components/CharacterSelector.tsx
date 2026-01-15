/**
 * CharacterSelector - Searchable combobox for selecting characters
 * Uses shadcn components for consistent UI
 */

import React, { useState, useMemo } from 'react';
import { ForgeCharacter } from '@/forge/types/characters';
import { Search, X, User, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

interface CharacterSelectorProps {
  characters?: Record<string, ForgeCharacter>;
  selectedCharacterId?: string;
  onSelect: (characterId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function CharacterSelector({
  characters = {},
  selectedCharacterId,
  onSelect,
  placeholder = 'Select character...',
  className = '',
  compact = false,
}: CharacterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : undefined;

  // Filter characters based on search query
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.entries(characters);
    }
    const query = searchQuery.toLowerCase();
    return Object.entries(characters).filter(([id, character]) => {
      return (
        character.name.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query) ||
        (character.description && character.description.toLowerCase().includes(query))
      );
    });
  }, [characters, searchQuery]);

  const handleSelect = (characterId: string) => {
    onSelect(characterId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(undefined);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Shared trigger button content
  const triggerContent = selectedCharacter ? (
    <>
      <span className={cn('flex-shrink-0', compact ? 'text-sm' : 'text-lg')}>
        {selectedCharacter.avatar || '👤'}
      </span>
      <span
        className={cn(
          'truncate',
          compact ? 'text-[10px] max-w-[80px]' : 'flex-1 text-left'
        )}
      >
        {selectedCharacter.name}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClear}
        className="flex-shrink-0 h-auto w-auto p-0.5 hover:bg-df-control-hover"
        title="Clear character"
        type="button"
      >
        <X size={compact ? 10 : 12} className="text-df-text-secondary" />
      </Button>
    </>
  ) : (
    <>
      <User size={compact ? 10 : 14} className="text-df-text-secondary flex-shrink-0" />
      <span
        className={cn(
          'text-df-text-secondary',
          compact ? 'text-[10px]' : 'flex-1 text-left'
        )}
      >
        {placeholder}
      </span>
      {!compact && <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />}
    </>
  );

  // Shared dropdown content
  const dropdownContent = (
    <DropdownMenuContent
      className={cn(
        'bg-df-sidebar-bg border-df-sidebar-border',
        compact ? 'w-48 max-h-48' : 'w-full max-h-64'
      )}
      align="start"
    >
      {/* Search Input */}
      <div className={cn('border-b border-df-sidebar-border', compact ? 'p-1.5' : 'p-2')}>
        <div className="relative">
          <Search
            size={compact ? 12 : 14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-df-text-secondary pointer-events-none"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={cn(
              'bg-df-elevated border-df-control-border text-df-text-primary placeholder:text-df-text-tertiary focus:border-df-control-hover',
              compact ? 'h-6 pl-6 text-[10px]' : 'pl-7'
            )}
            autoFocus
          />
        </div>
      </div>

      {/* Character List */}
      <div className="overflow-y-auto">
        {filteredCharacters.length === 0 ? (
          <div
            className={cn(
              'text-df-text-secondary text-center',
              compact ? 'p-2 text-[10px]' : 'p-3 text-sm'
            )}
          >
            {searchQuery ? (compact ? 'No matches' : 'No characters found') : (compact ? 'No characters' : 'No characters available')}
          </div>
        ) : (
          filteredCharacters.map(([id, character]) => (
            <Button
              key={id}
              variant="ghost"
              onClick={() => handleSelect(id)}
              className={cn(
                'w-full flex items-center justify-start hover:bg-df-elevated transition-colors',
                compact
                  ? 'gap-1.5 px-2 py-1 h-auto'
                  : 'gap-2 px-3 py-2',
                selectedCharacterId === id && 'bg-df-npc-selected/20'
              )}
            >
              <span className={cn('flex-shrink-0', compact ? 'text-sm' : 'text-lg')}>
                {character.avatar || '👤'}
              </span>
              {compact ? (
                <span className="text-[10px] text-df-text-primary truncate flex-1">
                  {character.name}
                </span>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-df-text-primary font-medium truncate">
                    {character.name}
                  </div>
                  {character.description && (
                    <div className="text-xs text-df-text-secondary truncate">
                      {character.description}
                    </div>
                  )}
                </div>
              )}
              {selectedCharacterId === id && (
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full bg-df-npc-selected',
                    compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
                  )}
                />
              )}
            </Button>
          ))
        )}
      </div>
    </DropdownMenuContent>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full flex items-center gap-2 bg-df-elevated border-df-control-border text-df-text-primary hover:border-df-control-hover transition-colors justify-start',
            compact && 'h-auto px-1.5 py-0.5 text-[10px]',
            className
          )}
        >
          {triggerContent}
        </Button>
      </DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  );
}
