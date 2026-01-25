/**
 * Writer CopilotKit Integration
 * 
 * Exports for Writer domain CopilotKit actions and hooks.
 */

export { WRITER_ACTION_NAME, type WriterActionName } from './constants/writer-action-names';
export { useWriterWorkspaceActions } from './hooks/useWriterWorkspaceActions';
export { useWriterCopilotContext } from './hooks/useWriterCopilotContext';
export { useWriterEditorActions } from './hooks/useWriterEditorActions';
export { createWriterWorkspaceActions } from './actions/workspace/writer-workspace-actions';
export { createWriterEditorActions } from './actions/editor/writer-editor-actions';
