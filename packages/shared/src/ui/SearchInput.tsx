import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@magicborn/shared/ui/input';
import { cn } from '@magicborn/shared/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-df-text-tertiary pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-7 h-8 text-xs"
      />
    </div>
  );
}
