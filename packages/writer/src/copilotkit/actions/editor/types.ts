/**
 * Writer Editor Action Types
 * 
 * Type definitions for editor-level CopilotKit actions (Lexical editor).
 */

import type { FrontendAction } from '@copilotkit/react-core';

/**
 * Parameters for insertText action
 */
export type InsertTextParameters = [
  {
    name: 'text';
    type: 'string';
    description: string;
    required: true;
  },
  {
    name: 'position';
    type: 'number';
    description: string;
    required: false;
  },
];

/**
 * Parameters for replaceSelection action
 */
export type ReplaceSelectionParameters = [
  {
    name: 'text';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Parameters for formatText action
 */
export type FormatTextParameters = [
  {
    name: 'format';
    type: 'string';
    description: string;
    required: true;
  },
];

/**
 * Action type definitions
 */
export type InsertTextAction = FrontendAction<InsertTextParameters>;
export type ReplaceSelectionAction = FrontendAction<ReplaceSelectionParameters>;
export type FormatTextAction = FrontendAction<FormatTextParameters>;
