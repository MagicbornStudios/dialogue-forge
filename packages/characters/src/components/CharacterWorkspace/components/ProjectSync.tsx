import { useEffect } from 'react';
import { useCharacterWorkspaceStore } from '../store/character-workspace-store';

interface ProjectSyncProps {
  selectedProjectId?: string | null;
}

export function ProjectSync({ selectedProjectId }: ProjectSyncProps) {
  const setActiveProjectId = useCharacterWorkspaceStore((s) => s.actions.setActiveProjectId);
  
  useEffect(() => {
    setActiveProjectId(selectedProjectId ?? null);
  }, [selectedProjectId, setActiveProjectId]);
  
  return null;
}
