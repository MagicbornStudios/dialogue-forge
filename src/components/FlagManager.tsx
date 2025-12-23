import React, { useState, useMemo } from 'react';
import { FlagSchema, FlagDefinition, FlagType } from '../types/flags';
import { DialogueTree } from '../types';

interface FlagManagerProps {
  flagSchema: FlagSchema;
  dialogue?: DialogueTree;
  onUpdate: (schema: FlagSchema) => void;
  onClose: () => void;
}

const flagTypeColors: Record<FlagType, string> = {
  dialogue: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  quest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  achievement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  item: 'bg-green-500/20 text-green-400 border-green-500/30',
  stat: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  title: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  global: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const flagTypeLabels: Record<FlagType, string> = {
  dialogue: 'Dialogue',
  quest: 'Quest',
  achievement: 'Achievement',
  item: 'Item',
  stat: 'Stat',
  title: 'Title',
  global: 'Global',
};

const flagTypeIcons: Record<FlagType, string> = {
  dialogue: '💬',
  quest: '📜',
  achievement: '🏆',
  item: '🎒',
  stat: '📊',
  title: '👑',
  global: '🌐',
};

export function FlagManager({ flagSchema, dialogue, onUpdate, onClose }: FlagManagerProps) {
  const [editingFlag, setEditingFlag] = useState<FlagDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  // Find all flags used in the dialogue tree
  const usedFlags = useMemo(() => {
    if (!dialogue) return new Set<string>();
    const used = new Set<string>();
    
    Object.values(dialogue.nodes).forEach(node => {
      if (node.setFlags) {
        node.setFlags.forEach(flagId => used.add(flagId));
      }
      if (node.choices) {
        node.choices.forEach(choice => {
          if (choice.setFlags) {
            choice.setFlags.forEach(flagId => used.add(flagId));
          }
          if (choice.conditions) {
            choice.conditions.forEach(cond => used.add(cond.flag));
          }
        });
      }
    });
    
    return used;
  }, [dialogue]);

  // Group flags by type
  const flagsByType = useMemo(() => {
    const grouped: Record<string, FlagDefinition[]> = {
      all: flagSchema.flags,
    };
    
    Object.keys(flagTypeLabels).forEach(type => {
      grouped[type] = flagSchema.flags.filter(f => f.type === type);
    });
    
    return grouped;
  }, [flagSchema.flags]);

  const currentFlags = flagsByType[selectedSection] || [];

  const handleCreateFlag = (type?: FlagType) => {
    const newFlag: FlagDefinition = {
      id: 'new_flag',
      name: 'New Flag',
      type: type || 'dialogue',
    };
    setEditingFlag(newFlag);
    setIsCreating(true);
  };

  const handleSaveFlag = (flag: FlagDefinition) => {
    if (isCreating) {
      onUpdate({
        ...flagSchema,
        flags: [...flagSchema.flags, flag]
      });
      setIsCreating(false);
    } else {
      onUpdate({
        ...flagSchema,
        flags: flagSchema.flags.map(f => f.id === flag.id ? flag : f)
      });
    }
    setEditingFlag(null);
  };

  const handleDeleteFlag = (flagId: string) => {
    if (confirm(`Delete flag "${flagId}"?`)) {
      onUpdate({
        ...flagSchema,
        flags: flagSchema.flags.filter(f => f.id !== flagId)
      });
    }
  };

  // Get counts for each section
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: flagSchema.flags.length };
    Object.keys(flagTypeLabels).forEach(type => {
      counts[type] = flagsByType[type].length;
    });
    return counts;
  }, [flagSchema.flags, flagsByType]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-[#0d0d14] border border-[#1a1a2e] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a2e] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Flag Manager</h2>
            <p className="text-xs text-gray-500 mt-1">
              {dialogue && (
                <span>
                  <span className="text-[#e94560] font-semibold">{usedFlags.size}</span>
                  <span className="text-gray-500"> / </span>
                  <span className="text-gray-400">{flagSchema.flags.length}</span>
                  <span className="text-gray-500"> flags used in dialogue</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCreateFlag(selectedSection !== 'all' ? selectedSection as FlagType : undefined)}
              className="px-3 py-1.5 bg-[#e94560] hover:bg-[#d63850] text-white text-sm rounded flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Flag
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation */}
          <div className="w-64 border-r border-[#1a1a2e] bg-[#12121a] flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-[#1a1a2e]">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Sections</div>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedSection('all')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
                    selectedSection === 'all'
                      ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30'
                      : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                  }`}
                >
                  <span>All Flags</span>
                  <span className="text-xs text-gray-500">{sectionCounts.all}</span>
                </button>
                {Object.entries(flagTypeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedSection(type)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
                      selectedSection === type
                        ? `${flagTypeColors[type as FlagType]} border`
                        : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{flagTypeIcons[type as FlagType]}</span>
                      <span>{label}</span>
                    </span>
                    <span className="text-xs text-gray-500">{sectionCounts[type] || 0}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Info Section */}
            <div className="p-4 border-t border-[#1a1a2e] mt-auto">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Info</div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  <span className="text-gray-500">Dialogue flags</span> (gray) are temporary and reset after dialogue ends.
                </p>
                <p>
                  <span className="text-white">Game flags</span> (colored) persist and affect the entire game.
                </p>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto">
            {editingFlag ? (
              <div className="p-6">
                <FlagEditor
                  flag={editingFlag}
                  categories={flagSchema.categories || []}
                  onSave={handleSaveFlag}
                  onCancel={() => { setEditingFlag(null); setIsCreating(false); }}
                />
              </div>
            ) : (
              <div className="p-6">
                {currentFlags.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-4">No {selectedSection === 'all' ? '' : flagTypeLabels[selectedSection as FlagType]} flags defined yet.</p>
                    <button
                      onClick={() => handleCreateFlag(selectedSection !== 'all' ? selectedSection as FlagType : undefined)}
                      className="px-4 py-2 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
                    >
                      Create {selectedSection === 'all' ? 'a' : flagTypeLabels[selectedSection as FlagType]} Flag
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentFlags.map(flag => {
                      const isUsed = usedFlags.has(flag.id);
                      return (
                        <div 
                          key={flag.id} 
                          className={`bg-[#12121a] border rounded-lg p-4 hover:bg-[#1a1a2e] transition-colors ${
                            isUsed ? 'border-l-4 border-l-[#e94560]' : 'border-[#1a1a2e]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${flagTypeColors[flag.type]}`}>
                                  {flagTypeLabels[flag.type]}
                                </span>
                                <span className="font-mono text-sm text-white">{flag.id}</span>
                                {isUsed && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-[#e94560]/20 text-[#e94560] rounded border border-[#e94560]/30">
                                    Used
                                  </span>
                                )}
                              </div>
                              {flag.name !== flag.id && (
                                <div className="text-sm text-gray-300 mb-1">{flag.name}</div>
                              )}
                              {flag.description && (
                                <div className="text-xs text-gray-500 mt-1">{flag.description}</div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {flag.category && (
                                  <span className="text-xs text-gray-500">Category: {flag.category}</span>
                                )}
                                {flag.valueType && (
                                  <span className="text-xs text-gray-500">Type: {flag.valueType}</span>
                                )}
                                {flag.defaultValue !== undefined && (
                                  <span className="text-xs text-gray-500">Default: {String(flag.defaultValue)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingFlag(flag)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a3e] rounded transition-colors"
                                title="Edit"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteFlag(flag.id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlagEditorProps {
  flag: FlagDefinition;
  categories: string[];
  onSave: (flag: FlagDefinition) => void;
  onCancel: () => void;
}

function FlagEditor({ flag, categories, onSave, onCancel }: FlagEditorProps) {
  const [edited, setEdited] = useState<FlagDefinition>(flag);

  const flagTypes: FlagType[] = ['dialogue', 'quest', 'achievement', 'item', 'stat', 'title', 'global'];

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Flag ID</label>
        <input
          type="text"
          value={edited.id}
          onChange={(e) => setEdited({ ...edited, id: e.target.value })}
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 font-mono focus:border-[#e94560] outline-none"
          placeholder="quest_dragon_slayer"
        />
        <p className="text-xs text-gray-500 mt-1">Use prefixes: quest_, item_, stat_, etc.</p>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Display Name</label>
        <input
          type="text"
          value={edited.name}
          onChange={(e) => setEdited({ ...edited, name: e.target.value })}
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 focus:border-[#e94560] outline-none"
          placeholder="Dragon Slayer Quest"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Description</label>
        <textarea
          value={edited.description || ''}
          onChange={(e) => setEdited({ ...edited, description: e.target.value })}
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 focus:border-[#e94560] outline-none min-h-[60px] resize-y"
          placeholder="Optional description..."
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Flag Type</label>
        <div className="grid grid-cols-2 gap-2">
          {flagTypes.map(type => (
            <button
              key={type}
              onClick={() => setEdited({ ...edited, type })}
              className={`px-3 py-2 rounded text-sm border transition-colors ${
                edited.type === type
                  ? flagTypeColors[type] + ' border-current'
                  : 'bg-[#12121a] border-[#2a2a3e] text-gray-400 hover:border-[#3a3a4e]'
              }`}
            >
              {flagTypeLabels[type]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {edited.type === 'dialogue' ? (
            <span className="text-gray-400">Temporary flag - resets after dialogue ends</span>
          ) : (
            <span className="text-white">Persistent flag - affects entire game</span>
          )}
        </p>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Category</label>
        <input
          type="text"
          value={edited.category || ''}
          onChange={(e) => setEdited({ ...edited, category: e.target.value })}
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 focus:border-[#e94560] outline-none"
          placeholder="quests, items, stats, etc."
          list="categories"
        />
        <datalist id="categories">
          {categories.map(cat => <option key={cat} value={cat} />)}
        </datalist>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase block mb-1">Value Type</label>
        <select
          value={edited.valueType || ''}
          onChange={(e) => setEdited({ ...edited, valueType: e.target.value as 'boolean' | 'number' | 'string' | undefined })}
          className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 focus:border-[#e94560] outline-none"
        >
          <option value="">Boolean (true/false)</option>
          <option value="number">Number</option>
          <option value="string">String</option>
        </select>
      </div>

      {edited.valueType && (
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">Default Value</label>
          <input
            type={edited.valueType === 'number' ? 'number' : 'text'}
            value={edited.defaultValue?.toString() || ''}
            onChange={(e) => {
              let value: boolean | number | string = e.target.value;
              if (edited.valueType === 'number') {
                value = parseFloat(value) || 0;
              } else if (edited.valueType === 'boolean') {
                value = value === 'true';
              }
              setEdited({ ...edited, defaultValue: value });
            }}
            className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1.5 text-sm text-gray-200 focus:border-[#e94560] outline-none"
            placeholder={edited.valueType === 'number' ? '0' : edited.valueType === 'string' ? '""' : 'false'}
          />
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-[#1a1a2e]">
        <button
          onClick={() => onSave(edited)}
          className="flex-1 px-4 py-2 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
        >
          Save Flag
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[#12121a] hover:bg-[#1a1a2e] text-gray-300 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
