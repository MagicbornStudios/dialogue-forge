// new helper: src/utils/narrative-flow-sync.ts (recommended)
import type { Edge, Node } from 'reactflow';
import { NARRATIVE_ELEMENT, type StoryThread, type NarrativeEdge } from '../../../types/narrative';
import { NarrativeAct, NarrativeChapter, NarrativeConditional, NarrativeDetour, NarrativePage } from '../../../types/narrative';

function toNarrativeEdges(edges: Edge[]): NarrativeEdge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    label: typeof e.label === 'string' ? e.label : undefined,
    animated: e.animated,
  }));
}

export function applyFlowToThread(prev: StoryThread, nodes: Node[], edges: Edge[]): StoryThread {
  const pos = new Map(nodes.map(n => [n.id, { x: n.position.x, y: n.position.y }]));

  const next: StoryThread = {
    ...prev,
    position: pos.get(prev.id) ?? prev.position,
    edges: toNarrativeEdges(edges),
  };

  next.acts = prev.acts.map((act: NarrativeAct) => ({
    ...act,
    position: pos.get(act.id) ?? act.position,
    chapters: act.chapters.map((chapter: NarrativeChapter) => ({
      ...chapter,
      position: pos.get(chapter.id) ?? chapter.position,
      pages: chapter.pages.map((page: NarrativePage) => ({
        ...page,
        position: pos.get(page.id) ?? page.position,
        // IMPORTANT: do not touch nextPageId/nextChapterId/nextActId in Path B
      })),
    })),
  }));

  next.detours = prev.detours?.map((detour: NarrativeDetour) => ({
    ...detour,
    position: pos.get(detour.id) ?? detour.position,
  }));

  next.conditionals = prev.conditionals?.map((conditional: NarrativeConditional) => ({
    ...conditional,
    position: pos.get(conditional.id) ?? conditional.position,
  }));

  return next;
}
