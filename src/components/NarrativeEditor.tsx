import React, { useMemo, useState, useEffect } from 'react';
import {
  addAct,
  addChapter,
  addPage,
  addStorylet,
  addStoryletExit,
  updateStorylet,
  updateStoryletExit,
  createEmptyNarrative,
} from '../utils/narrative-helpers';
import {
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type NarrativeStorylet,
  type NarrativeStoryletExit,
  type NarrativeStructure,
  DEFAULT_NARRATIVE_ENTITY_LABELS,
} from '../types/narrative';
import { NARRATIVE_ENTITY_TYPE } from '../types/constants';

interface NarrativeEditorProps {
  narrative?: NarrativeStructure;
  onChange: (narrative: NarrativeStructure) => void;
  onSelectStorylet?: (storylet: NarrativeStorylet, page: NarrativePage, chapter: NarrativeChapter, act: NarrativeAct) => void;
  className?: string;
}

export function NarrativeEditor({ narrative: narrativeProp, onChange, onSelectStorylet, className = '' }: NarrativeEditorProps) {
  const narrative = useMemo(() => narrativeProp ?? createEmptyNarrative(), [narrativeProp]);
  const [selectedActId, setSelectedActId] = useState<string>(narrative.startActId || narrative.acts[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(narrative.startChapterId || narrative.acts[0]?.chapters[0]?.id || '');
  const [selectedPageId, setSelectedPageId] = useState<string>(narrative.startPageId || narrative.acts[0]?.chapters[0]?.pages[0]?.id || '');
  const [selectedStoryletId, setSelectedStoryletId] = useState<string>(
    narrative.acts[0]?.chapters[0]?.pages[0]?.startStoryletId || narrative.acts[0]?.chapters[0]?.pages[0]?.storylets[0]?.id || ''
  );

  const selectedAct = narrative.acts.find(act => act.id === selectedActId) || narrative.acts[0];
  const selectedChapter = selectedAct?.chapters.find(ch => ch.id === selectedChapterId) || selectedAct?.chapters[0];
  const selectedPage = selectedChapter?.pages.find(p => p.id === selectedPageId) || selectedChapter?.pages[0];
  const selectedStorylet = selectedPage?.storylets.find(s => s.id === selectedStoryletId)
    || selectedPage?.storylets.find(s => s.id === selectedPage?.startStoryletId)
    || selectedPage?.storylets[0];

  useEffect(() => {
    if (!selectedAct && narrative.acts[0]) {
      setSelectedActId(narrative.acts[0].id);
    }
  }, [narrative.acts, selectedAct]);

  useEffect(() => {
    if (selectedAct && !selectedChapter && selectedAct.chapters[0]) {
      setSelectedChapterId(selectedAct.chapters[0].id);
    }
  }, [selectedAct, selectedChapter]);

  useEffect(() => {
    if (selectedChapter && !selectedPage && selectedChapter.pages[0]) {
      setSelectedPageId(selectedChapter.pages[0].id);
    }
  }, [selectedChapter, selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    const hasStorylet = selectedPage.storylets.some(storylet => storylet.id === selectedStoryletId);
    if (!hasStorylet) {
      setSelectedStoryletId(selectedPage.startStoryletId || selectedPage.storylets[0]?.id || '');
    }
  }, [selectedPage, selectedStoryletId]);

  const handleStoryletUpdate = (updates: Partial<NarrativeStorylet>) => {
    if (!selectedAct || !selectedChapter || !selectedPage || !selectedStorylet) return;
    onChange(updateStorylet(narrative, selectedAct.id, selectedChapter.id, selectedPage.id, selectedStorylet.id, updates));
  };

  const handleExitUpdate = (exitId: string, updates: Partial<NarrativeStoryletExit>) => {
    if (!selectedAct || !selectedChapter || !selectedPage || !selectedStorylet) return;
    onChange(updateStoryletExit(narrative, selectedAct.id, selectedChapter.id, selectedPage.id, selectedStorylet.id, exitId, updates));
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 ${className}`}>
      <div className="lg:col-span-2 space-y-3 bg-df-surface border border-df-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-df-text">
            {DEFAULT_NARRATIVE_ENTITY_LABELS[NARRATIVE_ENTITY_TYPE.ACT]}
          </h3>
          <button
            className="text-xs text-df-primary hover:text-white"
            onClick={() => onChange(addAct(narrative))}
          >
            + Add Act
          </button>
        </div>
        <select
          value={selectedAct?.id || ''}
          onChange={(e) => setSelectedActId(e.target.value)}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
        >
          {narrative.acts.map(act => (
            <option key={act.id} value={act.id}>{act.title}</option>
          ))}
        </select>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-df-text">
            {DEFAULT_NARRATIVE_ENTITY_LABELS[NARRATIVE_ENTITY_TYPE.CHAPTER]}
          </h3>
          {selectedAct && (
            <button
              className="text-xs text-df-primary hover:text-white"
              onClick={() => onChange(addChapter(narrative, selectedAct.id))}
            >
              + Add Chapter
            </button>
          )}
        </div>
        <select
          value={selectedChapter?.id || ''}
          onChange={(e) => setSelectedChapterId(e.target.value)}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
        >
          {selectedAct?.chapters.map(ch => (
            <option key={ch.id} value={ch.id}>{ch.title}</option>
          ))}
        </select>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-df-text">
            {DEFAULT_NARRATIVE_ENTITY_LABELS[NARRATIVE_ENTITY_TYPE.PAGE]}
          </h3>
          {selectedAct && selectedChapter && (
            <button
              className="text-xs text-df-primary hover:text-white"
              onClick={() => onChange(addPage(narrative, selectedAct.id, selectedChapter.id))}
            >
              + Add Page
            </button>
          )}
        </div>
        <select
          value={selectedPage?.id || ''}
          onChange={(e) => setSelectedPageId(e.target.value)}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
        >
          {selectedChapter?.pages.map(page => (
            <option key={page.id} value={page.id}>{page.title}</option>
          ))}
        </select>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <div className="bg-df-surface border border-df-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-df-text">Storylets</h3>
            {selectedAct && selectedChapter && selectedPage && (
              <button
                className="text-xs text-df-primary hover:text-white"
                onClick={() => onChange(addStorylet(narrative, selectedAct.id, selectedChapter.id, selectedPage.id))}
              >
                + Add Storylet
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedPage?.storylets.map(storylet => (
              <button
                key={storylet.id}
                onClick={() => {
                  setSelectedStoryletId(storylet.id);
                  onSelectStorylet?.(storylet, selectedPage, selectedChapter!, selectedAct!);
                }}
                className={`text-left border rounded-lg px-3 py-2 transition-colors ${
                  selectedStorylet?.id === storylet.id ? 'border-df-start bg-df-start/10' : 'border-df-border bg-df-elevated'
                }`}
              >
                <div className="font-semibold text-sm text-df-text">{storylet.title}</div>
                <div className="text-xs text-df-muted-foreground">{storylet.summary || 'No summary'}</div>
                <div className="text-[11px] text-df-muted-foreground mt-1">Tags: {(storylet.tags || []).join(', ') || 'none'}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedStorylet && selectedAct && selectedChapter && selectedPage && (
          <div className="bg-df-surface border border-df-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-df-text">Storylet Details</h3>
              <span className="text-[11px] text-df-muted-foreground">{selectedStorylet.id}</span>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Title</label>
              <input
                type="text"
                value={selectedStorylet.title}
                onChange={(e) => handleStoryletUpdate({ title: e.target.value })}
                className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Summary</label>
              <textarea
                value={selectedStorylet.summary || ''}
                onChange={(e) => handleStoryletUpdate({ summary: e.target.value })}
                className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Dialogue ID</label>
                <input
                  type="text"
                  value={selectedStorylet.dialogueId || ''}
                  onChange={(e) => handleStoryletUpdate({ dialogueId: e.target.value })}
                  className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                  placeholder="dialogue-tree-id"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Weight</label>
                <input
                  type="number"
                  value={selectedStorylet.weight ?? ''}
                  onChange={(e) => handleStoryletUpdate({ weight: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Tags</label>
              <input
                type="text"
                value={selectedStorylet.tags?.join(', ') || ''}
                onChange={(e) => handleStoryletUpdate({ tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                placeholder="tag1, tag2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-gray-500 uppercase">Exits</label>
                <button
                  className="text-xs text-df-primary hover:text-white"
                  onClick={() => onChange(addStoryletExit(narrative, selectedAct.id, selectedChapter.id, selectedPage.id, selectedStorylet.id))}
                >
                  + Add Exit
                </button>
              </div>
              {(selectedStorylet.exits || []).map(exit => (
                <div key={exit.id} className="border border-df-border rounded p-2 space-y-2 bg-df-elevated">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Label</label>
                      <input
                        type="text"
                        value={exit.label}
                        onChange={(e) => handleExitUpdate(exit.id, { label: e.target.value })}
                        className="w-full bg-df-surface border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Weight</label>
                      <input
                        type="number"
                        value={exit.weight ?? ''}
                        onChange={(e) => handleExitUpdate(exit.id, { weight: e.target.value === '' ? undefined : Number(e.target.value) })}
                        className="w-full bg-df-surface border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Target Storylet</label>
                      <input
                        type="text"
                        value={exit.targetStoryletId || ''}
                        onChange={(e) => handleExitUpdate(exit.id, { targetStoryletId: e.target.value || undefined })}
                        className="w-full bg-df-surface border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                        placeholder="storylet-id"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase">Target Page</label>
                      <input
                        type="text"
                        value={exit.targetPageId || ''}
                        onChange={(e) => handleExitUpdate(exit.id, { targetPageId: e.target.value || undefined })}
                        className="w-full bg-df-surface border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary"
                        placeholder="page-id"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

NarrativeEditor.displayName = 'NarrativeEditor';
