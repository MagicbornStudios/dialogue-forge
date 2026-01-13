/**
 * @deprecated This file is deprecated. Use the new extensible converter from './yarn-converter/index'.
 * This file is kept for backward compatibility and re-exports from the new location.
 * 
 * The new converter provides:
 * - Extensible handler pattern for adding new node types
 * - Workspace store integration for graph resolution
 * - Transparent Yarn text generation with clear formatting
 * - Support for storylet/detour nodes with graph inlining
 */

import { exportToYarn as newExportToYarn, importFromYarn as newImportFromYarn } from './yarn-converter/index';
import type { ForgeGraphDoc } from '../types';
import type { YarnConverterContext } from './yarn-converter/types';

/**
 * Convert DialogueTree to Yarn Spinner format
 * 
 * @deprecated Use exportToYarn from './yarn-converter/index' instead.
 * This function now delegates to the new extensible converter.
 * 
 * Flags are converted to Yarn variables ($variable).
 * Variables are NOT stored in the .yarn file - they're managed by
 * Yarn Spinner's Variable Storage at runtime.
 * 
 * The .yarn file contains commands like:
 * - <<set $flag_name = value>> - Sets variable in Variable Storage
 * - <<if $flag_name>> - Checks variable in Variable Storage
 */
export async function exportToYarn(graph: ForgeGraphDoc, context?: YarnConverterContext): Promise<string> {
  return newExportToYarn(graph, context);
}

/**
 * Parse Yarn Spinner format to DialogueTree
 * 
 * @deprecated Use importFromYarn from './yarn-converter/index' instead.
 * This function now delegates to the new extensible converter.
 */
export async function importFromYarn(
  yarnContent: string,
  title: string = 'Imported Dialogue',
  context?: YarnConverterContext
): Promise<ForgeGraphDoc> {
  return newImportFromYarn(yarnContent, title, context);
}

// Re-export types and utilities for convenience
export type { YarnConverterContext } from './yarn-converter/types';
export { createWorkspaceContext, createMinimalContext } from './yarn-converter/workspace-context';
