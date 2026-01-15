// src/components/graphing/core/hooks/useEdgeDropBehavior.ts
import { useCallback, useRef, useState } from 'react';
import type { Node, Connection, ReactFlowInstance } from 'reactflow';

type EdgeDropMenuState = {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  sourceHandle?: string | null;
} | null;

export function useEdgeDropBehavior(args: {
  reactFlow: ReactFlowInstance;
  nodes: Node[];
  threshold?: number;
  onAutoConnect: (connection: Connection) => void;
}) {
  const { reactFlow, nodes, onAutoConnect, threshold = 100 } = args;

  const [edgeDropMenu, setEdgeDropMenu] = useState<EdgeDropMenuState>(null);

  const connectingRef = useRef<{ fromNodeId: string; sourceHandle?: string | null } | null>(null);

  const onConnectStart = useCallback((_event: any, params: { nodeId: string | null; handleId: string | null }) => {
    
    if (!params.nodeId) return;

    connectingRef.current = {
      fromNodeId: params.nodeId,
      sourceHandle: params.handleId
    };
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingRef.current) return;

    const clientX = 'clientX' in event ? event.clientX : (event.touches?.[0]?.clientX || 0);
    const clientY = 'clientY' in event ? event.clientY : (event.touches?.[0]?.clientY || 0);

    const point = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });

    // Find nearest node
    let nearest: Node | null = null;
    let min = Infinity;

    for (const n of nodes) {
      const w = n.width || 200;
      const h = n.height || 100;
      const cx = n.position.x + w / 2;
      const cy = n.position.y + h / 2;
      const d = Math.sqrt((point.x - cx) ** 2 + (point.y - cy) ** 2);
      if (d < min && d < threshold) {
        min = d;
        nearest = n;
      }
    }

    // Auto-connect if near node
    if (nearest && nearest.id !== connectingRef.current.fromNodeId) {
      const connection: Connection = {
        source: connectingRef.current.fromNodeId,
        target: nearest.id,
        sourceHandle: connectingRef.current.sourceHandle ?? null,
        targetHandle: null,
      };
      onAutoConnect(connection);
      connectingRef.current = null;
      return;
    }

    // Else open edge-drop menu
    setEdgeDropMenu({
      x: clientX,
      y: clientY,
      graphX: point.x,
      graphY: point.y,
      fromNodeId: connectingRef.current.fromNodeId,
      sourceHandle: connectingRef.current.sourceHandle,
    });

    connectingRef.current = null;
  }, [nodes, reactFlow, onAutoConnect, threshold]);

  return {
    edgeDropMenu,
    setEdgeDropMenu,
    connectingRef,
    onConnectStart,
    onConnectEnd,
  };
}
