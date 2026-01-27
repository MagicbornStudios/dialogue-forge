import type { StateCreator } from 'zustand';
import type { VideoWorkspaceState } from '../video-workspace-store';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoLayer } from '@/video/templates/types/video-layer';

export interface TemplateSlice {
  // Template cache: by template ID
  templates: {
    byId: Record<string, VideoTemplate>;
    statusById: Record<string, 'loading' | 'ready' | 'error'>;
  };
  
  // Active template ID
  activeTemplateId: string | null;
  
  // Template history (for back/forward navigation)
  templateHistory: string[];
  historyIndex: number;
}

export interface TemplateActions {
  setTemplate: (id: string, template: VideoTemplate) => void;
  setTemplateStatus: (id: string, status: 'loading' | 'ready' | 'error') => void;
  setActiveTemplateId: (id: string | null) => void;
  ensureTemplate: (
    templateId: string,
    resolver?: (id: string) => Promise<VideoTemplate>
  ) => Promise<void>;
  loadTemplate: (templateId: string) => Promise<void>;
  pushTemplateHistory: (templateId: string) => void;
  navigateBack: () => Promise<void>;
  navigateForward: () => Promise<void>;
  clearTemplateHistory: () => void;
  
  // Layer management actions
  addLayer: (layer: Partial<VideoLayer>, sceneIndex?: number) => void;
  updateLayer: (layerId: string, updates: Partial<VideoLayer>) => void;
  deleteLayer: (layerId: string) => void;
  moveLayer: (layerId: string, x: number, y: number) => void;
  resizeLayer: (layerId: string, width: number, height: number) => void;
}

export function createTemplateSlice(
  set: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[0],
  get: Parameters<StateCreator<VideoWorkspaceState, [], [], VideoWorkspaceState>>[1],
  initialTemplateId?: string | null,
  resolveTemplate?: (id: string) => Promise<VideoTemplate>
): TemplateSlice & TemplateActions {
  return {
    templates: {
      byId: {},
      statusById: {},
    },
    activeTemplateId: initialTemplateId ?? null,
    templateHistory: [],
    historyIndex: -1,
    
    setTemplate: (id: string, template: VideoTemplate) => {
      set((state) => ({
        templates: {
          ...state.templates,
          byId: { ...state.templates.byId, [id]: template },
          statusById: { ...state.templates.statusById, [id]: 'ready' },
        },
      }));
    },
    
    setTemplateStatus: (id: string, status: 'loading' | 'ready' | 'error') => {
      set((state) => ({
        templates: {
          ...state.templates,
          statusById: { ...state.templates.statusById, [id]: status },
        },
      }));
    },
    
    setActiveTemplateId: (id: string | null) => {
      set({ activeTemplateId: id });
    },
    
    ensureTemplate: async (
      templateId: string,
      providedResolver?: (id: string) => Promise<VideoTemplate>
    ) => {
      const state = get();
      
      // If already loaded, return
      if (state.templates.byId[templateId] && state.templates.statusById[templateId] === 'ready') {
        return;
      }
      
      // Use provided resolver or fallback
      const resolver = providedResolver ?? resolveTemplate;
      if (!resolver) {
        console.warn(`No resolver available for template ${templateId}`);
        return;
      }
      
      // Set loading status
      state.actions.setTemplateStatus(templateId, 'loading');
      
      try {
        const template = await resolver(templateId);
        state.actions.setTemplate(templateId, template);
      } catch (error) {
        console.error(`Failed to load template ${templateId}:`, error);
        state.actions.setTemplateStatus(templateId, 'error');
      }
    },
    
    loadTemplate: async (templateId: string) => {
      const state = get();
      
      // Ensure template is loaded
      await state.actions.ensureTemplate(templateId);
      
      // Set as active
      state.actions.setActiveTemplateId(templateId);
      
      // Push to history
      state.actions.pushTemplateHistory(templateId);
      
      // Emit event
      state.eventSink?.emit({
        type: 'template.loaded',
        payload: { templateId },
      });
    },
    
    pushTemplateHistory: (templateId: string) => {
      set((state) => {
        // Remove any history after current index (if user navigated back)
        const newHistory = state.templateHistory.slice(0, state.historyIndex + 1);
        newHistory.push(templateId);
        
        return {
          templateHistory: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },
    
    navigateBack: async () => {
      const state = get();
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const templateId = state.templateHistory[newIndex];
        
        set({ historyIndex: newIndex });
        await state.actions.loadTemplate(templateId);
      }
    },
    
    navigateForward: async () => {
      const state = get();
      if (state.historyIndex < state.templateHistory.length - 1) {
        const newIndex = state.historyIndex + 1;
        const templateId = state.templateHistory[newIndex];
        
        set({ historyIndex: newIndex });
        await state.actions.loadTemplate(templateId);
      }
    },
    
    clearTemplateHistory: () => {
      set({
        templateHistory: [],
        historyIndex: -1,
      });
    },
    
    // Layer management actions
    addLayer: (layer: Partial<VideoLayer>, sceneIndex = 0) => {
      const state = get();
      
      // Get current draft template
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) {
        console.error('❌ No draft template');
        return;
      }
      
      // Create full layer with defaults
      const newLayer: VideoLayer = {
        id: layer.id ?? `layer_${Date.now()}`,
        name: layer.name ?? 'New Layer',
        kind: layer.kind!,
        startMs: layer.startMs ?? 0,
        durationMs: layer.durationMs ?? 5000,
        opacity: layer.opacity ?? 1,
        visual: layer.visual,
        style: layer.style,
        inputs: layer.inputs,
      };
      
      // Clone template and add layer to scene
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = [...draftTemplate.scenes];
      updatedTemplate.scenes[sceneIndex] = {
        ...updatedTemplate.scenes[sceneIndex],
        layers: [...updatedTemplate.scenes[sceneIndex].layers, newLayer],
      };
      
      // Apply to draft (this will trigger re-render)
      set({ draftGraph: updatedTemplate });
      
      console.log('✅ Layer added:', newLayer.kind, 'Total layers:', updatedTemplate.scenes[sceneIndex].layers.length);
      
      // Emit event
      state.eventSink?.emit({
        type: 'layer.added',
        payload: { layerId: newLayer.id },
      });
    },
    
    updateLayer: (layerId: string, updates: Partial<VideoLayer>) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      // Find layer and update it
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        ),
      }));
      
      set({ draftGraph: updatedTemplate });
      
      // Emit event
      state.eventSink?.emit({
        type: 'layer.updated',
        payload: { layerId, updates },
      });
    },
    
    deleteLayer: (layerId: string) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      // Remove layer from scene
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.filter(layer => layer.id !== layerId),
      }));
      
      set({ draftGraph: updatedTemplate });
      
      // Emit event
      state.eventSink?.emit({
        type: 'layer.deleted',
        payload: { layerId },
      });
    },
    
    moveLayer: (layerId: string, x: number, y: number) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      // Update layer position
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer =>
          layer.id === layerId
            ? {
                ...layer,
                visual: { ...layer.visual, x, y },
              }
            : layer
        ),
      }));
      
      set({ draftGraph: updatedTemplate });
    },
    
    resizeLayer: (layerId: string, width: number, height: number) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      // Update layer size
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer =>
          layer.id === layerId
            ? {
                ...layer,
                visual: { ...layer.visual, width, height },
              }
            : layer
        ),
      }));
      
      set({ draftGraph: updatedTemplate });
    },
  };
}