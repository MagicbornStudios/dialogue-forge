import React from 'react';
import { NarrativeProgress } from '../../hooks/useNarrativeTraversal';

interface ProgressOverlayProps {
  progress: NarrativeProgress;
  onNextPage: () => void;
  onPreviousPage: () => void;
  visitedNodes: number;
  totalNodes: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function ProgressOverlay({
  progress,
  onNextPage,
  onPreviousPage,
  visitedNodes,
  totalNodes,
  isOpen,
  onToggle,
}: ProgressOverlayProps) {
  const completion = Math.round(progress.progress * 100);

  return (
    <div className="absolute right-6 top-6 z-20">
      <button
        onClick={onToggle}
        className="text-[10px] uppercase tracking-wide px-3 py-2 rounded-full bg-[#12121f]/90 border border-[#1f1f2e] text-gray-300 hover:text-white hover:border-[#e94560] transition-colors"
      >
        {isOpen ? 'Hide Info' : 'Show Info'}
      </button>

      {isOpen && (
        <div className="mt-3 w-64 rounded-2xl border border-[#1a1a2e] bg-[#0b0b14]/95 backdrop-blur p-4 space-y-3 shadow-lg">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Narrative</p>
            <h2 className="text-sm font-semibold text-white leading-tight">{progress.chapterTitle}</h2>
            <p className="text-xs text-gray-500 mt-1">{progress.actTitle}</p>
          </div>

          <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Page {progress.pageIndex + 1}</span>
              <span className="text-gray-500">of {progress.pageCount}</span>
            </div>
            <div className="h-2 bg-[#141422] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#e94560] to-[#8b5cf6]"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
              <span>Progress</span>
              <span className="text-gray-300">{completion}%</span>
            </div>
          </div>

          <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Visited Storylets</span>
              <span className="text-gray-100">{visitedNodes}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Total Nodes</span>
              <span className="text-gray-100">{totalNodes}</span>
            </div>
          </div>

          <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3 space-y-2">
            <p className="text-[11px] text-gray-400">Navigate chapters</p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-md border border-[#2a2a3e] text-gray-300 hover:text-white hover:border-[#e94560] transition-colors"
                onClick={onPreviousPage}
              >
                Previous
              </button>
              <button
                className="flex-1 py-2 rounded-md border border-[#2a2a3e] text-gray-300 hover:text-white hover:border-[#e94560] transition-colors"
                onClick={onNextPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
