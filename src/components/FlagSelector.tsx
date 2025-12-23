import React, { useState, useEffect, useRef } from 'react';
import { FlagSchema, FlagDefinition } from '../types/flags';
import { Info, X, BookOpen, Trophy, Package, TrendingUp, Crown, Globe, MessageSquare } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface FlagSelectorProps {
  value: string[];
  onChange: (flags: string[]) => void;
  flagSchema?: FlagSchema;
  placeholder?: string;
}

function getFlagColorClasses(flagType: string) {
  switch (flagType) {
    case 'quest':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'achievement':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'item':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'stat':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'title':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'global':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'dialogue':
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getFlagIcon(flagType: string) {
  switch (flagType) {
    case 'quest':
      return BookOpen;
    case 'achievement':
      return Trophy;
    case 'item':
      return Package;
    case 'stat':
      return TrendingUp;
    case 'title':
      return Crown;
    case 'global':
      return Globe;
    case 'dialogue':
    default:
      return MessageSquare;
  }
}

function getFlagTypeDescription(flagType: string): string {
  switch (flagType) {
    case 'quest':
      return 'Quest flags track mission and storyline progression. They persist across game sessions and control quest availability and completion states.';
    case 'achievement':
      return 'Achievement flags mark player accomplishments and milestones. They are permanent and unlock rewards or recognition.';
    case 'item':
      return 'Item flags represent inventory items, equipment, or collectibles. They track what the player has obtained.';
    case 'stat':
      return 'Stat flags store numeric values like reputation, health, or skill levels. They can be incremented, decremented, or compared in conditions.';
    case 'title':
      return 'Title flags represent player titles or ranks. They are typically set based on achievements or story progression.';
    case 'global':
      return 'Global flags are game-wide state variables that affect multiple systems. They persist across all game sessions.';
    case 'dialogue':
    default:
      return 'Dialogue flags are temporary, conversation-scoped variables. They reset between dialogue sessions and are used for local conversation state.';
  }
}

export function FlagSelector({ 
  value, 
  onChange, 
  flagSchema, 
  placeholder = "Add flags..."
}: FlagSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get flag definitions for selected flags
  const selectedFlags = value.map(flagId => {
    const flag = flagSchema?.flags.find(f => f.id === flagId);
    return flag ? { ...flag, id: flagId } : { id: flagId, type: 'dialogue' as const, name: flagId };
  });

  // Filter available flags (not already selected)
  const availableFlags = flagSchema?.flags.filter(flag => !value.includes(flag.id)) || [];

  // Filter flags based on input
  const filteredFlags = inputValue.trim()
    ? availableFlags.filter(flag => 
        flag.id.toLowerCase().includes(inputValue.toLowerCase()) ||
        flag.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : availableFlags;

  const flagsByCategory = filteredFlags.reduce((acc, flag) => {
    const cat = flag.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(flag);
    return acc;
  }, {} as Record<string, FlagDefinition[]>);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setShowDropdown(true);
  };

  // Handle adding a flag
  const handleAddFlag = (flagId: string) => {
    if (!value.includes(flagId)) {
      onChange([...value, flagId]);
      setInputValue('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  // Handle removing a flag
  const handleRemoveFlag = (flagId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(value.filter(id => id !== flagId));
  };

  // Handle input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // Try to find exact match first
      const exactMatch = availableFlags.find(
        flag => flag.id.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (exactMatch) {
        handleAddFlag(exactMatch.id);
        e.preventDefault();
      } else if (filteredFlags.length > 0) {
        // Add first filtered flag
        handleAddFlag(filteredFlags[0].id);
        e.preventDefault();
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last flag when backspace on empty input
      handleRemoveFlag(value[value.length - 1]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Tags container */}
      <div 
        className="w-full min-h-[30px] bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected flag tags */}
        {selectedFlags.map((flag, idx) => {
          const IconComponent = getFlagIcon(flag.type);
          const tooltipId = `flag-tooltip-${flag.id}-${idx}`;
          const description = getFlagTypeDescription(flag.type);
          
          return (
            <span
              key={flag.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono ${getFlagColorClasses(flag.type)}`}
            >
              <div className="relative group">
                <IconComponent 
                  size={12} 
                  className="cursor-help"
                  data-tooltip-id={tooltipId}
                />
                <Tooltip
                  id={tooltipId}
                  place="top"
                  border="2px solid rgba(255, 255, 255, 0.2)"
                  style={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '10px',
                    borderRadius: '6px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                    maxWidth: '280px',
                    zIndex: 10000,
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ffffff', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>
                    {flag.type} Flag
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', lineHeight: '1.5' }}>
                    {description}
                  </div>
                </Tooltip>
              </div>
              <span>{flag.id}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveFlag(flag.id, e)}
                className="hover:bg-black/20 rounded p-0.5 transition-colors"
                title="Remove flag"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-200 outline-none font-mono placeholder:text-gray-500"
          placeholder={value.length === 0 ? placeholder : ''}
        />
        
        {/* Info icon */}
        <div className="flex-shrink-0">
          <Info 
            size={14} 
            className="text-gray-500 hover:text-white transition-colors cursor-help" 
            data-tooltip-id="flags-tooltip"
          />
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip
        id="flags-tooltip"
        place="left"
        border="2px solid rgba(255, 255, 255, 0.2)"
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          maxWidth: '300px',
          zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ color: '#ffffff', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ffffff', marginBottom: '8px', fontSize: '14px' }}>FLAGS</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', lineHeight: '1.6' }}>
              <div>Game state variables that persist across dialogue sessions.</div>
              <div style={{ marginTop: '4px' }}>Use to track quest progress, achievements, items, stats, and more.</div>
              <div style={{ marginTop: '4px' }}>Flags can be checked in conditions to control dialogue flow.</div>
            </div>
          </div>
        </div>
      </Tooltip>
      
      {/* Dropdown */}
      {showDropdown && flagSchema && filteredFlags.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {Object.entries(flagsByCategory).map(([category, flags]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase border-b border-[#2a2a3e] bg-[#12121a]">
                {category}
              </div>
              {flags.map(flag => (
                <button
                  key={flag.id}
                  type="button"
                  onClick={() => handleAddFlag(flag.id)}
                  onMouseEnter={() => setFocusedIndex(flags.indexOf(flag))}
                  className={`w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a3e] flex items-center justify-between ${
                    focusedIndex === flags.indexOf(flag) ? 'bg-[#2a2a3e]' : ''
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs">{flag.id}</div>
                    {flag.name !== flag.id && (
                      <div className="text-xs text-gray-500">{flag.name}</div>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getFlagColorClasses(flag.type)}`}>
                    {flag.type === 'dialogue' ? 'temp' : flag.type}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
