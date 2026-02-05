import { useCallback } from 'react';

/**
 * Stub: video composition compiler was removed with the video package.
 * Returns a no-op that resolves to null. Kept for API compatibility.
 */
export type CompileCompositionJsonOptions = {
  graphId?: string;
  template: unknown;
  executionOptions?: unknown;
  overrides?: unknown;
};

export function useForgeWorkspaceCompositionCompiler() {
  return useCallback(
    async (_options: CompileCompositionJsonOptions): Promise<null> => {
      return null;
    },
    [],
  );
}
