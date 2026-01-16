/**
 * @deprecated This file is kept for backward compatibility but actions are now
 * organized by domain. Use domain-specific hooks instead:
 * - Writer: useWriterWorkspaceActions from @/writer/copilotkit
 * - Forge: useForgeWorkspaceActions from @/forge/copilotkit
 * 
 * This file will be removed in a future version.
 */

import { useWriterWorkspaceActions } from '@/writer/copilotkit';
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

/**
 * @deprecated Use useWriterWorkspaceActions instead
 */
export function useCopilotKitActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
) {
  // Delegate to domain-specific hook
  useWriterWorkspaceActions(workspaceStore);
}
