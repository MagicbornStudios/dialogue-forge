/**
 * CharacterSelector - Combobox with search for selecting characters
 */

import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types/characters';
import { Search, X, User } from 'lucide-react';

interface CharacterSelectorProps {
  characters?: Record<string, Character>;
  selectedCharacterId?: string;
  onSelect: (characterId: string | undefined) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean; // Compact mode for conditional blocks
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCharacter = selectedCharacterId ? characters[selectedCharacterId] : undefined;

  // Filter characters based on search query
  const filteredCharacters = Object.entries(characters).filter(([id, character]) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      character.name.toLowerCase().includes(query) ||
      character.id.toLowerCase().includes(query) ||
      (character.description && character.description.toLowerCase().includes(query))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when dropdown opens
      setTimeout(() => inputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  // Compact mode for conditional blocks
  if (compact) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        {/* Compact Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 bg-df-elevated border border-df-control-border rounded px-1.5 py-0.5 text-[10px] text-df-text-primary hover:border-df-control-hover transition-colors"
        >
          {selectedCharacter ? (
            <>
              <span className="text-sm flex-shrink-0">{selectedCharacter.avatar || '👤'}</span>
              <span className="text-[10px] truncate max-w-[80px]">{selectedCharacter.name}</span>
              <button
                onClick={handleClear}
                className="flex-shrink-0 p-0.5 hover:bg-df-control-hover rounded"
                title="Clear character"
              >
                <X size={10} className="text-df-text-secondary" />
              </button>
            </>
          ) : (
            <>
              <User size={10} className="text-df-text-secondary flex-shrink-0" />
              <span className="text-[10px] text-df-text-secondary">{placeholder}</span>
            </>
          )}
        </button>

        {/* Compact Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-48 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-xl max-h-48 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-1.5 border-b border-df-sidebar-border">
              <div className="relative">
                <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-df-text-secondary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-df-elevated border border-df-control-border rounded px-1.5 py-1 pl-6 text-[10px] text-df-text-primary placeholder:text-df-text-tertiary focus:border-df-control-hover outline-none"
                />
              </div>
            </div>

            {/* Character List */}
            <div className="overflow-y-auto">
              {filteredCharacters.length === 0 ? (
                <div className="p-2 text-[10px] text-df-text-secondary text-center">
                  {searchQuery ? 'No matches' : 'No characters'}
                </div>
              ) : (
                filteredCharacters.map(([id, character]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-df-elevated transition-colors ${
                      selectedCharacterId === id ? 'bg-df-npc-selected/20' : ''
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{character.avatar || '👤'}</span>
                    <span className="text-[10px] text-df-text-primary truncate flex-1">
                      {character.name}
                    </span>
                    {selectedCharacterId === id && (
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-df-npc-selected" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode (existing)
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 bg-df-elevated border border-df-control-border rounded px-2 py-1.5 text-sm text-df-text-primary hover:border-df-control-hover transition-colors"
      >
        {selectedCharacter ? (
          <>
            <span className="text-lg flex-shrink-0">{selectedCharacter.avatar || '👤'}</span>
            <span className="flex-1 text-left truncate">{selectedCharacter.name}</span>
            <button
              onClick={handleClear}
              className="flex-shrink-0 p-0.5 hover:bg-df-control-hover rounded"
              title="Clear character"
            >
              <X size={12} className="text-df-text-secondary" />
            </button>
          </>
        ) : (
          <>
            <User size={14} className="text-df-text-secondary flex-shrink-0" />
            <span className="flex-1 text-left text-df-text-secondary">{placeholder}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-df-sidebar-border">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-df-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1.5 pl-7 text-sm text-df-text-primary placeholder:text-df-text-tertiary focus:border-df-control-hover outline-none"
              />
            </div>
          </div>

          {/* Character List */}
          <div className="overflow-y-auto">
            {filteredCharacters.length === 0 ? (
              <div className="p-3 text-sm text-df-text-secondary text-center">
                {searchQuery ? 'No characters found' : 'No characters available'}
              </div>
            ) : (
              filteredCharacters.map(([id, character]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-df-elevated transition-colors ${
                    selectedCharacterId === id ? 'bg-df-npc-selected/20' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{character.avatar || '👤'}</span>
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
                  {selectedCharacterId === id && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-df-npc-selected" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

