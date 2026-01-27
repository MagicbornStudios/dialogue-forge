import type { StateCreator } from 'zustand';
import type { VideoWorkspaceState } from '../video-workspace-store';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { findAvailableTrack } from '../../utils/track-assignment';

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
  updateLayerStart: (layerId: string, startMs: number) => void;
  updateLayerDuration: (layerId: string, durationMs: number) => void;
  updateSceneDuration: (sceneIndex: number, durationMs: number) => void;
  duplicateLayer: (layerId: string, sceneIndex?: number) => void;
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
      // Ensure minimum scene duration of 1 second
      const MIN_DURATION_MS = 1000;
      const normalizedTemplate = {
        ...template,
        scenes: template.scenes.map(scene => ({
          ...scene,
          durationMs: Math.max(scene.durationMs, MIN_DURATION_MS),
        })),
      };
      
      set((state) => ({
        templates: {
          ...state.templates,
          byId: { ...state.templates.byId, [id]: normalizedTemplate },
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
      
      console.log('📦 addLayer called with:', { layerKind: layer.kind, sceneIndex });
      
      // Get current draft template
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) {
        console.error('❌ No draft template');
        return;
      }
      
      console.log('📦 Draft template found:', draftTemplate.name, 'Current layers:', draftTemplate.scenes[sceneIndex]?.layers.length);
      
      // Validate scene exists
      if (!draftTemplate.scenes[sceneIndex]) {
        console.error('❌ Scene not found:', sceneIndex);
        return;
      }
      
      // Create full layer with defaults
      const newLayer: VideoLayer = {
        id: layer.id ?? `layer_${Date.now()}`,
        name: layer.name ?? 'New Layer',
        kind: layer.kind!,
        startMs: layer.startMs ?? 0,
        durationMs: layer.durationMs ?? 1000, // 1 second default
        opacity: layer.opacity ?? 1,
        visual: {
          ...layer.visual,
          anchorX: layer.visual?.anchorX ?? 0, // Default to top-left
          anchorY: layer.visual?.anchorY ?? 0,
        },
        style: layer.style,
        inputs: layer.inputs,
      };
      
      console.log('📦 Created layer:', newLayer.id, newLayer.kind);
      
      // Clone template and add layer to scene
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = [...draftTemplate.scenes];
      updatedTemplate.scenes[sceneIndex] = {
        ...updatedTemplate.scenes[sceneIndex],
        layers: [...updatedTemplate.scenes[sceneIndex].layers, newLayer],
      };
      
      console.log('📦 Updated template layers:', updatedTemplate.scenes[sceneIndex].layers.length);
      
      // Apply to draft (this will trigger re-render)
      set({ draftGraph: updatedTemplate });
      
      console.log('✅ Layer added successfully!');
      
      // Auto-select the new layer
      state.actions.setSelectedLayerId(newLayer.id);
      
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
      
      // Validate duration if provided
      const MIN_DURATION_MS = 1000; // 1 second minimum
      if (updates.durationMs !== undefined && updates.durationMs < MIN_DURATION_MS) {
        updates.durationMs = MIN_DURATION_MS;
      }
      
      // Find layer and update it with proper nested merging
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer => {
          if (layer.id !== layerId) return layer;
          
          // Merge nested objects properly
          const updatedLayer = { ...layer };
          
          // Merge visual properties
          if (updates.visual) {
            updatedLayer.visual = { ...layer.visual, ...updates.visual };
          }
          
          // Merge style properties
          if (updates.style) {
            updatedLayer.style = { ...layer.style, ...updates.style };
          }
          
          // Merge inputs properties
          if (updates.inputs) {
            updatedLayer.inputs = { ...layer.inputs, ...updates.inputs };
          }
          
          // Merge top-level properties (excluding nested objects)
          const { visual, style, inputs, ...topLevelUpdates } = updates;
          const finalLayer = { ...updatedLayer, ...topLevelUpdates };
          
          // Ensure final duration is at least minimum
          if (finalLayer.durationMs < MIN_DURATION_MS) {
            finalLayer.durationMs = MIN_DURATION_MS;
          }
          
          return finalLayer;
        }),
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
    
    updateLayerStart: (layerId: string, startMs: number) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, startMs: Math.max(0, startMs) }
            : layer
        ),
      }));
      
      set({ draftGraph: updatedTemplate });
    },
    
    updateLayerDuration: (layerId: string, durationMs: number) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      const MIN_DURATION_MS = 1000;
      const finalDuration = Math.max(durationMs, MIN_DURATION_MS);
      
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = draftTemplate.scenes.map(scene => ({
        ...scene,
        layers: scene.layers.map(layer =>
          layer.id === layerId
            ? { ...layer, durationMs: finalDuration }
            : layer
        ),
      }));
      
      set({ draftGraph: updatedTemplate });
    },
    
    updateSceneDuration: (sceneIndex: number, durationMs: number) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      const MIN_DURATION_MS = 1000;
      const finalDuration = Math.max(durationMs, MIN_DURATION_MS);
      
      const updatedTemplate = { ...draftTemplate };
      // Create a new scenes array to avoid read-only mutation
      updatedTemplate.scenes = [...draftTemplate.scenes];
      if (updatedTemplate.scenes[sceneIndex]) {
        updatedTemplate.scenes[sceneIndex] = {
          ...updatedTemplate.scenes[sceneIndex],
          durationMs: finalDuration,
        };
      }
      
      set({ draftGraph: updatedTemplate });
    },
    
    duplicateLayer: (layerId: string, sceneIndex = 0) => {
      const state = get();
      const draftTemplate = state.draftGraph;
      if (!draftTemplate) return;
      
      // Find the layer to duplicate
      const scene = draftTemplate.scenes[sceneIndex];
      if (!scene) return;
      
      const originalLayer = scene.layers.find(l => l.id === layerId);
      if (!originalLayer) return;
      
      // Create duplicate with new ID
      const duplicatedLayer: VideoLayer = {
        ...originalLayer,
        id: `layer_${Date.now()}`,
        name: `${originalLayer.name ?? originalLayer.id} Copy`,
        // Keep same start time and duration - track assignment will handle placement
        startMs: originalLayer.startMs ?? 0,
        durationMs: originalLayer.durationMs ?? 1000,
      };
      
      // Find available track for the duplicated layer
      const allLayers = scene.layers;
      const availableTrack = findAvailableTrack(
        allLayers,
        duplicatedLayer.startMs ?? 0,
        duplicatedLayer.durationMs ?? 1000,
        originalLayer.id
      );
      
      // If no available track found, the layer will be placed on a new track
      // (track assignment happens automatically when rendering)
      
      // Add duplicated layer to scene
      const updatedTemplate = { ...draftTemplate };
      updatedTemplate.scenes = [...draftTemplate.scenes];
      updatedTemplate.scenes[sceneIndex] = {
        ...updatedTemplate.scenes[sceneIndex],
        layers: [...updatedTemplate.scenes[sceneIndex].layers, duplicatedLayer],
      };
      
      set({ draftGraph: updatedTemplate });
      
      // Auto-select the duplicated layer
      state.actions.setSelectedLayerId(duplicatedLayer.id);
      
      // Emit event
      state.eventSink?.emit({
        type: 'layer.added',
        payload: { layerId: duplicatedLayer.id },
      });
    },
  };
}