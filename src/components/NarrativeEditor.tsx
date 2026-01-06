import React, { useState, useCallback, useMemo } from 'react';
import {
  Clapperboard,
  Bookmark,
  ArrowLeft,
  Play,
  Search,
  List,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  NarrativeThread,
  NarrativeEditorProps,
  ActNode,
  ChapterNode,
  PageNode,
  Storylet,
  NARRATIVE_NODE_TYPE,
} from '../types/narrative';
import { DialogueTree } from '../types';
import { FlagSchema } from '../types/flags';
import { Character } from '../types/characters';
import { NarrativeGraphView } from './NarrativeGraphView';
import { DialogueEditorV2 } from './DialogueEditorV2';
import { GamePlayer } from './GamePlayer';
import { StoryletLibrary } from './StoryletLibrary';
import { BaseGameState } from '../types/game-state';
import {
  createEmptyDialogueTree,
  attachDialogueTreeToNode,
  updateDialogueTree,
  updateStorylet,
  updateActNode,
  updateChapterNode,
  updatePageNode,
  generateNodeId,
  getActsInOrder,
  getChaptersInOrder,
  getPagesInOrder,
} from '../utils/narrative-helpers';

type NarrativeViewMode = 'narrative' | 'dialogue' | 'storylets';
type DialogueEditContext = 
  | { type: 'page'; pageId: string; dialogueTreeId: string }
  | { type: 'storylet'; storyletId: string }
  | null;

interface NarrativeEditorFullProps extends NarrativeEditorProps {
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
}

export function NarrativeEditor({
  thread,
  onChange,
  className = '',
  flagSchema,
  characters,
  onThreadChange,
  onOpenDialogue,
  onPlayMainThread,
}: NarrativeEditorFullProps) {
  const [viewMode, setViewMode] = useState<NarrativeViewMode>('narrative');
  const [dialogueEditContext, setDialogueEditContext] = useState<DialogueEditContext>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [showOutline, setShowOutline] = useState(false);
  const [outlineSearch, setOutlineSearch] = useState('');
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());

  const activeDialogueTree = useMemo(() => {
    if (!dialogueEditContext || !thread) return null;
    
    if (dialogueEditContext.type === 'page') {
      return thread.dialogueTrees[dialogueEditContext.dialogueTreeId] || null;
    } else if (dialogueEditContext.type === 'storylet') {
      const storylet = thread.storylets[dialogueEditContext.storyletId];
      return storylet?.dialogueTree || null;
    }
    return null;
  }, [dialogueEditContext, thread]);

  const handleNodeSelect = useCallback((nodeId: string | null, nodeType: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
  }, []);

  const handleEnterDialogue = useCallback(
    (pageId: string, dialogueTreeId: string | null) => {
      if (dialogueTreeId && thread?.dialogueTrees[dialogueTreeId]) {
        setDialogueEditContext({ type: 'page', pageId, dialogueTreeId });
        setViewMode('dialogue');
        if (onOpenDialogue) onOpenDialogue({ scope: 'page', id: pageId, dialogueTreeId });
      } else if (thread) {
        const dtId = generateNodeId('dt');
        const page = thread.nodes.pages[pageId];
        const newDialogueTree = createEmptyDialogueTree(dtId, `${page?.title || 'Page'} Dialogue`);
        const updatedThread = attachDialogueTreeToNode(thread, 'page', pageId, newDialogueTree);
        onChange(updatedThread);
        if (onThreadChange) onThreadChange(updatedThread);
        setDialogueEditContext({ type: 'page', pageId, dialogueTreeId: dtId });
        setViewMode('dialogue');
        if (onOpenDialogue) onOpenDialogue({ scope: 'page', id: pageId, dialogueTreeId: dtId });
      }
    },
    [thread, onChange, onThreadChange, onOpenDialogue]
  );

  const handleEditStorylet = useCallback(
    (storyletId: string) => {
      const storylet = thread?.storylets[storyletId];
      if (!storylet) return;
      setDialogueEditContext({ type: 'storylet', storyletId });
      setViewMode('dialogue');
      if (onOpenDialogue) onOpenDialogue({ scope: 'storylet', id: storyletId });
    },
    [thread, onOpenDialogue]
  );

  const handleBackToNarrative = useCallback(() => {
    setViewMode('narrative');
    setDialogueEditContext(null);
  }, []);

  const handleBackToStorylets = useCallback(() => {
    setViewMode('storylets');
    setDialogueEditContext(null);
  }, []);

  const handleDialogueChange = useCallback(
    (dialogueTree: DialogueTree) => {
      if (!dialogueEditContext || !thread) return;
      
      if (dialogueEditContext.type === 'page') {
        const updatedThread = updateDialogueTree(thread, dialogueEditContext.dialogueTreeId, dialogueTree);
        onChange(updatedThread);
        if (onThreadChange) onThreadChange(updatedThread);
      } else if (dialogueEditContext.type === 'storylet') {
        const updatedThread = updateStorylet(thread, dialogueEditContext.storyletId, {
          dialogueTree,
        });
        onChange(updatedThread);
        if (onThreadChange) onThreadChange(updatedThread);
      }
    },
    [thread, onChange, dialogueEditContext, onThreadChange]
  );

  const handlePlayMainThread = () => {
    setShowPlayer(true);
    if (onPlayMainThread) onPlayMainThread();
  };

  const getSelectedNode = () => {
    if (!selectedNodeId || !thread) return null;
    if (selectedNodeType === NARRATIVE_NODE_TYPE.ACT) return thread.nodes.acts[selectedNodeId];
    if (selectedNodeType === NARRATIVE_NODE_TYPE.CHAPTER) return thread.nodes.chapters[selectedNodeId];
    if (selectedNodeType === NARRATIVE_NODE_TYPE.PAGE) return thread.nodes.pages[selectedNodeId];
    return null;
  };

  const handleUpdateSelectedNode = useCallback((updates: Partial<ActNode | ChapterNode | PageNode>) => {
    if (!selectedNodeId || !thread || !selectedNodeType) return;
    
    let updatedThread = thread;
    if (selectedNodeType === NARRATIVE_NODE_TYPE.ACT) {
      updatedThread = updateActNode(thread, selectedNodeId, updates as Partial<ActNode>);
    } else if (selectedNodeType === NARRATIVE_NODE_TYPE.CHAPTER) {
      updatedThread = updateChapterNode(thread, selectedNodeId, updates as Partial<ChapterNode>);
    } else if (selectedNodeType === NARRATIVE_NODE_TYPE.PAGE) {
      updatedThread = updatePageNode(thread, selectedNodeId, updates as Partial<PageNode>);
    }
    
    onChange(updatedThread);
    if (onThreadChange) onThreadChange(updatedThread);
  }, [thread, selectedNodeId, selectedNodeType, onChange, onThreadChange]);

  const handleJumpToNode = useCallback((nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(nodeType);
    setShowOutline(false);
  }, []);

  const toggleActExpanded = useCallback((actId: string) => {
    setExpandedActs(prev => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  }, []);

  const outlineData = useMemo(() => {
    if (!thread) return [];
    const acts = getActsInOrder(thread);
    const search = outlineSearch.toLowerCase();
    
    return acts.map(act => {
      const chapters = getChaptersInOrder(thread, act.id);
      const chaptersWithPages = chapters.map(chapter => {
        const pages = getPagesInOrder(thread, chapter.id);
        const filteredPages = search 
          ? pages.filter(p => p.title.toLowerCase().includes(search))
          : pages;
        return { ...chapter, pages: filteredPages };
      }).filter(ch => !search || ch.title.toLowerCase().includes(search) || ch.pages.length > 0);
      
      return { ...act, chapters: chaptersWithPages };
    }).filter(a => !search || a.title.toLowerCase().includes(search) || a.chapters.length > 0);
  }, [thread, outlineSearch]);

  const selectedNode = getSelectedNode();
  const dialogueEditLabel = dialogueEditContext?.type === 'storylet' 
    ? thread?.storylets[dialogueEditContext.storyletId]?.title 
    : dialogueEditContext?.type === 'page'
    ? thread?.nodes.pages[dialogueEditContext.pageId]?.title
    : '';

  return (
    <div className={`flex flex-col h-full bg-gray-950 ${className}`}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-4">
          {viewMode === 'dialogue' && (
            <button
              onClick={dialogueEditContext?.type === 'storylet' ? handleBackToStorylets : handleBackToNarrative}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">
                {dialogueEditContext?.type === 'storylet' ? 'Back to Storylets' : 'Back to Graph'}
              </span>
            </button>
          )}
          
          <h1 className="text-lg font-semibold text-white">
            {viewMode === 'dialogue' && dialogueEditLabel 
              ? `Editing: ${dialogueEditLabel}` 
              : thread?.title || 'Narrative Thread'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'narrative' && thread && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                showOutline ? 'bg-gray-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
              title="Toggle outline view"
            >
              <List size={14} />
              Outline
            </button>
          )}
          
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('narrative'); setDialogueEditContext(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'narrative'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Clapperboard size={14} />
              Timeline
            </button>
            <button
              onClick={() => { setViewMode('storylets'); setDialogueEditContext(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'storylets'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Bookmark size={14} />
              Storylets
            </button>
          </div>
          {viewMode === 'narrative' && thread && (
            <button
              onClick={handlePlayMainThread}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm"
              title="Play main thread"
            >
              <Play size={14} />
              Play
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex">
        {viewMode === 'narrative' && thread && (
          <>
            {showOutline && (
              <aside className="w-72 border-r border-gray-800 bg-gray-900 flex flex-col">
                <div className="p-3 border-b border-gray-800">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={outlineSearch}
                      onChange={(e) => setOutlineSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                    {outlineSearch && (
                      <button
                        onClick={() => setOutlineSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {outlineData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No items found</p>
                  ) : (
                    <div className="space-y-1">
                      {outlineData.map(act => (
                        <div key={act.id}>
                          <button
                            onClick={() => toggleActExpanded(act.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors hover:bg-gray-800 ${
                              selectedNodeId === act.id ? 'bg-amber-900/30 text-amber-400' : 'text-gray-300'
                            }`}
                          >
                            {expandedActs.has(act.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="text-amber-400 text-xs font-medium">ACT</span>
                            <span className="truncate flex-1" onClick={(e) => { e.stopPropagation(); handleJumpToNode(act.id, NARRATIVE_NODE_TYPE.ACT); }}>
                              {act.title}
                            </span>
                          </button>
                          
                          {expandedActs.has(act.id) && (
                            <div className="ml-4 border-l border-gray-800 pl-2 space-y-0.5">
                              {act.chapters.map(chapter => (
                                <div key={chapter.id}>
                                  <button
                                    onClick={() => handleJumpToNode(chapter.id, NARRATIVE_NODE_TYPE.CHAPTER)}
                                    className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm transition-colors hover:bg-gray-800 ${
                                      selectedNodeId === chapter.id ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400'
                                    }`}
                                  >
                                    <span className="text-blue-400 text-[10px] font-medium">CH</span>
                                    <span className="truncate">{chapter.title}</span>
                                  </button>
                                  
                                  <div className="ml-4 space-y-0.5">
                                    {chapter.pages.map(page => (
                                      <button
                                        key={page.id}
                                        onClick={() => handleJumpToNode(page.id, NARRATIVE_NODE_TYPE.PAGE)}
                                        className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-xs transition-colors hover:bg-gray-800 ${
                                          selectedNodeId === page.id ? 'bg-emerald-900/30 text-emerald-400' : 'text-gray-500'
                                        }`}
                                      >
                                        <span className="text-emerald-400 text-[9px]">PG</span>
                                        <span className="truncate">{page.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            )}
            
            <div className="flex-1">
              <NarrativeGraphView
                thread={thread}
                onChange={(newThread) => {
                  onChange(newThread);
                  if (onThreadChange) onThreadChange(newThread);
                }}
                onNodeSelect={handleNodeSelect}
                onEnterDialogue={handleEnterDialogue}
              />
            </div>
            
            {selectedNode && (
              <aside className="w-80 border-l border-gray-800 bg-gray-900 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                      selectedNodeType === NARRATIVE_NODE_TYPE.ACT ? 'bg-amber-900/50 text-amber-400' :
                      selectedNodeType === NARRATIVE_NODE_TYPE.CHAPTER ? 'bg-blue-900/50 text-blue-400' :
                      'bg-emerald-900/50 text-emerald-400'
                    }`}>
                      {selectedNodeType}
                    </span>
                    <button
                      onClick={() => handleNodeSelect(null, null)}
                      className="p-1 text-gray-500 hover:text-white"
                    >
                      <span className="sr-only">Close</span>
                      &times;
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedNode.title}
                      onChange={(e) => handleUpdateSelectedNode({ title: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-gray-600 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Description</label>
                    <textarea
                      value={selectedNode.description || ''}
                      onChange={(e) => handleUpdateSelectedNode({ description: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-gray-600 outline-none resize-y min-h-[80px]"
                      placeholder="Optional description..."
                    />
                  </div>
                  
                  {selectedNodeType === NARRATIVE_NODE_TYPE.PAGE && (
                    <>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase block mb-1">Page Content</label>
                        <textarea
                          value={(selectedNode as PageNode).mainContent || ''}
                          onChange={(e) => handleUpdateSelectedNode({ mainContent: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-gray-600 outline-none resize-y min-h-[120px]"
                          placeholder="Main narrative content for this page..."
                        />
                      </div>
                      
                      <div className="pt-2 border-t border-gray-800">
                        <button
                          onClick={() => handleEnterDialogue(selectedNodeId!, (selectedNode as PageNode).dialogueTreeId || null)}
                          className="w-full py-2 rounded bg-cyan-600/80 hover:bg-cyan-600 text-white text-sm flex items-center justify-center gap-2"
                        >
                          {(selectedNode as PageNode).dialogueTreeId ? 'Edit Dialogue' : 'Create Dialogue'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            )}
          </>
        )}

        {viewMode === 'dialogue' && activeDialogueTree && (
          <div className="h-full w-full">
            <DialogueEditorV2
              dialogue={activeDialogueTree}
              onChange={handleDialogueChange}
              flagSchema={flagSchema}
              characters={characters}
              storylets={thread?.storylets || {}}
              showTitleEditor={true}
              className="df-dialogue-theme"
            />
          </div>
        )}

        {viewMode === 'storylets' && thread && (
          <StoryletLibrary
            thread={thread}
            onChange={onChange}
            onEditStorylet={handleEditStorylet}
            onPlayStorylet={(storyletId) => {
              const s = thread.storylets[storyletId];
              if (!s) return;
              setDialogueEditContext({ type: 'storylet', storyletId });
              setViewMode('dialogue');
            }}
          />
        )}

        {!thread && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <Clapperboard size={64} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-xl font-medium text-gray-400 mb-2">No Narrative Thread</h2>
              <p className="text-sm text-gray-500">Create or load a narrative thread to get started.</p>
            </div>
          </div>
        )}
      </main>

      {showPlayer && thread && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-[min(1100px,95vw)] h-[min(720px,90vh)] overflow-hidden relative">
            <GamePlayer<BaseGameState>
              thread={thread}
              gameState={{ flags: {} }}
              onClose={() => setShowPlayer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
