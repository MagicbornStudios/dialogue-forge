import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  Store,
  Sword,
  Users,
  Scroll,
  Sparkles,
  Tag,
  Repeat,
  Clock,
  Filter,
  Edit3,
  Trash2,
  Play,
} from 'lucide-react';
import {
  Storylet,
  NarrativeThread,
  STORYLET_CATEGORY,
  StoryletCategory,
} from '../types/narrative';
import {
  createStorylet,
  addStoryletToThread,
  removeStoryletFromThread,
  generateNodeId,
} from '../utils/narrative-helpers';

interface StoryletLibraryProps {
  thread: NarrativeThread;
  onChange: (thread: NarrativeThread) => void;
  onEditStorylet?: (storyletId: string) => void;
  onPlayStorylet?: (storyletId: string) => void;
  className?: string;
  // DB-agnostic events
  onStoryletCreated?: (storylet: Storylet) => void;
  onStoryletDeleted?: (storyletId: string) => void;
  onStoryletUpdated?: (storylet: Storylet) => void;
}

const CATEGORY_CONFIG: Record<
  StoryletCategory,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  [STORYLET_CATEGORY.MERCHANT]: {
    icon: <Store size={16} />,
    label: 'Merchant',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
  },
  [STORYLET_CATEGORY.DUNGEON]: {
    icon: <Sword size={16} />,
    label: 'Dungeon',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
  },
  [STORYLET_CATEGORY.ENCOUNTER]: {
    icon: <Users size={16} />,
    label: 'Encounter',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
  },
  [STORYLET_CATEGORY.QUEST]: {
    icon: <Scroll size={16} />,
    label: 'Quest',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/30',
  },
  [STORYLET_CATEGORY.AMBIENT]: {
    icon: <Sparkles size={16} />,
    label: 'Ambient',
    color: 'text-violet-400',
    bgColor: 'bg-violet-900/30',
  },
  [STORYLET_CATEGORY.CUSTOM]: {
    icon: <Tag size={16} />,
    label: 'Custom',
    color: 'text-slate-400',
    bgColor: 'bg-slate-900/30',
  },
};

export function StoryletLibrary({
  thread,
  onChange,
  onEditStorylet,
  onPlayStorylet,
  className = '',
  onStoryletCreated,
  onStoryletDeleted,
  onStoryletUpdated,
}: StoryletLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StoryletCategory | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryletTitle, setNewStoryletTitle] = useState('');
  const [newStoryletCategory, setNewStoryletCategory] = useState<StoryletCategory>(
    STORYLET_CATEGORY.CUSTOM
  );

  const storylets = useMemo(() => {
    let filtered = Object.values(thread.storylets);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [thread.storylets, searchQuery, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: Object.keys(thread.storylets).length };
    Object.values(thread.storylets).forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [thread.storylets]);

  const handleCreateStorylet = () => {
    if (!newStoryletTitle.trim()) return;

    const storyletId = generateNodeId('storylet');
    const newStorylet = createStorylet(storyletId, newStoryletTitle.trim(), newStoryletCategory);
    const updatedThread = addStoryletToThread(thread, newStorylet);

    onChange(updatedThread);
    if (onStoryletCreated) onStoryletCreated(newStorylet);
    
    setShowCreateModal(false);
    setNewStoryletTitle('');
    setNewStoryletCategory(STORYLET_CATEGORY.CUSTOM);

    if (onEditStorylet) {
      onEditStorylet(storyletId);
    }
  };

  const handleDeleteStorylet = (storyletId: string) => {
    const updatedThread = removeStoryletFromThread(thread, storyletId);
    onChange(updatedThread);
    if (onStoryletDeleted) onStoryletDeleted(storyletId);
  };

  return (
    <div className={`h-full flex flex-col bg-gray-950 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark size={20} className="text-purple-400" />
            Storylet Library
            <span className="text-sm font-normal text-gray-500">
              ({Object.keys(thread.storylets).length})
            </span>
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Storylet
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search storylets..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              All ({categoryCounts.all || 0})
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key as StoryletCategory)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors ${
                  categoryFilter === key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title={config.label}
              >
                <span className={config.color}>{config.icon}</span>
                {categoryCounts[key] > 0 && (
                  <span className="text-gray-500">{categoryCounts[key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {storylets.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <Bookmark size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchQuery || categoryFilter !== 'all'
                ? 'No Storylets Match Your Search'
                : 'No Storylets Yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create reusable dialogue templates for merchants, encounters, dungeons, and more.'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
              >
                <Plus size={16} />
                Create First Storylet
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storylets.map((storylet) => {
              const config = CATEGORY_CONFIG[storylet.category];
              return (
                <div
                  key={storylet.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden"
                >
                  <div className={`${config.bgColor} px-4 py-3 border-b border-gray-800`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {storylet.repeatable && (
                          <span className="p-1 rounded bg-white/10" title="Repeatable">
                            <Repeat size={12} className="text-white/70" />
                          </span>
                        )}
                        {storylet.cooldown && (
                          <span
                            className="p-1 rounded bg-white/10 flex items-center gap-0.5"
                            title={`Cooldown: ${storylet.cooldown}s`}
                          >
                            <Clock size={12} className="text-white/70" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-white mb-1">{storylet.title}</h3>
                    {storylet.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {storylet.description}
                      </p>
                    )}

                    {storylet.tags && storylet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {storylet.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {storylet.tags.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                            +{storylet.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                      {onEditStorylet && (
                        <button
                          onClick={() => onEditStorylet(storylet.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors"
                        >
                          <Edit3 size={12} />
                          Edit
                        </button>
                      )}
                      {onPlayStorylet && (
                        <button
                          onClick={() => onPlayStorylet(storylet.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-colors"
                        >
                          <Play size={12} />
                          Preview
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStorylet(storylet.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-red-900/30 text-red-400 text-xs transition-colors ml-auto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Create New Storylet</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={newStoryletTitle}
                  onChange={(e) => setNewStoryletTitle(e.target.value)}
                  placeholder="Enter storylet title..."
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setNewStoryletCategory(key as StoryletCategory)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        newStoryletCategory === key
                          ? `${config.bgColor} border-gray-600 ${config.color}`
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {config.icon}
                      <span>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStorylet}
                disabled={!newStoryletTitle.trim()}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors"
              >
                Create Storylet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
