import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';

/**
 * Base actions that can be shared across workspaces
 * Note: Actions are typically registered via useCopilotAction hooks,
 * but this can be used for creating action definitions if needed.
 */
export function createBaseActions(): FrontendAction<Parameter[]>[] {
  return [
    // Add common actions here if needed
    // For example: help, getVersion, etc.
  ];
}
