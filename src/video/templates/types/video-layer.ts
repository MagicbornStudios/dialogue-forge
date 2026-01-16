export interface VideoLayer {
  id: string;
  name?: string;
  startMs: number;
  durationMs?: number;
  opacity?: number;
  inputs?: Record<string, string>;
}
