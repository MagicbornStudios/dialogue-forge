import { Node, Edge, Position } from 'reactflow';
import { LayoutDirection } from './layout';
import { NARRATIVE_ENTITY_TYPE, type NarrativeEntityType } from '../types/constants';
import {
  type NarrativeStructure,
  type NarrativeAct,
  type NarrativeChapter,
  type NarrativePage,
  type NarrativeStorylet,
} from '../types/narrative';

export interface NarrativeFlowNodeData {
  label: string;
  type: NarrativeEntityType;
  meta: {
    actId?: string;
    chapterId?: string;
    pageId?: string;
    storyletId?: string;
  };
  description?: string;
}

export type NarrativeFlowNode = Node<NarrativeFlowNodeData>;
export type NarrativeFlowEdge = Edge;

function basePosition(index: number, depth: number, direction: LayoutDirection): { x: number; y: number } {
  const spacingX = 320;
  const spacingY = 220;
  if (direction === 'LR') {
    return { x: depth * spacingX, y: index * spacingY };
  }
  return { x: index * spacingX, y: depth * spacingY };
}

function addActNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  narrative: NarrativeStructure,
  direction: LayoutDirection
): void {
  narrative.acts.forEach((act, actIdx) => {
    nodes.push({
      id: act.id,
      type: 'default',
      position: basePosition(actIdx, 0, direction),
      data: {
        label: act.title,
        type: NARRATIVE_ENTITY_TYPE.ACT,
        description: act.summary,
        meta: { actId: act.id },
      },
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
    });
    addChapterNodes(nodes, edges, act, actIdx, direction);
  });
}

function addChapterNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  act: NarrativeAct,
  actIdx: number,
  direction: LayoutDirection
): void {
  act.chapters.forEach((chapter, chapterIdx) => {
    const position = basePosition(chapterIdx, 1, direction);
    nodes.push({
      id: chapter.id,
      type: 'default',
      position,
      data: {
        label: chapter.title,
        type: NARRATIVE_ENTITY_TYPE.CHAPTER,
        description: chapter.summary,
        meta: { actId: act.id, chapterId: chapter.id },
      },
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
    });

    edges.push({
      id: `${act.id}-${chapter.id}`,
      source: act.id,
      target: chapter.id,
      animated: act.startChapterId === chapter.id,
    });

    addPageNodes(nodes, edges, act, chapter, chapterIdx, direction);
  });
}

function addPageNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  act: NarrativeAct,
  chapter: NarrativeChapter,
  chapterIdx: number,
  direction: LayoutDirection
): void {
  chapter.pages.forEach((page, pageIdx) => {
    const position = basePosition(pageIdx, 2, direction);
    nodes.push({
      id: page.id,
      type: 'default',
      position,
      data: {
        label: page.title,
        type: NARRATIVE_ENTITY_TYPE.PAGE,
        description: page.summary,
        meta: { actId: act.id, chapterId: chapter.id, pageId: page.id },
      },
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
    });

    edges.push({
      id: `${chapter.id}-${page.id}`,
      source: chapter.id,
      target: page.id,
      animated: chapter.startPageId === page.id,
    });

    addStoryletNodes(nodes, edges, act, chapter, page, pageIdx, direction);
  });
}

function addStoryletNodes(
  nodes: NarrativeFlowNode[],
  edges: NarrativeFlowEdge[],
  act: NarrativeAct,
  chapter: NarrativeChapter,
  page: NarrativePage,
  pageIdx: number,
  direction: LayoutDirection
): void {
  page.storylets.forEach((storylet, storyletIdx) => {
    const position = basePosition(storyletIdx, 3, direction);
    nodes.push({
      id: storylet.id,
      type: 'default',
      position,
      data: {
        label: storylet.title,
        type: NARRATIVE_ENTITY_TYPE.STORYLET,
        description: storylet.summary,
        meta: {
          actId: act.id,
          chapterId: chapter.id,
          pageId: page.id,
          storyletId: storylet.id,
        },
      },
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
    });

    edges.push({
      id: `${page.id}-${storylet.id}`,
      source: page.id,
      target: storylet.id,
      animated: page.startStoryletId === storylet.id,
    });

    addExitEdges(edges, page, storylet);
  });
}

function addExitEdges(edges: NarrativeFlowEdge[], page: NarrativePage, storylet: NarrativeStorylet): void {
  storylet.exits?.forEach(exit => {
    if (exit.targetStoryletId) {
      edges.push({
        id: `${storylet.id}-${exit.id}`,
        source: storylet.id,
        target: exit.targetStoryletId,
        label: exit.label,
        animated: Boolean(exit.weight && exit.weight > 1),
      });
    } else if (exit.targetPageId) {
      edges.push({
        id: `${storylet.id}-${exit.id}`,
        source: storylet.id,
        target: exit.targetPageId,
        label: exit.label,
      });
    }
  });
}

export function convertNarrativeToReactFlow(
  narrative: NarrativeStructure,
  direction: LayoutDirection = 'TB'
): { nodes: NarrativeFlowNode[]; edges: NarrativeFlowEdge[] } {
  const nodes: NarrativeFlowNode[] = [];
  const edges: NarrativeFlowEdge[] = [];

  addActNodes(nodes, edges, narrative, direction);

  return { nodes, edges };
}
