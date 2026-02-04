import { useState, useMemo } from 'react';
import type { FlagSchema, FlagDefinition } from '@magicborn/forge/types/flags';
import { groupFlagsByType, getSectionCounts } from '../utils/flag-helpers';

export function useFlagManager(flagSchema: FlagSchema) {
  const [editingFlag, setEditingFlag] = useState<FlagDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const flagsByType = useMemo(() => {
    return groupFlagsByType(flagSchema.flags);
  }, [flagSchema.flags]);

  const sectionCounts = useMemo(() => {
    return getSectionCounts(flagSchema.flags, flagsByType);
  }, [flagSchema.flags, flagsByType]);

  const currentFlags = flagsByType[selectedSection] || [];

  const handleCreateFlag = (type?: string) => {
    const newFlag: FlagDefinition = {
      id: 'new_flag',
      name: 'New Flag',
      type: (type && type !== 'all' ? type : 'dialogue') as FlagDefinition['type'],
    };
    setEditingFlag(newFlag);
    setIsCreating(true);
  };

  const handleEditFlag = (flag: FlagDefinition) => {
    setEditingFlag(flag);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingFlag(null);
    setIsCreating(false);
  };

  return {
    editingFlag,
    isCreating,
    selectedSection,
    setSelectedSection,
    currentFlags,
    sectionCounts,
    flagsByType,
    handleCreateFlag,
    handleEditFlag,
    handleCancelEdit,
  };
}
