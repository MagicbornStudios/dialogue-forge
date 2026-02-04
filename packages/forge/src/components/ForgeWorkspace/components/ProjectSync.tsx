import { useEffect } from 'react';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';

interface ProjectSyncProps {
  selectedProjectId?: number | null;
}

export function ProjectSync({ selectedProjectId }: ProjectSyncProps) {
  const setSelectedProjectId = useForgeWorkspaceStore((s) => s.actions.setSelectedProjectId);
  
  useEffect(() => {
    setSelectedProjectId(selectedProjectId ?? null);
  }, [selectedProjectId, setSelectedProjectId]);
  
  return null;
}
