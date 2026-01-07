import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import {
  STORYLET_SELECTION_MODE,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type Storylet,
  type StoryletPool,
} from '../types/narrative';

interface ListPanelProps {
  title: string;
  subtitle: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

function ListPanel({ title, subtitle, onAdd, addButtonLabel, extraActions, children }: ListPanelProps) {
  return (
    <section className="bg-[#10101a] border border-[#1f1f2e] rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[#1f1f2e] flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">{subtitle}</p>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="p-1.5 bg-[#e94560] hover:bg-[#d63850] text-white rounded"
              title={addButtonLabel ?? `Add ${title}`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ListItem({ title, subtitle, badge, selected, onSelect, onMoveUp, onMoveDown }: ListItemProps) {
  return (
    <div
      className={`border rounded-lg p-2 transition-colors flex items-center justify-between gap-2 ${
        selected
          ? 'border-[#e94560] bg-[#1a1a2a]'
          : 'border-[#232336] bg-[#12121a] hover:border-[#35354a]'
      }`}
    >
      <button type="button" onClick={onSelect} className="flex-1 text-left">
        <div className="text-sm text-white font-medium truncate">{title}</div>
        <div className="flex items-center gap-2">
          {subtitle && <div className="text-[10px] text-gray-500 font-mono truncate">{subtitle}</div>}
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0f0f18] border border-[#2a2a3e] text-gray-400">
              {badge}
            </span>
          )}
        </div>
      </button>
      <div className="flex flex-col gap-1">
        <button type="button" onClick={onMoveUp} className="text-gray-500 hover:text-white">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} className="text-gray-500 hover:text-white">
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  children: React.ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
  return (
    <label className="text-[10px] text-gray-500 uppercase">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

interface ActPanelProps {
  acts: NarrativeAct[];
  selectedActId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativeAct>) => void;
}

export function ActPanel({
  acts,
  selectedActId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
}: ActPanelProps) {
  const selectedAct = acts.find(act => act.id === selectedActId);

  return (
    <ListPanel title="Acts" subtitle="Acts" onAdd={onAdd} addButtonLabel="Add Act">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {acts.map((act, index) => (
          <ListItem
            key={act.id}
            title={act.title || `Act ${index + 1}`}
            subtitle={act.id}
            selected={act.id === selectedActId}
            onSelect={() => onSelect(act.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {acts.length === 0 && <p className="text-xs text-gray-500">No acts yet. Add your first act.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedAct ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Act Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedAct.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedAct.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedAct.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select an act to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}

interface ChapterPanelProps {
  chapters: NarrativeChapter[];
  selectedChapterId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativeChapter>) => void;
}

export function ChapterPanel({
  chapters,
  selectedChapterId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
}: ChapterPanelProps) {
  const selectedChapter = chapters.find(chapter => chapter.id === selectedChapterId);

  return (
    <ListPanel title="Chapters" subtitle="Chapters" onAdd={onAdd} addButtonLabel="Add Chapter">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {chapters.map((chapter, index) => (
          <ListItem
            key={chapter.id}
            title={chapter.title || `Chapter ${index + 1}`}
            subtitle={chapter.id}
            selected={chapter.id === selectedChapterId}
            onSelect={() => onSelect(chapter.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {chapters.length === 0 && <p className="text-xs text-gray-500">Select an act and add chapters.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedChapter ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Chapter Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedChapter.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedChapter.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedChapter.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a chapter to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}

interface PagePanelProps {
  pages: NarrativePage[];
  selectedPageId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativePage>) => void;
  onUpdateNodeIds: (value: string) => void;
}

export function PagePanel({
  pages,
  selectedPageId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
  onUpdateNodeIds,
}: PagePanelProps) {
  const selectedPage = pages.find(page => page.id === selectedPageId);

  return (
    <ListPanel title="Pages" subtitle="Pages" onAdd={onAdd} addButtonLabel="Add Page">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages.map((page, index) => (
          <ListItem
            key={page.id}
            title={page.title || `Page ${index + 1}`}
            subtitle={page.id}
            selected={page.id === selectedPageId}
            onSelect={() => onSelect(page.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {pages.length === 0 && <p className="text-xs text-gray-500">Select a chapter and add pages.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedPage ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Page Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedPage.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedPage.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedPage.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
            <DetailField label="Node IDs">
              <textarea
                value={selectedPage.nodeIds.join(', ')}
                onChange={event => onUpdateNodeIds(event.target.value)}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a page to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}

interface StoryletEntry {
  poolId: string;
  storylet: Storylet;
}

interface StoryletPanelProps {
  entries: StoryletEntry[];
  pools: StoryletPool[];
  selectedKey?: string;
  selectedPool?: StoryletPool;
  onSelect: (key: string) => void;
  onAddPool: () => void;
  onAddStorylet: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdateStorylet: (updates: Partial<Storylet>) => void;
  onUpdatePool: (updates: Partial<StoryletPool>) => void;
  onChangePool: (poolId: string) => void;
}

export function StoryletPanel({
  entries,
  pools,
  selectedKey,
  selectedPool,
  onSelect,
  onAddPool,
  onAddStorylet,
  onMove,
  onDelete,
  onUpdateStorylet,
  onUpdatePool,
  onChangePool,
}: StoryletPanelProps) {
  const selectedEntry = entries.find(entry => `${entry.poolId}:${entry.storylet.id}` === selectedKey)
    ?? entries[0];

  return (
    <ListPanel
      title="Storylets"
      subtitle="Storylets"
      onAdd={onAddStorylet}
      addButtonLabel="Add Storylet"
      extraActions={
        <button
          type="button"
          onClick={onAddPool}
          className="px-2 py-1 bg-[#1a1a2a] hover:bg-[#242438] text-xs text-gray-200 rounded"
        >
          New Pool
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {entries.map((entry, index) => (
          <ListItem
            key={`${entry.poolId}-${entry.storylet.id}`}
            title={entry.storylet.title || `Storylet ${index + 1}`}
            subtitle={entry.storylet.id}
            badge={entry.poolId}
            selected={`${entry.poolId}:${entry.storylet.id}` === selectedKey}
            onSelect={() => onSelect(`${entry.poolId}:${entry.storylet.id}`)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {entries.length === 0 && <p className="text-xs text-gray-500">Add storylet pools and storylets.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedEntry ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Storylet Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedEntry.storylet.id}
                onChange={event => onUpdateStorylet({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedEntry.storylet.title ?? ''}
                onChange={event => onUpdateStorylet({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedEntry.storylet.summary ?? ''}
                onChange={event => onUpdateStorylet({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
            <DetailField label="Weight">
              <input
                type="number"
                value={selectedEntry.storylet.weight ?? 1}
                onChange={event => onUpdateStorylet({ weight: Number(event.target.value) })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Next Node ID">
              <input
                value={selectedEntry.storylet.nextNodeId ?? ''}
                onChange={event => onUpdateStorylet({ nextNodeId: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>

            <div className="pt-2 border-t border-[#1f1f2e] space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">Storylet Pool</span>
              <select
                value={selectedEntry.poolId}
                onChange={event => onChangePool(event.target.value)}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              >
                {pools.map(pool => (
                  <option key={pool.id} value={pool.id}>
                    {pool.title || pool.id}
                  </option>
                ))}
              </select>
              {selectedPool && (
                <>
                  <DetailField label="Pool Title">
                    <input
                      value={selectedPool.title ?? ''}
                      onChange={event => onUpdatePool({ title: event.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    />
                  </DetailField>
                  <DetailField label="Selection Mode">
                    <select
                      value={selectedPool.selectionMode ?? STORYLET_SELECTION_MODE.WEIGHTED}
                      onChange={event =>
                        onUpdatePool({
                          selectionMode: event.target.value as StoryletPool['selectionMode'],
                        })
                      }
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    >
                      <option value={STORYLET_SELECTION_MODE.WEIGHTED}>Weighted</option>
                      <option value={STORYLET_SELECTION_MODE.SEQUENTIAL}>Sequential</option>
                      <option value={STORYLET_SELECTION_MODE.RANDOM}>Random</option>
                    </select>
                  </DetailField>
                  <DetailField label="Fallback Node ID">
                    <input
                      value={selectedPool.fallbackNodeId ?? ''}
                      onChange={event => onUpdatePool({ fallbackNodeId: event.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    />
                  </DetailField>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a storylet to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}
