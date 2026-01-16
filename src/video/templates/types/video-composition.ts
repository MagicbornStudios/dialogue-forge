export interface VideoCompositionLayer {
  id: string;
  sceneId: string;
  startMs: number;
  endMs: number;
  opacity?: number;
  resolvedInputs?: Record<string, unknown>;
}

export interface VideoCompositionScene {
  id: string;
  templateSceneId: string;
  startMs: number;
  durationMs: number;
  layers: VideoCompositionLayer[];
}

export interface VideoComposition {
  id: string;
  templateId: string;
  width: number;
  height: number;
  frameRate: number;
  durationMs: number;
  scenes: VideoCompositionScene[];
}
