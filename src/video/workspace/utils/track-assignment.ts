import type { VideoLayer } from '@/video/templates/types/video-layer';

/**
 * Checks if two layers overlap in time
 */
function layersOverlap(layer1: VideoLayer, layer2: VideoLayer): boolean {
  const layer1Start = layer1.startMs ?? 0;
  const layer1End = layer1Start + (layer1.durationMs ?? 1000);
  const layer2Start = layer2.startMs ?? 0;
  const layer2End = layer2Start + (layer2.durationMs ?? 1000);
  
  return layer1Start < layer2End && layer2Start < layer1End;
}

/**
 * Assigns layers to tracks based on time overlap.
 * Overlapping layers are placed on different tracks.
 * Returns a map of layerId -> trackIndex (0-based)
 */
export function assignLayersToTracks(
  layers: VideoLayer[],
  durationMs: number
): Map<string, number> {
  const assignments = new Map<string, number>();
  const sortedLayers = [...layers].sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  const tracks: VideoLayer[][] = [];
  
  for (const layer of sortedLayers) {
    // Find first track where this layer doesn't overlap with any existing layer
    let assignedTrack = -1;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const hasOverlap = track.some(existing => layersOverlap(layer, existing));
      
      if (!hasOverlap) {
        assignedTrack = i;
        break;
      }
    }
    
    // If no track available, create new one
    if (assignedTrack === -1) {
      assignedTrack = tracks.length;
      tracks.push([]);
    }
    
    tracks[assignedTrack].push(layer);
    assignments.set(layer.id, assignedTrack);
  }
  
  return assignments;
}

/**
 * Finds the first available track for a layer at a given start time and duration.
 * Returns the track index, or -1 if a new track needs to be created.
 */
export function findAvailableTrack(
  layers: VideoLayer[],
  startMs: number,
  durationMs: number,
  excludeLayerId?: string
): number {
  // Filter out the excluded layer if provided
  const otherLayers = excludeLayerId
    ? layers.filter(l => l.id !== excludeLayerId)
    : layers;
  
  // Create a temporary layer for overlap checking
  const tempLayer: VideoLayer = {
    id: 'temp',
    name: 'temp',
    kind: 'rectangle',
    startMs,
    durationMs,
  };
  
  // Get existing track assignments
  const trackAssignments = assignLayersToTracks(otherLayers, 0);
  
  // Find the highest track index
  const maxTrack = otherLayers.length > 0
    ? Math.max(...Array.from(trackAssignments.values()))
    : -1;
  
  // Check each existing track to see if the new layer would overlap
  for (let trackIndex = 0; trackIndex <= maxTrack; trackIndex++) {
    const layersInTrack = otherLayers.filter(l => trackAssignments.get(l.id) === trackIndex);
    const hasOverlap = layersInTrack.some(existing => layersOverlap(tempLayer, existing));
    
    if (!hasOverlap) {
      return trackIndex;
    }
  }
  
  // No available track, return -1 to indicate a new track should be created
  return -1;
}
