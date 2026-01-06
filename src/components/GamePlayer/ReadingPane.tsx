import React, { useMemo, useCallback, useEffect } from 'react';
import { BookOpen, Globe, SkipBack, SkipForward, ChevronRight } from 'lucide-react';
import { ActNode, ChapterNode, PageNode } from '../../types/narrative';
import { buildLinearSequence, LinearSequenceItem } from '../../utils/narrative-helpers';
import { ReadingPaneProps } from './types';

function getNodeTypeLabel(type: string): string {
  switch (type) {
    case 'act':
      return 'Act';
    case 'chapter':
      return 'Chapter';
    case 'page':
      return 'Page';
    default:
      return type;
  }
}

function getNodeContent(
  item: LinearSequenceItem
): { title: string; description: string; mainContent?: string } {
  if (!item.node) return { title: item.title, description: '' };

  if (item.type === 'act') {
    const act = item.node as ActNode;
    return { title: act.title, description: act.description || '' };
  } else if (item.type === 'chapter') {
    const chapter = item.node as ChapterNode;
    return { title: chapter.title, description: chapter.description || '' };
  } else if (item.type === 'page') {
    const page = item.node as PageNode;
    return {
      title: page.title,
      description: page.description || '',
      mainContent: page.mainContent,
    };
  }
  return { title: item.title, description: '' };
}

export function ReadingPane({
  thread,
  currentIndex,
  onIndexChange,
  onPlayWorld,
  className = '',
}: ReadingPaneProps) {
  const sequence = useMemo(() => buildLinearSequence(thread), [thread]);

  const currentItem = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < sequence.length) {
      return sequence[currentIndex];
    }
    return null;
  }, [sequence, currentIndex]);

  const playableNodes = useMemo(() => {
    return sequence.filter((item) => item.type !== 'start' && item.type !== 'end');
  }, [sequence]);

  const currentPlayableIndex = useMemo(() => {
    if (!currentItem) return -1;
    return playableNodes.findIndex((item) => item.id === currentItem.id);
  }, [playableNodes, currentItem]);

  useEffect(() => {
    if (
      sequence.length > 0 &&
      currentIndex === 0 &&
      sequence[0].type === 'start'
    ) {
      onIndexChange(1);
    }
  }, [sequence, currentIndex, onIndexChange]);

  const goNext = useCallback(() => {
    let nextIndex = currentIndex + 1;
    while (nextIndex < sequence.length && sequence[nextIndex].type === 'end') {
      nextIndex++;
    }
    if (nextIndex < sequence.length) {
      onIndexChange(nextIndex);
    }
  }, [currentIndex, sequence, onIndexChange]);

  const goPrev = useCallback(() => {
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0 && sequence[prevIndex].type === 'start') {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      onIndexChange(prevIndex);
    }
  }, [currentIndex, sequence, onIndexChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  if (!currentItem || sequence.length <= 2) {
    return (
      <div
        className={`h-full w-full flex items-center justify-center bg-gray-950 ${className}`}
      >
        <div className="text-center text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>No narrative content to play.</p>
          <p className="text-sm mt-2">
            Add Acts, Chapters, and Pages to your thread.
          </p>
        </div>
      </div>
    );
  }

  const content = getNodeContent(currentItem);
  const isPage = currentItem.type === 'page';
  const page = isPage ? (currentItem.node as PageNode) : null;
  const canPlayWorld =
    isPage && page && (page.dialogueTreeId || (page.storyletIds && page.storyletIds.length > 0));
  const hasNext =
    currentIndex < sequence.length - 1 &&
    sequence[currentIndex + 1]?.type !== 'end';
  const hasPrev =
    currentIndex > 1 ||
    (currentIndex === 1 && sequence[0]?.type !== 'start');

  return (
    <div
      className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/90">
        <div className="flex items-center gap-3">
          <BookOpen size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Reading</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-gray-800 rounded">
              {getNodeTypeLabel(currentItem.type)}
            </span>
            <span>•</span>
            <span>
              {currentPlayableIndex + 1} / {playableNodes.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 min-h-0 overflow-auto">
        <div
          className="max-w-2xl w-full cursor-pointer"
          onClick={hasNext ? goNext : undefined}
        >
          <div
            className={`
            p-8 rounded-2xl border backdrop-blur-sm
            ${currentItem.type === 'act' ? 'bg-amber-950/20 border-amber-700/30' : ''}
            ${currentItem.type === 'chapter' ? 'bg-blue-950/20 border-blue-700/30' : ''}
            ${currentItem.type === 'page' ? 'bg-emerald-950/20 border-emerald-700/30' : ''}
          `}
          >
            <div
              className={`
              text-xs font-medium uppercase tracking-wider mb-2
              ${currentItem.type === 'act' ? 'text-amber-400' : ''}
              ${currentItem.type === 'chapter' ? 'text-blue-400' : ''}
              ${currentItem.type === 'page' ? 'text-emerald-400' : ''}
            `}
            >
              {getNodeTypeLabel(currentItem.type)}
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">{content.title}</h1>

            {content.description && (
              <p className="text-lg text-gray-400 italic mb-4">
                {content.description}
              </p>
            )}

            {content.mainContent && (
              <div className="mt-6 pt-6 border-t border-gray-700/50">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {content.mainContent}
                </p>
              </div>
            )}

            {hasNext && (
              <div className="mt-8 flex items-center justify-center text-gray-500 text-sm">
                <span>Click or press Enter to continue</span>
                <ChevronRight size={16} className="ml-1 animate-pulse" />
              </div>
            )}
          </div>

          {canPlayWorld && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayWorld(currentItem.id, page?.dialogueTreeId || null);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-900/30"
              >
                <Globe size={18} />
                Play World
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/90">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipBack size={16} />
          Previous
        </button>

        <div className="flex items-center gap-2">
          {sequence.slice(1, -1).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => onIndexChange(idx + 1)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${idx + 1 === currentIndex ? 'bg-white scale-125' : 'bg-gray-600 hover:bg-gray-500'}
                ${item.type === 'act' ? 'ring-1 ring-amber-500/50' : ''}
              `}
              title={item.title}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={!hasNext}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );
}
