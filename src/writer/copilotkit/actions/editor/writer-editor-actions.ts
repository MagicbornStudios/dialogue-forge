/**
 * Writer Editor Actions
 * 
 * Editor-level CopilotKit actions that operate on the Lexical editor instance.
 * These actions manipulate editor content directly.
 * 
 * Note: Currently placeholder implementations. Full Lexical integration
 * would require access to Lexical editor instance via context or ref.
 */

import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';
import { WRITER_ACTION_NAME } from '../../constants/writer-action-names';

/**
 * Create insertText action
 * 
 * TODO: Integrate with Lexical editor instance when available
 */
export function createInsertTextAction(): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.EDITOR.INSERT_TEXT,
    description: 'Insert text at the current cursor position in the editor',
    parameters: [
      {
        name: 'text',
        type: 'string',
        description: 'The text to insert',
        required: true,
      },
      {
        name: 'position',
        type: 'number',
        description: 'Optional position to insert at (defaults to cursor position)',
        required: false,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const text = args.text as string;
      if (!text) {
        throw new Error('Text is required');
      }
      // TODO: Implement Lexical editor integration
      return { success: true, message: 'Text insertion not yet implemented' };
    },
  };
}

/**
 * Create replaceSelection action
 * 
 * TODO: Integrate with Lexical editor instance when available
 */
export function createReplaceSelectionAction(): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.EDITOR.REPLACE_SELECTION,
    description: 'Replace the currently selected text in the editor',
    parameters: [
      {
        name: 'text',
        type: 'string',
        description: 'The text to replace the selection with',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const text = args.text as string;
      if (!text) {
        throw new Error('Text is required');
      }
      // TODO: Implement Lexical editor integration
      return { success: true, message: 'Selection replacement not yet implemented' };
    },
  };
}

/**
 * Create formatText action
 * 
 * TODO: Integrate with Lexical editor instance when available
 */
export function createFormatTextAction(): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.EDITOR.FORMAT_TEXT,
    description: 'Apply formatting to the selected text (bold, italic, etc.)',
    parameters: [
      {
        name: 'format',
        type: 'string',
        description: 'The format to apply (e.g., "bold", "italic", "heading")',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const format = args.format as string;
      if (!format) {
        throw new Error('Format is required');
      }
      // TODO: Implement Lexical editor integration
      return { success: true, message: 'Text formatting not yet implemented' };
    },
  };
}

/**
 * Create all editor actions
 */
export function createWriterEditorActions(): FrontendAction<Parameter[]>[] {
  return [
    createInsertTextAction(),
    createReplaceSelectionAction(),
    createFormatTextAction(),
  ];
}
