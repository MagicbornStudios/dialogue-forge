'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface InlineRenameInputProps {
  value: string;
  onSave: (newValue: string) => void | Promise<void>;
  onCancel: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Inline rename input component for editing sidebar items
 * Supports Enter to save, Escape to cancel
 */
export function InlineRenameInput({
  value,
  onSave,
  onCancel,
  className,
  placeholder = 'Enter name...',
  autoFocus = true,
}: InlineRenameInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== value) {
      await onSave(trimmed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        'w-full px-2 py-1 text-xs font-medium',
        'bg-background border border-primary rounded',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        className
      )}
      placeholder={placeholder}
    />
  );
}
