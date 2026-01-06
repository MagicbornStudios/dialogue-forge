import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { NarrativeThread, ActNode, ChapterNode, PageNode, Storylet } from '../types/narrative';
import { buildLinearSequence, LinearSequenceItem } from '../utils/narrative-helpers';
import { ScenePlayer } from './ScenePlayer';
import { 
  Play, 
  SkipForward, 
  SkipBack, 
  X, 
  BookOpen, 
  Globe,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface NarrativePlayerProps {
  thread: NarrativeThread;
  onClose: () => void;
  startIndex?: number;
  className?: string;
}

type PlayerMode = 'reading' | 'world';

export function NarrativePlayer({ 
  thread, 
  onClose, 
  startIndex = 0,
  className = '' 
}: NarrativePlayerProps) {
  const [mode, setMode] = useState<PlayerMode>('reading');
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [worldPageId, setWorldPageId] = useState<string | null>(null);
  
  const sequence = useMemo(() => buildLinearSequence(thread), [thread]);
  
  const currentItem = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < sequence.length) {
      return sequence[currentIndex];
    }
    return null;
  }, [sequence, currentIndex]);

  const playableNodes = useMemo(() => {
    return sequence.filter(item => item.type !== 'start' && item.type !== 'end');
  }, [sequence]);

  const currentPlayableIndex = useMemo(() => {
    if (!currentItem) return -1;
    return playableNodes.findIndex(item => item.id === currentItem.id);
  }, [playableNodes, currentItem]);

  useEffect(() => {
    if (sequence.length > 0 && currentIndex === 0 && sequence[0].type === 'start') {
      setCurrentIndex(1);
    }
  }, [sequence, currentIndex]);

  const goNext = useCallback(() => {
    let nextIndex = currentIndex + 1;
    while (nextIndex < sequence.length && sequence[nextIndex].type === 'end') {
      nextIndex++;
    }
    if (nextIndex < sequence.length) {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, sequence]);

  const goPrev = useCallback(() => {
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0 && sequence[prevIndex].type === 'start') {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
    }
  }, [currentIndex, sequence]);

  const enterWorldMode = useCallback((pageId: string) => {
    setWorldPageId(pageId);
    setMode('world');
  }, []);

  const exitWorldMode = useCallback(() => {
    setMode('reading');
    setWorldPageId(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mode === 'reading') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    }
  }, [mode, goNext, goPrev]);

  const getStoryletsForCurrentPage = useCallback((pageId: string): Storylet[] => {
    const page = thread.nodes.pages[pageId];
    if (!page?.storyletIds) return [];
    return page.storyletIds
      .map(id => thread.storylets[id])
      .filter(Boolean);
  }, [thread]);

  const getNodeTypeLabel = (type: string): string => {
    switch (type) {
      case 'act': return 'Act';
      case 'chapter': return 'Chapter';
      case 'page': return 'Page';
      default: return type;
    }
  };

  const getNodeContent = (item: LinearSequenceItem): { title: string; description: string; mainContent?: string } => {
    if (!item.node) return { title: item.title, description: '' };
    
    if (item.type === 'act') {
      const act = item.node as ActNode;
      return { title: act.title, description: act.description || '' };
    } else if (item.type === 'chapter') {
      const chapter = item.node as ChapterNode;
      return { title: chapter.title, description: chapter.description || '' };
    } else if (item.type === 'page') {
      const page = item.node as PageNode;
      return { title: page.title, description: page.description || '', mainContent: page.mainContent };
    }
    return { title: item.title, description: '' };
  };

  if (!currentItem || sequence.length <= 2) {
    return (
      <div className={`h-full w-full flex items-center justify-center bg-gray-950 ${className}`}>
        <div className="text-center text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>No narrative content to play.</p>
          <p className="text-sm mt-2">Add Acts, Chapters, and Pages to your thread.</p>
        </div>
      </div>
    );
  }

  if (mode === 'world' && worldPageId) {
    const page = thread.nodes.pages[worldPageId];
    const dialogueTree = page?.dialogueTreeId ? thread.dialogueTrees[page.dialogueTreeId] : null;
    const storylets = getStoryletsForCurrentPage(worldPageId);

    return (
      <div 
        className={`flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-950 ${className}`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/90">
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-white">World Mode</span>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded">
              {page?.title || 'Unknown Page'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exitWorldMode}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Reading
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            {dialogueTree ? (
              <ScenePlayer
                dialogue={dialogueTree}
                gameState={{ flags: {} }}
                onComplete={exitWorldMode}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p>No dialogue attached to this page.</p>
                  <button
                    onClick={exitWorldMode}
                    className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                  >
                    Return to Reading
                  </button>
                </div>
              </div>
            )}
          </div>

          {storylets.length > 0 && (
            <div className="w-64 border-l border-gray-800 bg-gray-900/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Available Storylets</span>
              </div>
              <div className="space-y-2">
                {storylets.map((storylet) => (
                  <button
                    key={storylet.id}
                    className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-200">{storylet.title}</div>
                    {storylet.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {storylet.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const content = getNodeContent(currentItem);
  const isPage = currentItem.type === 'page';
  const canPlayWorld = isPage && currentItem.node;
  const hasNext = currentIndex < sequence.length - 1 && sequence[currentIndex + 1]?.type !== 'end';
  const hasPrev = currentIndex > 1 || (currentIndex === 1 && sequence[0]?.type !== 'start');

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
            <span className="px-2 py-0.5 bg-gray-800 rounded">{getNodeTypeLabel(currentItem.type)}</span>
            <span>•</span>
            <span>{currentPlayableIndex + 1} / {playableNodes.length}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 min-h-0 overflow-auto">
        <div 
          className="max-w-2xl w-full cursor-pointer"
          onClick={hasNext ? goNext : undefined}
        >
          <div className={`
            p-8 rounded-2xl border backdrop-blur-sm
            ${currentItem.type === 'act' ? 'bg-amber-950/20 border-amber-700/30' : ''}
            ${currentItem.type === 'chapter' ? 'bg-blue-950/20 border-blue-700/30' : ''}
            ${currentItem.type === 'page' ? 'bg-emerald-950/20 border-emerald-700/30' : ''}
          `}>
            <div className={`
              text-xs font-medium uppercase tracking-wider mb-2
              ${currentItem.type === 'act' ? 'text-amber-400' : ''}
              ${currentItem.type === 'chapter' ? 'text-blue-400' : ''}
              ${currentItem.type === 'page' ? 'text-emerald-400' : ''}
            `}>
              {getNodeTypeLabel(currentItem.type)}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              {content.title}
            </h1>
            
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
                  enterWorldMode(currentItem.id);
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
              onClick={() => setCurrentIndex(idx + 1)}
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
