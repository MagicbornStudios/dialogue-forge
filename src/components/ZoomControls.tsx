import React from 'react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomToSelection?: () => void;
  className?: string;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomToSelection,
  className
}: ZoomControlsProps) {
  const zoomPercent = Math.round(scale * 100);
  
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Zoom percentage display */}
      <div className="bg-[#0d0d14] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-400 text-center mb-1">
        {zoomPercent}%
      </div>
      
      {/* Zoom buttons */}
      <div className="flex flex-col gap-1 bg-[#0d0d14] border border-[#2a2a3e] rounded-lg p-1">
        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-[#1a1a2e] rounded text-gray-400 hover:text-white transition-colors"
          title="Zoom In (Ctrl +)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-[#1a1a2e] rounded text-gray-400 hover:text-white transition-colors"
          title="Zoom Out (Ctrl -)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        
        <div className="h-px bg-[#2a2a3e] my-1" />
        
        <button
          onClick={onZoomFit}
          className="p-1.5 hover:bg-[#1a1a2e] rounded text-gray-400 hover:text-white transition-colors"
          title="Zoom to Fit (Ctrl 0)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 8h8v8" />
          </svg>
        </button>
        
        {onZoomToSelection && (
          <button
            onClick={onZoomToSelection}
            className="p-1.5 hover:bg-[#1a1a2e] rounded text-gray-400 hover:text-white transition-colors"
            title="Zoom to Selection"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 8h8v8" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}





