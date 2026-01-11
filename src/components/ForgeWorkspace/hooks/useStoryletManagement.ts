import { useEffect, useMemo, useState } from 'react';
import { NARRATIVE_ELEMENT } from '../../../types/narrative';
import type { NarrativeChapter, StoryletPoolMember, StoryletTemplate } from '../../../types/narrative';
import type { NarrativeSelection } from '../../../types/narrative';

interface StoryletEntry {
  poolId: string;
  member: StoryletPoolMember;
  template: StoryletTemplate;
}

interface UseStoryletManagementProps {
  selectedChapter: NarrativeChapter | undefined;
  selection: NarrativeSelection;
  activePoolId: string | undefined;
  setActivePoolId: (id: string | undefined) => void;
}

export function useStoryletManagement({
  selectedChapter,
  selection,
  activePoolId,
  setActivePoolId,
}: UseStoryletManagementProps) {
  const [storyletTab, setStoryletTab] = useState<'storylets' | 'pools'>('storylets');
  const [storyletSearch, setStoryletSearch] = useState('');
  const [poolSearch, setPoolSearch] = useState('');
  const [editingStoryletId, setEditingStoryletId] = useState<string | null>(null);
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null);
  const [storyletContextMenu, setStoryletContextMenu] = useState<{
    x: number;
    y: number;
    entry: StoryletEntry;
  } | null>(null);

  const storyletEntries = useMemo(() => {
    const pools = selectedChapter?.storyletPools ?? [];
    const templates = selectedChapter?.storyletTemplates ?? [];
    return pools.flatMap(pool =>
      pool.members.map(member => ({
        poolId: pool.id,
        member,
        template: templates.find(item => item.id === member.templateId)
          ?? {
            id: member.templateId,
            dialogueId: '',
            type: NARRATIVE_ELEMENT.STORYLET,
          },
      }))
    );
  }, [selectedChapter]);

  const selectedStoryletEntry = useMemo(() => {
    if (!selection.storyletKey) return storyletEntries[0];
    return storyletEntries.find(
      entry => `${entry.poolId}:${entry.template.id}` === selection.storyletKey
    );
  }, [selection.storyletKey, storyletEntries]);

  const selectedPool = selectedStoryletEntry
    ? (selectedChapter?.storyletPools ?? []).find(pool => pool.id === selectedStoryletEntry.poolId)
    : undefined;

  const activePool = (selectedChapter?.storyletPools ?? []).find(pool => pool.id === activePoolId)
    ?? selectedPool
    ?? selectedChapter?.storyletPools?.[0];

  useEffect(() => {
    if (!selectedChapter) return;
    const pools = selectedChapter.storyletPools ?? [];
    if (!activePoolId && pools[0]) {
      setActivePoolId(pools[0].id);
    }
  }, [activePoolId, selectedChapter, setActivePoolId]);

  const filteredStoryletEntries = useMemo(() => {
    const query = storyletSearch.trim().toLowerCase();
    if (!query) return storyletEntries;
    return storyletEntries.filter(entry => {
      const title = entry.template.title ?? entry.template.id;
      return title.toLowerCase().includes(query) || entry.template.id.toLowerCase().includes(query);
    });
  }, [storyletEntries, storyletSearch]);

  const filteredPools = useMemo(() => {
    const pools = selectedChapter?.storyletPools ?? [];
    const query = poolSearch.trim().toLowerCase();
    if (!query) return pools;
    return pools.filter(pool => {
      const title = pool.title ?? pool.id;
      return title.toLowerCase().includes(query) || pool.id.toLowerCase().includes(query);
    });
  }, [selectedChapter, poolSearch]);

  const editingStoryletEntry = storyletEntries.find(entry => entry.template.id === editingStoryletId) ?? null;
  const editingPool = (selectedChapter?.storyletPools ?? []).find(pool => pool.id === editingPoolId) ?? null;

  return {
    storyletTab,
    storyletSearch,
    poolSearch,
    editingStoryletId,
    editingPoolId,
    storyletContextMenu,
    storyletEntries,
    selectedStoryletEntry,
    selectedPool,
    activePool,
    filteredStoryletEntries,
    filteredPools,
    editingStoryletEntry,
    editingPool,
    setStoryletTab,
    setStoryletSearch,
    setPoolSearch,
    setEditingStoryletId,
    setEditingPoolId,
    setStoryletContextMenu,
  };
}
