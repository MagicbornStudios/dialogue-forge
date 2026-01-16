/**
 * Writer CopilotKit Action Name Constants
 * 
 * Follows the FORGE_COMMAND pattern for consistency.
 * All action names use the format: 'writer.{scope}.{actionName}'
 */

export const WRITER_ACTION_NAME = {
  WORKSPACE: {
    PROPOSE_TEXT_EDIT: 'writer.workspace.proposeTextEdit',
    GET_CURRENT_PAGE: 'writer.workspace.getCurrentPage',
    LIST_PAGES: 'writer.workspace.listPages',
    SWITCH_PAGE: 'writer.workspace.switchPage',
  },
  EDITOR: {
    INSERT_TEXT: 'writer.editor.insertText',
    REPLACE_SELECTION: 'writer.editor.replaceSelection',
    FORMAT_TEXT: 'writer.editor.formatText',
  },
} as const;

export type WriterActionName =
  | typeof WRITER_ACTION_NAME.WORKSPACE[keyof typeof WRITER_ACTION_NAME.WORKSPACE]
  | typeof WRITER_ACTION_NAME.EDITOR[keyof typeof WRITER_ACTION_NAME.EDITOR];
