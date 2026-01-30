'use client';

import React from 'react';
import { SearchInput } from '@/shared/ui/SearchInput';
import type { SidebarTab } from './types';

interface CharacterSidebarSearchProps {
  activeTab: SidebarTab;
  value: string;
  onChange: (value: string) => void;
}

export function CharacterSidebarSearch({ activeTab, value, onChange }: CharacterSidebarSearchProps) {
  return (
    <div className="px-2 py-2 border-b border-border">
      <SearchInput
        placeholder={activeTab === 'characters' ? 'Search characters...' : 'Search relationships...'}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  );
}
