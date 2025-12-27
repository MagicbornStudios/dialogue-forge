/**
 * Unified Examples System
 * 
 * All examples are stored as Yarn files and loaded through the registry system.
 * This provides a single, organized way to discover and load examples.
 * 
 * Structure:
 * - examples-registry.ts: Metadata about all examples (titles, descriptions, features)
 * - yarn-examples.ts: Actual Yarn file contents (all examples as Yarn strings)
 * - legacy-examples.ts: Old TypeScript examples (being migrated to Yarn format)
 * - index.ts: Public API for loading examples (this file)
 */

// New unified system exports
export { 
  examplesRegistry,
  exampleFlagSchemas,
  getExampleMetadata,
  listExampleIds,
  getExampleFlagSchema,
  listFlagSchemaIds,
  type ExampleMetadata
} from './examples-registry';

import {
  loadAllExamples,
  getExampleDialogue as getYarnExampleDialogue,
  getAllExampleDialogues,
  getExampleFlagSchema as getFlagSchemaForYarnExample
} from './yarn-examples';

import {
  listExampleIds,
  listFlagSchemaIds,
  getExampleFlagSchema
} from './examples-registry';

// Export character examples
export {
  exampleCharacters,
  getExampleCharacters,
  getExampleCharacter,
  listExampleCharacterIds,
} from './example-characters';

/**
 * Legacy exports for backward compatibility
 * These maintain the old API while we migrate examples to Yarn format
 * TODO: Remove once all examples are migrated and code is updated
 */
import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { exampleDialogues as legacyExamples, demoFlagSchemas as legacySchemas } from './legacy-examples';

// Export legacy examples - these work alongside the new Yarn examples
export const exampleDialogues: Record<string, DialogueTree> = legacyExamples;
export const demoFlagSchemas: Record<string, FlagSchema> = legacySchemas;

export function listExamples(): string[] {
  // Combine both Yarn examples and legacy examples
  const yarnIds = listExampleIds();
  const legacyIds = Object.keys(legacyExamples);
  return [...new Set([...yarnIds, ...legacyIds])];
}

export function listDemoFlagSchemas(): string[] {
  // Combine both systems
  const yarnIds = listFlagSchemaIds();
  const legacyIds = Object.keys(legacySchemas);
  return [...new Set([...yarnIds, ...legacyIds])];
}

export function getExampleDialogue(name: string): DialogueTree | null {
  // Try new Yarn system first
  const yarnDialogue = getYarnExampleDialogue(name);
  if (yarnDialogue) {
    return yarnDialogue;
  }
  // Fallback to legacy TypeScript examples
  return legacyExamples[name] || null;
}

export function getDemoFlagSchema(name: string): FlagSchema | null {
  // Try new system first
  const schema = getExampleFlagSchema(name);
  if (schema) {
    return schema;
  }
  // Fallback to legacy
  return legacySchemas[name] || null;
}
