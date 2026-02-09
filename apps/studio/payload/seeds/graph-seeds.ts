import type { Payload } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../collections/enums';

const FORGE_GRAPH_KIND = {
  NARRATIVE: 'NARRATIVE',
  STORYLET: 'STORYLET',
} as const;

const FORGE_NODE_TYPE = {
  PAGE: 'PAGE',
  END: 'END',
  CHARACTER: 'CHARACTER',
  PLAYER: 'PLAYER',
  STORYLET: 'STORYLET',
  DETOUR: 'DETOUR',
} as const;

const FORGE_STORYLET_CALL_MODE = {
  JUMP: 'JUMP',
  DETOUR_RETURN: 'DETOUR_RETURN',
} as const;

type ForgeGraphKind = (typeof FORGE_GRAPH_KIND)[keyof typeof FORGE_GRAPH_KIND];

type ForgeReactFlowJson = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
};

/**
 * Seed (or repair) a demo project with associated Forge graphs.
 * This is idempotent and safe to run on every dev startup.
 */
export async function seedProjectWithNarrativeGraph(payload: Payload) {
  const project = await ensureDemoProject(payload);
  const projectId = project.id;

  const existingGraphs = await payload.find({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    where: { project: { equals: projectId } },
    limit: 200,
  });

  const existingByKey = new Map<string, SeededGraphDoc>();
  for (const doc of existingGraphs.docs as SeededGraphDoc[]) {
    existingByKey.set(graphKey(doc.kind, doc.title), doc);
  }

  const narrativeGraph = await ensureGraph(payload, existingByKey, projectId, {
    kind: FORGE_GRAPH_KIND.NARRATIVE,
    title: 'Demo Narrative Skeleton',
    ...buildNarrativeSkeletonFlow(),
  });

  const storyletGraph = await ensureGraph(payload, existingByKey, projectId, {
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Demo Storylet Target',
    ...buildStoryletTargetFlow(),
  });

  const detourGraph = await ensureGraph(payload, existingByKey, projectId, {
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Demo Detour Target',
    ...buildDetourTargetFlow(),
  });

  const rootGraph = await ensureGraph(payload, existingByKey, projectId, {
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Demo Root Export Graph',
    ...buildRootExportFlow(storyletGraph.id, detourGraph.id),
  });

  const existingNarrativeGraphId = extractRelationshipId(project.narrativeGraph);
  if (existingNarrativeGraphId !== narrativeGraph.id) {
    await payload.update({
      collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
      id: projectId,
      data: {
        narrativeGraph: narrativeGraph.id,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seeded Demo Project with associated graphs (project=${projectId}, narrative=${narrativeGraph.id}, root=${rootGraph.id}, storylet=${storyletGraph.id}, detour=${detourGraph.id})`
  );
}

const DEMO_PROJECT_NAME = 'Demo Project';
const DEMO_PROJECT_SLUG = 'demo-project';
const DEMO_PROJECT_DESCRIPTION =
  'Seeded demo project with linked narrative/storylet graphs for export and workspace validation.';

type SeededProjectDoc = {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: number | { id?: number } | null;
};

type SeededGraphDoc = {
  id: number;
  kind: ForgeGraphKind;
  title: string;
};

type SeededGraphInput = {
  kind: ForgeGraphKind;
  title: string;
  flow: ForgeReactFlowJson;
  startNodeId: string;
  endNodeIds: Array<{ nodeId: string; exitKey?: string }>;
};

async function ensureDemoProject(payload: Payload): Promise<SeededProjectDoc> {
  const bySlug = await payload.find({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    where: { slug: { equals: DEMO_PROJECT_SLUG } },
    limit: 1,
  });
  if (bySlug.docs.length > 0) {
    return bySlug.docs[0] as SeededProjectDoc;
  }

  const byName = await payload.find({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    where: { name: { equals: DEMO_PROJECT_NAME } },
    limit: 1,
  });
  if (byName.docs.length > 0) {
    return byName.docs[0] as SeededProjectDoc;
  }

  const created = await payload.create({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    data: {
      name: DEMO_PROJECT_NAME,
      slug: DEMO_PROJECT_SLUG,
      description: DEMO_PROJECT_DESCRIPTION,
    },
  });

  return created as SeededProjectDoc;
}

function graphKey(kind: ForgeGraphKind, title: string): string {
  return `${kind}:${title}`;
}

async function ensureGraph(
  payload: Payload,
  existingByKey: Map<string, SeededGraphDoc>,
  projectId: number,
  input: SeededGraphInput
): Promise<SeededGraphDoc> {
  const key = graphKey(input.kind, input.title);
  const existing = existingByKey.get(key);

  if (existing) {
    return existing;
  }

  const created = (await payload.create({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    data: {
      project: projectId,
      kind: input.kind,
      title: input.title,
      flow: input.flow,
      startNodeId: input.startNodeId,
      endNodeIds: input.endNodeIds,
    },
  })) as SeededGraphDoc;

  existingByKey.set(key, created);
  return created;
}

function extractRelationshipId(value: number | { id?: number } | null | undefined): number | null {
  if (typeof value === 'number') return value;
  if (value && typeof value.id === 'number') return value.id;
  return null;
}

function buildNarrativeSkeletonFlow(): Pick<
  SeededGraphInput,
  'flow' | 'startNodeId' | 'endNodeIds'
> {
  const startId = 'narrative_page_1';
  const endId = 'narrative_end_1';

  return {
    flow: {
      nodes: [
        {
          id: startId,
          type: FORGE_NODE_TYPE.PAGE,
          position: { x: 120, y: 120 },
          data: {
            id: startId,
            type: FORGE_NODE_TYPE.PAGE,
            label: 'Opening Page',
            content: '',
            defaultNextNodeId: endId,
          },
        },
        {
          id: endId,
          type: FORGE_NODE_TYPE.END,
          position: { x: 460, y: 120 },
          data: {
            id: endId,
            type: FORGE_NODE_TYPE.END,
            label: 'End',
          },
        },
      ],
      edges: [{ id: `e_${startId}_${endId}`, source: startId, target: endId }],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    startNodeId: startId,
    endNodeIds: [{ nodeId: endId }],
  };
}

function buildStoryletTargetFlow(): Pick<SeededGraphInput, 'flow' | 'startNodeId' | 'endNodeIds'> {
  const startId = 'storylet_target_start';
  const endId = 'storylet_target_end';

  return {
    flow: {
      nodes: [
        {
          id: startId,
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 120, y: 120 },
          data: {
            id: startId,
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Guide',
            content: 'You entered the storylet branch.',
            defaultNextNodeId: endId,
          },
        },
        {
          id: endId,
          type: FORGE_NODE_TYPE.END,
          position: { x: 460, y: 120 },
          data: {
            id: endId,
            type: FORGE_NODE_TYPE.END,
            label: 'End',
          },
        },
      ],
      edges: [{ id: `e_${startId}_${endId}`, source: startId, target: endId }],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    startNodeId: startId,
    endNodeIds: [{ nodeId: endId }],
  };
}

function buildDetourTargetFlow(): Pick<SeededGraphInput, 'flow' | 'startNodeId' | 'endNodeIds'> {
  const startId = 'detour_target_start';
  const endId = 'detour_target_end';

  return {
    flow: {
      nodes: [
        {
          id: startId,
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 120, y: 120 },
          data: {
            id: startId,
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Archivist',
            content: 'This is the detour branch.',
            defaultNextNodeId: endId,
          },
        },
        {
          id: endId,
          type: FORGE_NODE_TYPE.END,
          position: { x: 460, y: 120 },
          data: {
            id: endId,
            type: FORGE_NODE_TYPE.END,
            label: 'End',
          },
        },
      ],
      edges: [{ id: `e_${startId}_${endId}`, source: startId, target: endId }],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    startNodeId: startId,
    endNodeIds: [{ nodeId: endId }],
  };
}

function buildRootExportFlow(
  storyletTargetGraphId: number,
  detourTargetGraphId: number
): Pick<SeededGraphInput, 'flow' | 'startNodeId' | 'endNodeIds'> {
  const introId = 'root_intro';
  const choiceId = 'root_choice';
  const storyletCallId = 'root_storylet_call';
  const detourCallId = 'root_detour_call';
  const returnId = 'root_return';
  const endId = 'root_end';

  return {
    flow: {
      nodes: [
        {
          id: introId,
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 120, y: 80 },
          data: {
            id: introId,
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Host',
            content: 'Choose a path to test graph resolution.',
            defaultNextNodeId: choiceId,
          },
        },
        {
          id: choiceId,
          type: FORGE_NODE_TYPE.PLAYER,
          position: { x: 420, y: 80 },
          data: {
            id: choiceId,
            type: FORGE_NODE_TYPE.PLAYER,
            choices: [
              {
                id: 'choice_storylet',
                text: 'Go to storylet branch',
                nextNodeId: storyletCallId,
              },
              {
                id: 'choice_detour',
                text: 'Go to detour branch',
                nextNodeId: detourCallId,
              },
            ],
          },
        },
        {
          id: storyletCallId,
          type: FORGE_NODE_TYPE.STORYLET,
          position: { x: 760, y: -20 },
          data: {
            id: storyletCallId,
            type: FORGE_NODE_TYPE.STORYLET,
            content: 'Storylet call node.',
            storyletCall: {
              mode: FORGE_STORYLET_CALL_MODE.JUMP,
              targetGraphId: storyletTargetGraphId,
              targetStartNodeId: 'storylet_target_start',
            },
            defaultNextNodeId: endId,
          },
        },
        {
          id: detourCallId,
          type: FORGE_NODE_TYPE.DETOUR,
          position: { x: 760, y: 180 },
          data: {
            id: detourCallId,
            type: FORGE_NODE_TYPE.DETOUR,
            content: 'Detour call node.',
            storyletCall: {
              mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
              targetGraphId: detourTargetGraphId,
              targetStartNodeId: 'detour_target_start',
              returnNodeId: returnId,
            },
            defaultNextNodeId: returnId,
          },
        },
        {
          id: returnId,
          type: FORGE_NODE_TYPE.CHARACTER,
          position: { x: 1080, y: 180 },
          data: {
            id: returnId,
            type: FORGE_NODE_TYPE.CHARACTER,
            speaker: 'Host',
            content: 'Returned from detour.',
            defaultNextNodeId: endId,
          },
        },
        {
          id: endId,
          type: FORGE_NODE_TYPE.END,
          position: { x: 1320, y: 80 },
          data: {
            id: endId,
            type: FORGE_NODE_TYPE.END,
            label: 'End',
          },
        },
      ],
      edges: [
        { id: `e_${introId}_${choiceId}`, source: introId, target: choiceId },
        { id: `e_${choiceId}_${storyletCallId}`, source: choiceId, target: storyletCallId },
        { id: `e_${choiceId}_${detourCallId}`, source: choiceId, target: detourCallId },
        { id: `e_${storyletCallId}_${endId}`, source: storyletCallId, target: endId },
        { id: `e_${detourCallId}_${returnId}`, source: detourCallId, target: returnId },
        { id: `e_${returnId}_${endId}`, source: returnId, target: endId },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    startNodeId: introId,
    endNodeIds: [{ nodeId: endId }],
  };
}
