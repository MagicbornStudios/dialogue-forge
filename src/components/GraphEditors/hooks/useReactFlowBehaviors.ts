import { useEffect, useRef } from 'react';
import { useReactFlow } from 'reactflow';

/**
 * Shared React Flow behaviors hook
 * Provides common behaviors like double-click to fit view, middle-click to fit view
 */
export function useReactFlowBehaviors() {
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const lastWheelClickRef = useRef<number>(0);

  // Handle pane double-click - fit view to all nodes
  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node') || target.closest('.react-flow__edge')) {
        return;
      }

      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
      }
    };

    const container = reactFlowWrapperRef.current;
    if (container) {
      container.addEventListener('dblclick', handleDoubleClick);
      return () => {
        container.removeEventListener('dblclick', handleDoubleClick);
      };
    }
  }, [reactFlowInstance]);

  // Track mouse wheel clicks for double-click detection
  useEffect(() => {
    const handleMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.button === 1) {
        // Middle mouse button (wheel)
        const now = Date.now();
        if (now - lastWheelClickRef.current < 300) {
          mouseEvent.preventDefault();
          if (reactFlowInstance) {
            reactFlowInstance.fitView({ padding: 0.2, duration: 500 });
          }
          lastWheelClickRef.current = 0;
        } else {
          lastWheelClickRef.current = now;
        }
      }
    };

    const container = document.querySelector('.react-flow');
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      return () => {
        container.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [reactFlowInstance]);

  return { reactFlowWrapperRef };
}
