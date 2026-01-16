/**
 * AI CopilotKit Infrastructure
 * 
 * This module provides base CopilotKit infrastructure. Domain-specific actions
 * are organized in their respective domains:
 * - Writer: @/writer/copilotkit
 * - Forge: @/forge/copilotkit
 */

export { CopilotKitWorkspaceProvider } from './providers/CopilotKitWorkspaceProvider';
export { useCopilotKitContext } from './hooks/useCopilotKitContext';
export { CopilotKitContextProvider } from './providers/CopilotKitContextProvider';

/**
 * @deprecated Use domain-specific action hooks instead:
 * - Writer: useWriterWorkspaceActions from @/writer/copilotkit
 * - Forge: useForgeWorkspaceActions from @/forge/copilotkit
 */
export { useCopilotKitActions } from './hooks/useCopilotKitActions';

/**
 * @deprecated This provider is kept for backward compatibility.
 * Actions are now registered directly in workspace components.
 */
export { CopilotKitActionsProvider } from './providers/CopilotKitActionsProvider';