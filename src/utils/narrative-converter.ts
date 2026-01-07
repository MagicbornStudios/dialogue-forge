import { Edge, Node, Position } from 'reactflow';
import {
  NarrativeAct,
  NarrativeChapter,
  NarrativePage,
  NarrativeStorylet,
  NarrativeThread,
} from '../types';
import { NARRATIVE_EDGE_TYPE, NARRATIVE_NODE_TYPE, NarrativeNodeType } from '../types/constants';

export interface NarrativeReactFlowNodeData {
  nodeType: NarrativeNodeType;
  recordId: string;
  title: string;
  record: NarrativeAct | NarrativeChapter | NarrativePage | NarrativeStorylet;
}

export type NarrativeReactFlowNode = Node<NarrativeReactFlowNodeData>;
export type NarrativeReactFlowEdge = Edge;

const DEFAULT_POSITIONS: Record<NarrativeNodeType, { x: number; nextY: number }> = {
  [NARRATIVE_NODE_TYPE.ACT]: { x: 0, nextY: 0 },
  [NARRATIVE_NODE_TYPE.CHAPTER]: { x: 280, nextY: 0 },
  [NARRATIVE_NODE_TYPE.PAGE]: { x: 560, nextY: 0 },
  [NARRATIVE_NODE_TYPE.STORYLET]: { x: 840, nextY: 0 },
};

const ROW_SPACING = 160;

function buildNarrativeNodeId(nodeType: NarrativeNodeType, recordId: string): string {
  return `${nodeType}-${recordId}`;
}

function createNode(
  nodeType: NarrativeNodeType,
  recordId: string,
  title: string,
  record: NarrativeAct | NarrativeChapter | NarrativePage | NarrativeStorylet,
  positions: Record<NarrativeNodeType, { x: number; nextY: number }>
): NarrativeReactFlowNode {
  const nodeId = buildNarrativeNodeId(nodeType, recordId);
  const position = {
    x: positions[nodeType].x,
    y: positions[nodeType].nextY,
  };

  positions[nodeType].nextY += ROW_SPACING;

  return {
    id: nodeId,
    type: nodeType,
    position,
    data: {
      nodeType,
      recordId,
      title,
      record,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
}

export function convertNarrativeThreadToReactFlow(thread: NarrativeThread): {
  nodes: NarrativeReactFlowNode[];
  edges: NarrativeReactFlowEdge[];
} {
  const nodes: NarrativeReactFlowNode[] = [];
  const edges: NarrativeReactFlowEdge[] = [];
  const positions = {
    [NARRATIVE_NODE_TYPE.ACT]: { ...DEFAULT_POSITIONS[NARRATIVE_NODE_TYPE.ACT] },
    [NARRATIVE_NODE_TYPE.CHAPTER]: { ...DEFAULT_POSITIONS[NARRATIVE_NODE_TYPE.CHAPTER] },
    [NARRATIVE_NODE_TYPE.PAGE]: { ...DEFAULT_POSITIONS[NARRATIVE_NODE_TYPE.PAGE] },
    [NARRATIVE_NODE_TYPE.STORYLET]: { ...DEFAULT_POSITIONS[NARRATIVE_NODE_TYPE.STORYLET] },
  };

  const actOrder = thread.actIds.length ? thread.actIds : Object.keys(thread.acts);
  const chapterIds = new Set<string>();
  const pageIds = new Set<string>();
  const storyletIds = new Set<string>();

  actOrder.forEach(actId => {
    const act = thread.acts[actId];
    if (!act) return;

    nodes.push(createNode(NARRATIVE_NODE_TYPE.ACT, act.id, act.title, act, positions));

    act.chapterIds.forEach(chapterId => {
      const chapter = thread.chapters[chapterId];
      if (!chapter) return;

      chapterIds.add(chapterId);
      nodes.push(
        createNode(NARRATIVE_NODE_TYPE.CHAPTER, chapter.id, chapter.title, chapter, positions)
      );

      edges.push({
        id: `edge-${act.id}-${chapter.id}`,
        source: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.ACT, act.id),
        target: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.CHAPTER, chapter.id),
        type: NARRATIVE_EDGE_TYPE.ACT_TO_CHAPTER,
      });

      chapter.pageIds.forEach(pageId => {
        const page = thread.pages[pageId];
        if (!page) return;

        pageIds.add(pageId);
        nodes.push(createNode(NARRATIVE_NODE_TYPE.PAGE, page.id, page.title, page, positions));

        edges.push({
          id: `edge-${chapter.id}-${page.id}`,
          source: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.CHAPTER, chapter.id),
          target: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.PAGE, page.id),
          type: NARRATIVE_EDGE_TYPE.CHAPTER_TO_PAGE,
        });

        page.storyletIds.forEach(storyletId => {
          const storylet = thread.storylets[storyletId];
          if (!storylet || storyletIds.has(storyletId)) return;

          storyletIds.add(storyletId);
          nodes.push(
            createNode(
              NARRATIVE_NODE_TYPE.STORYLET,
              storylet.id,
              storylet.title,
              storylet,
              positions
            )
          );
        });
      });
    });
  });

  Object.values(thread.storylets).forEach(storylet => {
    if (storyletIds.has(storylet.id)) return;

    storyletIds.add(storylet.id);
    nodes.push(
      createNode(
        NARRATIVE_NODE_TYPE.STORYLET,
        storylet.id,
        storylet.title,
        storylet,
        positions
      )
    );
  });

  Object.values(thread.acts).forEach(act => {
    if (actOrder.includes(act.id)) return;
    nodes.push(createNode(NARRATIVE_NODE_TYPE.ACT, act.id, act.title, act, positions));
  });

  Object.values(thread.chapters).forEach(chapter => {
    if (chapterIds.has(chapter.id)) return;
    nodes.push(
      createNode(NARRATIVE_NODE_TYPE.CHAPTER, chapter.id, chapter.title, chapter, positions)
    );
  });

  Object.values(thread.pages).forEach(page => {
    if (pageIds.has(page.id)) return;
    nodes.push(createNode(NARRATIVE_NODE_TYPE.PAGE, page.id, page.title, page, positions));
  });

  Object.values(thread.storylets).forEach(storylet => {
    storylet.linkedStoryletIds.forEach(targetId => {
      if (!thread.storylets[targetId]) return;

      edges.push({
        id: `edge-storylet-${storylet.id}-${targetId}`,
        source: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.STORYLET, storylet.id),
        target: buildNarrativeNodeId(NARRATIVE_NODE_TYPE.STORYLET, targetId),
        type: NARRATIVE_EDGE_TYPE.STORYLET_LINK,
      });
    });
  });

  return { nodes, edges };
}
