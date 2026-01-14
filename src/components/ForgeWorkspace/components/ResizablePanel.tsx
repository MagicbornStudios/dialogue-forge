import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number; // Percentage (0-100)
  minSize?: number;
  maxSize?: number;
  direction?: 'vertical' | 'horizontal';
  className?: string;
  title?: string;
  onSizeChange?: (size: number) => void;
}

export function ResizablePanel({
  children,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  direction = 'vertical',
  className = '',
  title,
  onSizeChange,
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isDocked, setIsDocked] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !panelRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const isVertical = direction === 'vertical';
      const containerSize = isVertical ? containerRect.height : containerRect.width;
      const mousePos = isVertical ? e.clientY - containerRect.top : e.clientX - containerRect.left;
      const newSize = (mousePos / containerSize) * 100;

      if (newSize >= minSize && newSize <= maxSize) {
        setSize(newSize);
        onSizeChange?.(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize, onSizeChange]);

  const handleToggleDock = () => {
    setIsDocked(!isDocked);
  };

  if (isDocked) {
    return (
      <div className={`fixed inset-0 z-50 bg-df-editor-bg ${className}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-df-control-border">
          <div className="text-sm font-semibold text-df-text-primary">{title}</div>
          <button
            onClick={handleToggleDock}
            className="p-1.5 rounded hover:bg-df-control-bg transition-colors"
            title="Undock panel"
          >
            <Minimize2 size={16} className="text-df-text-secondary" />
          </button>
        </div>
        <div className="h-[calc(100%-48px)] overflow-auto">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${direction === 'vertical' ? 'flex flex-col' : 'flex'} ${className}`}
      style={{
        [direction === 'vertical' ? 'height' : 'width']: `${size}%`,
      }}
    >
      {title && (
        <div className="flex items-center justify-between px-2 py-1 border-b border-df-control-border bg-df-editor-bg flex-shrink-0">
          <div className="text-xs font-medium text-df-text-secondary">{title}</div>
          <button
            onClick={handleToggleDock}
            className="p-1 rounded hover:bg-df-control-bg transition-colors"
            title="Dock panel (fullscreen)"
          >
            <Maximize2 size={12} className="text-df-text-secondary" />
          </button>
        </div>
      )}
      <div ref={panelRef} className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
      {!isDocked && (
        <div
          className={`absolute ${
            direction === 'vertical'
              ? 'bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-df-control-active'
              : 'top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-df-control-active'
          } bg-df-control-border transition-colors`}
          onMouseDown={handleMouseDown}
        >
          <div
            className={`absolute ${
              direction === 'vertical'
                ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          >
            <GripVertical
              size={12}
              className={`text-df-text-tertiary ${direction === 'horizontal' ? 'rotate-90' : ''}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
