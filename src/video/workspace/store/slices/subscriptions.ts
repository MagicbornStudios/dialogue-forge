import type { StoreApi } from 'zustand';
import type { VideoWorkspaceState } from '../video-workspace-store';
import type { VideoTemplate } from '@/video/templates/types/video-template';

/**
 * Setup subscriptions for video workspace store
 * Handles auto-save, event emission, and side effects
 */
export function setupVideoWorkspaceSubscriptions(
  store: StoreApi<VideoWorkspaceState>
) {
  const unsubscribers: (() => void)[] = [];

  // Subscribe to template changes for auto-save (disabled for now)
  // Can enable later with debouncing
  // const unsubTemplate = store.subscribe((state) => {
  //   // Auto-save logic here
  // });
  // unsubscribers.push(unsubTemplate);

  // Subscribe to project changes
  let prevProjectId = store.getState().selectedProjectId;
  let isHandlingProjectChange = false;
  
  const unsubProject = store.subscribe((state) => {
    if (state.selectedProjectId !== prevProjectId && !isHandlingProjectChange) {
      isHandlingProjectChange = true;
      
      // Clear template history synchronously (no actions to avoid recursion)
      store.setState({
        templateHistory: [],
        historyIndex: -1,
      });
      
      // Emit project changed event
      state.eventSink?.emit({
        type: 'project.changed',
        payload: { projectId: state.selectedProjectId },
      });
      
      prevProjectId = state.selectedProjectId;
      isHandlingProjectChange = false;
    }
  });
  unsubscribers.push(unsubProject);

  // Subscribe to commit events
  let prevCommittedAt = store.getState().lastCommittedAt;
  const unsubCommit = store.subscribe((state) => {
    if (state.lastCommittedAt !== prevCommittedAt && state.lastCommittedAt) {
      const template = state.committedGraph;
      const adapter = state.adapter;
      
      if (template && adapter) {
        console.log('[VideoWorkspace] Saving committed template:', template.id);
        
        adapter.saveTemplate(template)
          .then((savedTemplate) => {
            console.log('[VideoWorkspace] Template saved successfully:', savedTemplate.id);
            
            // Update the committed and draft graph IDs if this was a new template
            if (template.id !== savedTemplate.id) {
              store.setState({
                committedGraph: savedTemplate,
                draftGraph: savedTemplate,
              });
            }
            
            // Emit save success event
            state.eventSink?.emit({
              type: 'template.saved',
              payload: { templateId: savedTemplate.id },
            });
          })
          .catch((error) => {
            console.error('[VideoWorkspace] Save failed:', error);
            
            // Emit save error event
            state.eventSink?.emit({
              type: 'template.save.error',
              payload: { templateId: template.id, error },
            });
          });
      }
      
      prevCommittedAt = state.lastCommittedAt;
    }
  });
  unsubscribers.push(unsubCommit);

  // Return cleanup function
  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}