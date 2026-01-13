// src/components/graphing/core/hooks/usePaneContextMenu.ts
import { useCallback, useState } from 'react';
import type { ReactFlowInstance } from 'reactflow';

export function usePaneContextMenu(reactFlow: ReactFlowInstance) {
  const [paneMenu, setPaneMenu] = useState<{ x: number; y: number; graphX: number; graphY: number } | null>(null);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const point = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setPaneMenu({ x: event.clientX, y: event.clientY, graphX: point.x, graphY: point.y });
  }, [reactFlow]);

  const closePaneMenu = useCallback(() => setPaneMenu(null), []);

  return { paneMenu, setPaneMenu, onPaneContextMenu, closePaneMenu };
}
