'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { VideoLayerKind } from '@/video/templates/types/video-layer';

interface ElementDragContextValue {
  draggedElementType: VideoLayerKind | null;
  setDraggedElementType: (type: VideoLayerKind | null) => void;
}

const ElementDragContext = createContext<ElementDragContextValue | null>(null);

export function ElementDragProvider({ children }: { children: React.ReactNode }) {
  const [draggedElementType, setDraggedElementType] = useState<VideoLayerKind | null>(null);

  const value = React.useMemo(
    () => ({
      draggedElementType,
      setDraggedElementType,
    }),
    [draggedElementType]
  );

  return (
    <ElementDragContext.Provider value={value}>
      {children}
    </ElementDragContext.Provider>
  );
}

export function useElementDrag() {
  const context = useContext(ElementDragContext);
  if (!context) {
    throw new Error('useElementDrag must be used within ElementDragProvider');
  }
  return context;
}