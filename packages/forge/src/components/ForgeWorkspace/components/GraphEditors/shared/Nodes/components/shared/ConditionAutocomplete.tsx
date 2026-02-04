import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { FlagSchema, FlagType } from '@magicborn/forge/types/flags';
import { flagTypeIcons, flagTypeLabels } from '@magicborn/forge/lib/flag-manager/utils/flag-constants';
import { flagTypeColors } from '@magicborn/forge/lib/flag-manager/utils/flag-constants';
import { CONDITION_OPERATOR_SYMBOLS } from '@magicborn/forge/types/constants';
import { DOM_EVENT_TYPE, KEYBOARD_KEY } from '@magicborn/shared/types';
import { Input } from '@magicborn/shared/ui/input';
import { Textarea } from '@magicborn/shared/ui/textarea';
import { Button } from '@magicborn/shared/ui/button';
import { cn } from '@magicborn/shared/lib/utils';

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

export const SUGGESTION_TYPE = {
  FLAG: 'flag',
  OPERATOR: 'operator',
  KEYWORD: 'keyword',
} as const;

interface Suggestion {
  type: typeof SUGGESTION_TYPE[keyof typeof SUGGESTION_TYPE];
  label: string;
  insert: string;
  description?: string;
  flagType?: FlagType;
  // Pre-computed for performance
  flagColorClasses?: string;
  flagLabel?: string;
  iconClassName?: string;
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
  const [open, setOpen] = useState(false);
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
  // Pre-computes expensive lookups (colors, labels) for performance
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
          const flagType = flag.type as FlagType;
          const colorClasses = flagTypeColors[flagType as keyof typeof flagTypeColors];
          const colorParts = colorClasses?.split(' ') || [];
          
          result.push({
            type: SUGGESTION_TYPE.FLAG,
            label: `$${flag.id}`, // Show with dollar sign
            insert: `$${flag.id}`,
            description: flag.name,
            flagType,
            // Pre-compute expensive lookups
            flagColorClasses: colorClasses,
            flagLabel: flagTypeLabels[flagType as keyof typeof flagTypeLabels],
            iconClassName: colorParts[1] || ''
          });
        }
      });
    }

    // Show operators and keywords when user has typed $ or is actively typing
    if (word === '$' || (word.startsWith('$') && word.length > 1)) {
      // Operators - only show when user has typed $ and is looking for what comes next
      result.push(
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.EQUALS, insert: CONDITION_OPERATOR_SYMBOLS.EQUALS, description: 'Equals' },
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.NOT_EQUALS, insert: CONDITION_OPERATOR_SYMBOLS.NOT_EQUALS, description: 'Not equals' },
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.GREATER_EQUAL, insert: CONDITION_OPERATOR_SYMBOLS.GREATER_EQUAL, description: 'Greater than or equal' },
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.LESS_EQUAL, insert: CONDITION_OPERATOR_SYMBOLS.LESS_EQUAL, description: 'Less than or equal' },
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.GREATER_THAN, insert: CONDITION_OPERATOR_SYMBOLS.GREATER_THAN, description: 'Greater than' },
        { type: SUGGESTION_TYPE.OPERATOR, label: CONDITION_OPERATOR_SYMBOLS.LESS_THAN, insert: CONDITION_OPERATOR_SYMBOLS.LESS_THAN, description: 'Less than' }
      );
      
      // Keywords
      result.push(
        { type: SUGGESTION_TYPE.KEYWORD, label: CONDITION_OPERATOR_SYMBOLS.AND, insert: ` ${CONDITION_OPERATOR_SYMBOLS.AND} `, description: 'Logical AND' },
        { type: SUGGESTION_TYPE.KEYWORD, label: CONDITION_OPERATOR_SYMBOLS.NOT, insert: ` ${CONDITION_OPERATOR_SYMBOLS.NOT} `, description: 'Logical NOT' }
      );
    }

    // Limit results
    return result.slice(0, 20);
  }, [debouncedSearchTerm, flagSchema]);

  // Track if user has actively typed in this session (not just focused on existing content)
  const [hasActivelyTyped, setHasActivelyTyped] = useState(false);

  // Handle input change - memoized to prevent unnecessary re-renders
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    
    // Mark that user has actively typed
    setHasActivelyTyped(true);
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
  }, [onChange]);

  // Memoize regex for word matching (used in multiple places)
  const wordMatchRegex = useMemo(() => /(\$?\w*)$/, []);

  // Update suggestions visibility when value or cursor changes
  // Show suggestions when typing $ or when actively typing
  useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(wordMatchRegex);
    const word = match ? match[1] : '';
    
    // Show suggestions when:
    // 1. User is typing a variable (starts with $) OR
    // 2. User has actively typed something and we have suggestions OR
    // 3. Field is empty and user just focused (allow showing on empty field when typing $)
    const isTypingVariable = word.startsWith('$') || word === '$';
    const isEmpty = value.trim() === '';
    const shouldShow = (hasActivelyTyped || isTypingVariable || isEmpty) && suggestions.length > 0;
    setOpen(shouldShow);
  }, [value, cursorPosition, suggestions.length, hasActivelyTyped, wordMatchRegex]);

  // Handle selection change (for cursor tracking) - memoized
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setCursorPosition(target.selectionStart || 0);
  }, []);

  // Insert suggestion at cursor position - memoized
  const insertSuggestion = useCallback((suggestion: Suggestion) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the start of the current word
    const wordMatch = textBeforeCursor.match(wordMatchRegex);
    const wordStart = wordMatch ? cursorPosition - wordMatch[1].length : cursorPosition;
    
    // Replace the current word with the suggestion
    const newText = 
      value.substring(0, wordStart) + 
      suggestion.insert + 
      textAfterCursor;
    
    onChange(newText);
    
    // Set cursor position after inserted text - use requestAnimationFrame for better performance
    const newCursorPos = wordStart + suggestion.insert.length;
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    });
    
    setOpen(false);
    setSelectedIndex(0);
  }, [value, cursorPosition, onChange, wordMatchRegex]);

  // Handle keydown - memoized with stable dependencies
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === KEYBOARD_KEY.ESCAPE && onBlur) {
        onBlur();
      }
      return;
    }

    if (e.key === KEYBOARD_KEY.ARROW_DOWN) {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === KEYBOARD_KEY.ARROW_UP) {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === KEYBOARD_KEY.ENTER || e.key === KEYBOARD_KEY.TAB) {
      e.preventDefault();
      insertSuggestion(suggestions[selectedIndex]);
    } else if (e.key === KEYBOARD_KEY.ESCAPE) {
      setOpen(false);
    }
  }, [open, suggestions, selectedIndex, insertSuggestion, onBlur]);

  // Handle drag start for draggable suggestions
  const handleDragStart = useCallback((e: React.DragEvent, suggestion: Suggestion) => {
    e.dataTransfer.setData('text/plain', suggestion.insert);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle click outside - memoized handler using constants
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener(DOM_EVENT_TYPE.MOUSE_DOWN, handleClickOutside);
      return () => {
        document.removeEventListener(DOM_EVENT_TYPE.MOUSE_DOWN, handleClickOutside);
      };
    }
  }, [open, handleClickOutside]);

  // Memoize focus handler
  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
    // Don't reset hasActivelyTyped on focus - allow showing suggestions if field is empty or has $
    // This allows suggestions to show when user focuses and types $
  }, []);

  // Memoize blur handler
  const handleBlurInternal = useCallback(() => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (onBlur) onBlur();
    }, 200);
  }, [onBlur]);

  // Memoized suggestion item component for better performance
  const SuggestionItem = React.memo<{
    suggestion: Suggestion;
    index: number;
    isSelected: boolean;
    onSelect: (suggestion: Suggestion) => void;
    onHover: (index: number) => void;
    onDragStart: (e: React.DragEvent, suggestion: Suggestion) => void;
  }>(({ suggestion, index, isSelected, onSelect, onHover, onDragStart }) => {
    const IconComponent = suggestion.type === SUGGESTION_TYPE.FLAG && suggestion.flagType 
      ? flagTypeIcons[suggestion.flagType as keyof typeof flagTypeIcons] 
      : null;
    
    // Constants moved outside render
    const operatorColorClasses = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    const keywordColorClasses = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    
    // Memoize click handler
    const handleClick = useCallback(() => {
      onSelect(suggestion);
    }, [onSelect, suggestion]);
    
    // Memoize hover handler
    const handleMouseEnter = useCallback(() => {
      onHover(index);
    }, [onHover, index]);
    
    // Memoize drag handler
    const handleDrag = useCallback((e: React.DragEvent) => {
      onDragStart(e, suggestion);
    }, [onDragStart, suggestion]);
    
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        draggable
        onDragStart={handleDrag}
        className={cn(
          "w-full justify-start text-left px-3 py-2 text-sm h-auto",
          isSelected && "bg-df-control-hover text-df-text-primary"
        )}
      >
        {/* Flag: Show as tag with icon */}
        {suggestion.type === SUGGESTION_TYPE.FLAG && suggestion.flagType && suggestion.flagColorClasses && (
          <>
            {IconComponent && suggestion.iconClassName && (
              <IconComponent 
                size={14} 
                className={cn("flex-shrink-0", suggestion.iconClassName)}
              />
            )}
            <span className={cn("text-xs px-2 py-1 rounded border flex-shrink-0 font-medium whitespace-nowrap", suggestion.flagColorClasses)}>
              {suggestion.label}
            </span>
            {suggestion.description && (
              <span className="text-[10px] text-df-text-tertiary truncate flex-1 min-w-0 ml-1">
                {suggestion.description}
              </span>
            )}
            {suggestion.flagLabel && (
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 whitespace-nowrap", suggestion.flagColorClasses)}>
                {suggestion.flagLabel}
              </span>
            )}
          </>
        )}
        
        {/* Operator: Show as tag */}
        {suggestion.type === SUGGESTION_TYPE.OPERATOR && (
          <>
            <span className={cn("text-xs px-2 py-1 rounded border flex-shrink-0 font-mono font-medium whitespace-nowrap", operatorColorClasses)}>
              {suggestion.label}
            </span>
            {suggestion.description && (
              <span className="text-[10px] text-df-text-tertiary truncate flex-1 min-w-0 ml-1">
                {suggestion.description}
              </span>
            )}
          </>
        )}
        
        {/* Keyword: Show as tag */}
        {suggestion.type === SUGGESTION_TYPE.KEYWORD && (
          <>
            <span className={cn("text-xs px-2 py-1 rounded border flex-shrink-0 font-mono font-medium whitespace-nowrap", keywordColorClasses)}>
              {suggestion.label}
            </span>
            {suggestion.description && (
              <span className="text-[10px] text-df-text-tertiary truncate flex-1 min-w-0 ml-1">
                {suggestion.description}
              </span>
            )}
          </>
        )}
      </Button>
    );
  });

  SuggestionItem.displayName = 'SuggestionItem';

  // Memoize handlers for suggestion items
  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    insertSuggestion(suggestion);
  }, [insertSuggestion]);

  const handleSuggestionHover = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const InputComponent = textarea ? Textarea : Input;

  return (
    <div className="relative" ref={containerRef}>
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlurInternal}
        placeholder={placeholder}
        className={className}
        style={style}
      />
      
      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-df-elevated border border-df-control-border rounded-lg shadow-xl max-h-64 overflow-y-auto p-1">
          <div className="space-y-1">
            {suggestions.map((suggestion, idx) => (
              <SuggestionItem
                key={`${suggestion.type}-${suggestion.label}-${idx}`}
                suggestion={suggestion}
                index={idx}
                isSelected={idx === selectedIndex}
                onSelect={handleSuggestionSelect}
                onHover={handleSuggestionHover}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
