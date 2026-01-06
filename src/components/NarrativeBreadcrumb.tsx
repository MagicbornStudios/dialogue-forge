import React from 'react';
import { ChevronRight, Home, Clapperboard, BookOpen, FileText, MessageSquare } from 'lucide-react';
import { NarrativeThread, NarrativeScope, NarrativeBreadcrumbItem } from '../types/narrative';

interface NarrativeBreadcrumbProps {
  thread: NarrativeThread;
  scope: NarrativeScope;
  dialogueTreeTitle?: string;
  onNavigate: (scope: NarrativeScope) => void;
  className?: string;
}

export function NarrativeBreadcrumb({
  thread,
  scope,
  dialogueTreeTitle,
  onNavigate,
  className = '',
}: NarrativeBreadcrumbProps) {
  const items: NarrativeBreadcrumbItem[] = [];

  items.push({
    id: 'thread',
    title: thread.title || 'Narrative Thread',
    type: 'thread',
  });

  if (scope.actId) {
    const act = thread.nodes.acts[scope.actId];
    if (act) {
      items.push({
        id: act.id,
        title: act.title,
        type: 'act',
      });
    }
  }

  if (scope.chapterId) {
    const chapter = thread.nodes.chapters[scope.chapterId];
    if (chapter) {
      items.push({
        id: chapter.id,
        title: chapter.title,
        type: 'chapter',
      });
    }
  }

  if (scope.pageId) {
    const page = thread.nodes.pages[scope.pageId];
    if (page) {
      items.push({
        id: page.id,
        title: page.title,
        type: 'page',
      });
    }
  }

  if (scope.level === 'dialogue' && dialogueTreeTitle) {
    items.push({
      id: 'dialogue',
      title: dialogueTreeTitle,
      type: 'dialogue',
    });
  }

  const handleClick = (item: NarrativeBreadcrumbItem, index: number) => {
    if (item.type === 'thread') {
      onNavigate({ level: 'thread' });
    } else if (item.type === 'act') {
      onNavigate({ level: 'act', actId: item.id });
    } else if (item.type === 'chapter') {
      const chapter = thread.nodes.chapters[item.id];
      if (chapter) {
        onNavigate({ level: 'chapter', actId: chapter.actId, chapterId: item.id });
      }
    } else if (item.type === 'page') {
      const page = thread.nodes.pages[item.id];
      if (page) {
        const chapter = thread.nodes.chapters[page.chapterId];
        if (chapter) {
          onNavigate({ level: 'page', actId: chapter.actId, chapterId: page.chapterId, pageId: item.id });
        }
      }
    }
  };

  const getIcon = (type: NarrativeBreadcrumbItem['type']) => {
    switch (type) {
      case 'thread':
        return <Home size={14} className="text-gray-400" />;
      case 'act':
        return <Clapperboard size={14} className="text-amber-400" />;
      case 'chapter':
        return <BookOpen size={14} className="text-blue-400" />;
      case 'page':
        return <FileText size={14} className="text-emerald-400" />;
      case 'dialogue':
        return <MessageSquare size={14} className="text-cyan-400" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: NarrativeBreadcrumbItem['type']) => {
    switch (type) {
      case 'thread':
        return 'text-gray-300 hover:text-white';
      case 'act':
        return 'text-amber-300 hover:text-amber-200';
      case 'chapter':
        return 'text-blue-300 hover:text-blue-200';
      case 'page':
        return 'text-emerald-300 hover:text-emerald-200';
      case 'dialogue':
        return 'text-cyan-300 hover:text-cyan-200';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !isLast;

        return (
          <React.Fragment key={`${item.type}-${item.id}`}>
            <button
              onClick={() => isClickable && handleClick(item, index)}
              disabled={!isClickable}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                isClickable
                  ? `${getTypeColor(item.type)} cursor-pointer hover:bg-gray-800`
                  : 'text-gray-400 cursor-default'
              }`}
            >
              {getIcon(item.type)}
              <span className="text-sm font-medium max-w-[150px] truncate">{item.title}</span>
            </button>
            {!isLast && <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
