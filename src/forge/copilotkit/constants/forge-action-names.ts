/**
 * Forge CopilotKit Action Name Constants
 * 
 * Follows the FORGE_COMMAND pattern for consistency.
 * All action names use the format: 'forge.{scope}.{actionName}'
 */

export const FORGE_ACTION_NAME = {
  WORKSPACE: {
    GET_CURRENT_GRAPH: 'forge.workspace.getCurrentGraph',
    LIST_GRAPHS: 'forge.workspace.listGraphs',
    SWITCH_GRAPH: 'forge.workspace.switchGraph',
    GET_FLAG_SCHEMA: 'forge.workspace.getFlagSchema',
    GET_GAME_STATE: 'forge.workspace.getGameState',
    GET_CHAPTERS: 'forge.workspace.getChapters',
    GET_ACTS: 'forge.workspace.getActs',
    GET_PAGES: 'forge.workspace.getPages',
    GET_GRAPH: 'forge.workspace.getGraph',
    EXPAND_EDITOR: 'forge.workspace.expandEditor',
    MINIMIZE_EDITOR: 'forge.workspace.minimizeEditor',
  },
  EDITOR: {
    CREATE_NODE: 'forge.editor.createNode',
    DELETE_NODE: 'forge.editor.deleteNode',
    UPDATE_NODE: 'forge.editor.updateNode',
    CREATE_EDGE: 'forge.editor.createEdge',
    DELETE_EDGE: 'forge.editor.deleteEdge',
    FOCUS_NODE: 'forge.editor.focusNode',
    CREATE_AND_CONNECT_NODE: 'forge.editor.createAndConnectNode',
  },
} as const;

export type ForgeActionName =
  | typeof FORGE_ACTION_NAME.WORKSPACE[keyof typeof FORGE_ACTION_NAME.WORKSPACE]
  | typeof FORGE_ACTION_NAME.EDITOR[keyof typeof FORGE_ACTION_NAME.EDITOR];
