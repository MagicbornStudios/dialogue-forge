import { useMemo } from 'react';
import { StoryThread, NARRATIVE_ELEMENT } from '../../../types/narrative';

export function useNarrativePathHighlighting(
  selectedElementId: string | null,
  selectedElementType: string | null,
  thread: StoryThread | null
): { edgesToSelectedElement: Set<string>; nodeDepths: Map<string, number> } {
  const { edgesToSelectedElement, nodeDepths } = useMemo(() => {
    if (!selectedElementId || !thread) {
      return { edgesToSelectedElement: new Set<string>(), nodeDepths: new Map<string, number>() };
    }
    
    const edgesOnPath = new Set<string>();
    const nodeDepthMap = new Map<string, number>();
    
    // Start from thread (always depth 0)
    nodeDepthMap.set(thread.id, 0);
    
    // Find path to selected element
    let currentDepth = 0;
    
    if (selectedElementType === NARRATIVE_ELEMENT.THREAD) {
      // Thread is the root, no path needed
      return { edgesToSelectedElement: edgesOnPath, nodeDepths: nodeDepthMap };
    }
    
    // Search through acts
    for (const act of thread.acts) {
      currentDepth = 1;
      nodeDepthMap.set(act.id, currentDepth);
      edgesOnPath.add(`narrative-${thread.id}-${act.id}`);
      
      if (selectedElementType === NARRATIVE_ELEMENT.ACT && act.id === selectedElementId) {
        return { edgesToSelectedElement: edgesOnPath, nodeDepths: nodeDepthMap };
      }
      
      // Search through chapters
      for (const chapter of act.chapters) {
        currentDepth = 2;
        nodeDepthMap.set(chapter.id, currentDepth);
        edgesOnPath.add(`narrative-${act.id}-${chapter.id}`);
        
        if (selectedElementType === NARRATIVE_ELEMENT.CHAPTER && chapter.id === selectedElementId) {
          return { edgesToSelectedElement: edgesOnPath, nodeDepths: nodeDepthMap };
        }
        
        // Search through pages
        for (const page of chapter.pages) {
          currentDepth = 3;
          nodeDepthMap.set(page.id, currentDepth);
          edgesOnPath.add(`narrative-${chapter.id}-${page.id}`);
          
          if (selectedElementType === NARRATIVE_ELEMENT.PAGE && page.id === selectedElementId) {
            return { edgesToSelectedElement: edgesOnPath, nodeDepths: nodeDepthMap };
          }
        }
      }
    }
    
    // If we get here, element not found - return empty path
    return { edgesToSelectedElement: new Set<string>(), nodeDepths: new Map<string, number>() };
  }, [selectedElementId, selectedElementType, thread]);

  return { edgesToSelectedElement, nodeDepths };
}
