import React from 'react';
import { NarrativeProgress } from '../../hooks/useNarrativeTraversal';

interface WorldPaneProps {
  progress: NarrativeProgress;
  onNextPage: () => void;
  onPreviousPage: () => void;
  visitedPages: number;
  totalPages: number;
  hasPages: boolean;
}

export function WorldPane({
  progress,
  onNextPage,
  onPreviousPage,
  visitedPages,
  totalPages,
  hasPages,
}: WorldPaneProps) {
  const completion = Math.round(progress.progress * 100);
  const canGoPrevious = hasPages && progress.pageIndex > 0;
  const canGoNext = hasPages && progress.pageIndex < progress.pageCount - 1;
  const showNavigation = canGoPrevious || canGoNext;

  return (
    <aside className="w-64 bg-[#0b0b14] border-r border-[#1a1a2e] flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-[#1a1a2e]">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Chapter</p>
        <h2 className="text-lg font-semibold text-white leading-tight">{progress.chapterTitle}</h2>
        <p className="text-xs text-gray-500 mt-1">Act: {progress.actTitle}</p>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3">
          {hasPages ? (
            <>
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
            </>
          ) : (
            <p className="text-xs text-gray-500">
              No pages are available yet. Add a page to begin the journey.
            </p>
          )}
        </div>

        <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Visited Pages</span>
            <span className="text-gray-100">{visitedPages}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Pages</span>
            <span className="text-gray-100">{totalPages}</span>
          </div>
        </div>

        <div className="bg-[#0f0f1a] border border-[#1f1f2e] rounded-lg p-3 space-y-2">
          <p className="text-[11px] text-gray-400">Navigate pages</p>
          {showNavigation ? (
            <div className="flex gap-2">
              {canGoPrevious && (
                <button
                  className="flex-1 py-2 rounded-md border border-[#2a2a3e] text-gray-300 hover:text-white hover:border-[#e94560] transition-colors"
                  onClick={onPreviousPage}
                >
                  Previous
                </button>
              )}
              {canGoNext && (
                <button
                  className="flex-1 py-2 rounded-md border border-[#2a2a3e] text-gray-300 hover:text-white hover:border-[#e94560] transition-colors"
                  onClick={onNextPage}
                >
                  Next
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">
              {hasPages ? 'This chapter has one page.' : 'No pages to navigate yet.'}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
