'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ForgeNodeType } from '@/src/types/forge/forge-graph';

interface NodeDragContextValue {
  draggedNodeType: ForgeNodeType | null;
  setDraggedNodeType: (type: ForgeNodeType | null) => void;
  isDragging: boolean;
}

const NodeDragContext = createContext<NodeDragContextValue | null>(null);

export function NodeDragProvider({ children }: { children: React.ReactNode }) {
  const [draggedNodeType, setDraggedNodeType] = useState<ForgeNodeType | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSetDraggedNodeType = useCallback((type: ForgeNodeType | null) => {
    setDraggedNodeType(type);
    setIsDragging(type !== null);
  }, []);

  return (
    <NodeDragContext.Provider
      value={{
        draggedNodeType,
        setDraggedNodeType: handleSetDraggedNodeType,
        isDragging,
      }}
    >
      {children}
    </NodeDragContext.Provider>
  );
}

export function useNodeDrag() {
  const context = useContext(NodeDragContext);
  if (!context) {
    throw new Error('useNodeDrag must be used within NodeDragProvider');
  }
  return context;
}
