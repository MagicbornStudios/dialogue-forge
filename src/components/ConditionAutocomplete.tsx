import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FlagSchema, FlagDefinition } from '../types/flags';
import { BookOpen, Trophy, Package, TrendingUp, Crown, Globe, MessageSquare } from 'lucide-react';

interface ConditionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  flagSchema?: FlagSchema;
  textarea?: boolean;
}

interface Suggestion {
  type: 'flag' | 'operator' | 'keyword';
  label: string;
  insert: string;
  description?: string;
  flagType?: string;
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

export function ConditionAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  style,
  flagSchema,
  textarea = false
}: ConditionAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract the current word being typed (for autocomplete matching)
  const currentWord = useMemo(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/(\$?\w*)$/);
    return match ? match[1] : '';
  }, [value, cursorPosition]);

  // Debounce search term for better performance
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(currentWord);
    }, 300); // 300ms debounce for smoother experience

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentWord]);

  // Generate suggestions based on current input (using debounced search term)
  const suggestions = useMemo(() => {
    const result: Suggestion[] = [];
    const word = debouncedSearchTerm.toLowerCase();
    const isTypingVariable = word.startsWith('$') || word.length > 0;

    // If typing a variable (starts with $ or has text), show flags
    if (flagSchema && (isTypingVariable || word === '')) {
      const searchTerm = word.startsWith('$') ? word.substring(1) : word;
      
      flagSchema.flags.forEach(flag => {
        const flagId = flag.id.toLowerCase();
        const flagName = flag.name.toLowerCase();
        
        // Match if search term is empty (showing $ or empty field) or matches flag id/name
        if (!searchTerm || flagId.includes(searchTerm) || flagName.includes(searchTerm)) {
          result.push({
            type: 'flag',
            label: `$${flag.id}`, // Show with dollar sign
            insert: `$${flag.id}`,
            description: flag.name,
            flagType: flag.type
          });
        }
      });
    }

    // Show operators and keywords when user has typed $ or is actively typing
    if (word === '$' || (word.startsWith('$') && word.length > 1)) {
      // Operators - only show when user has typed $ and is looking for what comes next
      result.push(
        { type: 'operator', label: '==', insert: ' == ', description: 'Equals' },
        { type: 'operator', label: '!=', insert: ' != ', description: 'Not equals' },
        { type: 'operator', label: '>=', insert: ' >= ', description: 'Greater than or equal' },
        { type: 'operator', label: '<=', insert: ' <= ', description: 'Less than or equal' },
        { type: 'operator', label: '>', insert: ' > ', description: 'Greater than' },
        { type: 'operator', label: '<', insert: ' < ', description: 'Less than' }
      );
      
      // Keywords
      result.push(
        { type: 'keyword', label: 'and', insert: ' and ', description: 'Logical AND' },
        { type: 'keyword', label: 'not', insert: 'not ', description: 'Logical NOT' }
      );
    }

    // Limit results
    return result.slice(0, 20);
  }, [debouncedSearchTerm, flagSchema]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    
    // Mark that user has actively typed
    setHasActivelyTyped(true);
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
  };

  // Track if user has actively typed in this session (not just focused on existing content)
  const [hasActivelyTyped, setHasActivelyTyped] = useState(false);

  // Update suggestions visibility when value or cursor changes
  // Show suggestions when typing $ or when actively typing
  useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/(\$?\w*)$/);
    const word = match ? match[1] : '';
    
    // Show suggestions when:
    // 1. User is typing a variable (starts with $) OR
    // 2. User has actively typed something and we have suggestions OR
    // 3. Field is empty and user just focused (allow showing on empty field when typing $)
    const isTypingVariable = word.startsWith('$') || word === '$';
    const isEmpty = value.trim() === '';
    const shouldShow = (hasActivelyTyped || isTypingVariable || isEmpty) && suggestions.length > 0;
    setShowSuggestions(shouldShow);
  }, [value, cursorPosition, suggestions.length, hasActivelyTyped]);

  // Handle selection change (for cursor tracking)
  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setCursorPosition(target.selectionStart || 0);
  };

  // Handle keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape' && onBlur) {
        onBlur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Insert suggestion at cursor position
  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the start of the current word
    const wordMatch = textBeforeCursor.match(/(\$?\w*)$/);
    const wordStart = wordMatch ? cursorPosition - wordMatch[1].length : cursorPosition;
    
    // Replace the current word with the suggestion
    const newText = 
      value.substring(0, wordStart) + 
      suggestion.insert + 
      textAfterCursor;
    
    onChange(newText);
    
    // Set cursor position after inserted text
    const newCursorPos = wordStart + suggestion.insert.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
    
    setShowSuggestions(false);
    setSelectedIndex(0);
  }, [value, cursorPosition, onChange]);

  // Handle drag start for draggable suggestions
  const handleDragStart = useCallback((e: React.DragEvent, suggestion: Suggestion) => {
    e.dataTransfer.setData('text/plain', suggestion.insert);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const InputComponent = textarea ? 'textarea' : 'input';

  const inputProps: any = {
    ref: inputRef as any,
    type: textarea ? undefined : 'text',
    value,
    onChange: handleChange,
    onSelect: handleSelect,
    onKeyDown: handleKeyDown,
    onFocus: () => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
      // Don't reset hasActivelyTyped on focus - allow showing suggestions if field is empty or has $
      // This allows suggestions to show when user focuses and types $
    },
    onBlur: () => {
      // Delay to allow click on suggestion
      setTimeout(() => {
        if (onBlur) onBlur();
      }, 200);
    },
    placeholder,
    className,
  };

  if (style) {
    inputProps.style = style;
  }

  return (
    <div className="relative" ref={containerRef}>
      <InputComponent {...inputProps} />
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, idx) => {
            const isSelected = idx === selectedIndex;
            const IconComponent = suggestion.type === 'flag' && suggestion.flagType 
              ? getFlagIcon(suggestion.flagType) 
              : null;
            
            // Get color classes for operators and keywords
            const operatorColorClasses = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            const keywordColorClasses = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            
            return (
              <button
                key={`${suggestion.type}-${suggestion.label}-${idx}`}
                type="button"
                onClick={() => insertSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(idx)}
                draggable
                onDragStart={(e) => handleDragStart(e, suggestion)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  isSelected 
                    ? 'bg-[#2a2a3e] text-white' 
                    : 'text-gray-300 hover:bg-[#252538]'
                }`}
                style={{ minHeight: 'auto', height: 'auto' }} // Prevent expanding
              >
                {/* Flag: Show as tag with icon */}
                {suggestion.type === 'flag' && suggestion.flagType && (
                  <>
                    {IconComponent && (
                      <IconComponent 
                        size={14} 
                        className={`flex-shrink-0 ${getFlagColorClasses(suggestion.flagType).split(' ')[1]}`}
                      />
                    )}
                    <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 font-medium whitespace-nowrap ${getFlagColorClasses(suggestion.flagType)}`}>
                      {suggestion.label}
                    </span>
                    {suggestion.description && (
                      <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0 ml-1">
                        {suggestion.description}
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 whitespace-nowrap ${getFlagColorClasses(suggestion.flagType)}`}>
                      {suggestion.flagType === 'dialogue' ? 'temp' : suggestion.flagType}
                    </span>
                  </>
                )}
                
                {/* Operator: Show as tag */}
                {suggestion.type === 'operator' && (
                  <>
                    <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 font-mono font-medium whitespace-nowrap ${operatorColorClasses}`}>
                      {suggestion.label}
                    </span>
                    {suggestion.description && (
                      <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0 ml-1">
                        {suggestion.description}
                      </span>
                    )}
                  </>
                )}
                
                {/* Keyword: Show as tag */}
                {suggestion.type === 'keyword' && (
                  <>
                    <span className={`text-xs px-2 py-1 rounded border flex-shrink-0 font-mono font-medium whitespace-nowrap ${keywordColorClasses}`}>
                      {suggestion.label}
                    </span>
                    {suggestion.description && (
                      <span className="text-[10px] text-gray-500 truncate flex-1 min-w-0 ml-1">
                        {suggestion.description}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

