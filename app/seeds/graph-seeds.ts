// payload-seed/seed-project-with-graph.ts
import type { Payload } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../payload-collections/enums';

type RFNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
};

type RFEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: Record<string, unknown>;
};

type RFJson = {
  nodes: RFNode[];
  edges: RFEdge[];
  viewport?: { x: number; y: number; zoom: number };
};

function edgeId(source: string, target: string) {
  return `e_${source}_${target}`;
}

export async function seedProjectWithNarrativeGraph(payload: Payload) {
  // Avoid dupes
  const existing = await payload.find({
    collection: 'projects',
    where: { name: { equals: 'Demo Project' } },
    limit: 1,
  });

  if (existing.docs.length > 0) return;

  // 1) Create Project
  const project = await payload.create({
    collection: 'projects',
    data: {
      name: 'Demo Project',
      slug: 'demo-project',
      description: 'Seeded project with a narrative graph and storylet graphs.',
    },
  });

  // 2) Create two Storylet graphs (STL1, STL2) so detours can reference real graph docs
  const stl1Start = 'stl1_start';
  const stl1End = 'stl1_end';

  const stl1Flow: RFJson = {
    nodes: [
      { id: stl1Start, type: 'PAGE', position: { x: 0, y: 0 }, data: { label: 'STL1 Start', defaultNextNodeId: stl1End } },
      { id: stl1End, type: 'END', position: { x: 260, y: 0 }, data: { label: 'STL1 End' } },
    ],
    edges: [{ id: edgeId(stl1Start, stl1End), source: stl1Start, target: stl1End, data: { kind: 'DEFAULT', label: 'default' } }],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  const stl2Start = 'stl2_start';
  const stl2End = 'stl2_end';

  const stl2Flow: RFJson = {
    nodes: [
      { id: stl2Start, type: 'PAGE', position: { x: 0, y: 0 }, data: { label: 'STL2 Start', defaultNextNodeId: stl2End } },
      { id: stl2End, type: 'END', position: { x: 260, y: 0 }, data: { label: 'STL2 End' } },
    ],
    edges: [{ id: edgeId(stl2Start, stl2End), source: stl2Start, target: stl2End, data: { kind: 'DEFAULT', label: 'default' } }],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  const stl1 = await payload.create({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    data: {
      project: project.id,
      kind: 'STORYLET',
      title: 'Storylet 1',
      flow: stl1Flow,
      startNodeId: stl1Start,
      endNodeIds: [{ nodeId: stl1End, exitKey: 'end' }],
    },
  });

  const stl2 = await payload.create({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    data: {
      project: project.id,
      kind: 'STORYLET',
      title: 'Storylet 2',
      flow: stl2Flow,
      startNodeId: stl2Start,
      endNodeIds: [{ nodeId: stl2End, exitKey: 'end' }],
    },
  });

  // 3) Build the narrative flow matching your diagram
  // Node IDs
  const TS = 'ts_start';
  const AN = 'act_1';
  const CH1 = 'chapter_1';
  const PG1 = 'page_1';

  const DET1 = 'detour_1';
  const COND1 = 'cond_1';
  const NPA = 'page_a';
  const NPB = 'page_b';
  const NPD = 'page_default';

  const DET2 = 'detour_2';
  const COND2 = 'cond_2';
  const NCA = 'chapter_page_a';
  const NCB = 'chapter_page_b';
  const NCD = 'chapter_default';

  const STL1_REF = 'stl1_ref';
  const STL2_REF = 'stl2_ref';

  const END = 'end_1';

  const nodes: RFNode[] = [
    { id: TS, type: 'THREAD_START', position: { x: 0, y: 0 }, data: { label: 'Thread Graph Start', defaultNextNodeId: AN } },

    { id: AN, type: 'ACT', position: { x: 250, y: 0 }, data: { label: 'Act Node' } },

    { id: CH1, type: 'CHAPTER', position: { x: 520, y: 0 }, data: { label: 'Chapter Node' } },

    { id: PG1, type: 'PAGE', position: { x: 780, y: 0 }, data: { label: 'Page Node', defaultNextNodeId: DET1 } },

    // Page-based detour path
    {
      id: DET1,
      type: 'DETOUR',
      position: { x: 1040, y: -60 },
      data: {
        label: 'Detour Node (Page)',
        storyletCall: { mode: 'DET0UR_RETURN', targetGraphId: stl1.id, targetStartNodeId: stl1Start },
        defaultNextNodeId: COND1,
      },
    },
    { id: COND1, type: 'CONDITIONAL', position: { x: 1300, y: -60 }, data: { label: 'Conditional Node (Page Detour)' } },

    { id: NPA, type: 'PAGE', position: { x: 1560, y: -140 }, data: { label: 'Next Page A', defaultNextNodeId: END } },
    { id: NPB, type: 'PAGE', position: { x: 1560, y: -60 }, data: { label: 'Next Page B', defaultNextNodeId: END } },
    { id: NPD, type: 'PAGE', position: { x: 1560, y: 20 }, data: { label: 'Default Next Page', defaultNextNodeId: END } },

    // Chapter-based detour path
    {
      id: DET2,
      type: 'DETOUR',
      position: { x: 780, y: 180 },
      data: {
        label: 'Detour Node (Chapter)',
        storyletCall: { mode: 'DET0UR_RETURN', targetGraphId: stl2.id, targetStartNodeId: stl2Start },
        defaultNextNodeId: COND2,
      },
    },
    { id: COND2, type: 'CONDITIONAL', position: { x: 1040, y: 180 }, data: { label: 'Conditional Node (Chapter Detour)' } },

    { id: NCA, type: 'PAGE', position: { x: 1300, y: 100 }, data: { label: 'Next Chapter Page A', defaultNextNodeId: END } },
    { id: NCB, type: 'PAGE', position: { x: 1300, y: 180 }, data: { label: 'Next Chapter Page B', defaultNextNodeId: END } },
    { id: NCD, type: 'PAGE', position: { x: 1300, y: 260 }, data: { label: 'Default Chapter Next', defaultNextNodeId: END } },

    // Storylet refs (visual nodes)
    { id: STL1_REF, type: 'STORYLET', position: { x: 1040, y: 40 }, data: { label: 'Storylet Data (STL1)', storyletCall: { mode: 'DET0UR_RETURN', targetGraphId: stl1.id } } },
    { id: STL2_REF, type: 'STORYLET', position: { x: 780, y: 280 }, data: { label: 'Storylet Data (STL2)', storyletCall: { mode: 'DET0UR_RETURN', targetGraphId: stl2.id } } },

    { id: END, type: 'END', position: { x: 1820, y: 0 }, data: { label: 'End' } },
  ];

  const edges: RFEdge[] = [
    // Main flow
    { id: edgeId(TS, AN), source: TS, target: AN, data: { kind: 'DEFAULT' } },
    { id: edgeId(AN, CH1), source: AN, target: CH1, data: { kind: 'FLOW' } },
    { id: edgeId(CH1, PG1), source: CH1, target: PG1, data: { kind: 'FLOW' } },

    // Chapter detour branch
    { id: edgeId(CH1, DET2), source: CH1, target: DET2, data: { kind: 'FLOW', label: 'detour' } },
    { id: edgeId(DET2, COND2), source: DET2, target: COND2, data: { kind: 'FLOW' } },
    { id: edgeId(COND2, NCA), source: COND2, target: NCA, data: { kind: 'CONDITION', label: 'Condition A met' } },
    { id: edgeId(COND2, NCB), source: COND2, target: NCB, data: { kind: 'CONDITION', label: 'Condition B met' } },
    { id: edgeId(COND2, NCD), source: COND2, target: NCD, data: { kind: 'DEFAULT', label: 'Default' } },

    // Page detour branch
    { id: edgeId(PG1, DET1), source: PG1, target: DET1, data: { kind: 'FLOW', label: 'detour' } },
    { id: edgeId(DET1, COND1), source: DET1, target: COND1, data: { kind: 'FLOW' } },
    { id: edgeId(COND1, NPA), source: COND1, target: NPA, data: { kind: 'CONDITION', label: 'Condition A met' } },
    { id: edgeId(COND1, NPB), source: COND1, target: NPB, data: { kind: 'CONDITION', label: 'Condition B met' } },
    { id: edgeId(COND1, NPD), source: COND1, target: NPD, data: { kind: 'DEFAULT', label: 'Default' } },

    // Storylet ref visuals
    { id: edgeId(DET1, STL1_REF), source: DET1, target: STL1_REF, data: { kind: 'VISUAL', label: 'uses storylet' } },
    { id: edgeId(DET2, STL2_REF), source: DET2, target: STL2_REF, data: { kind: 'VISUAL', label: 'uses storylet' } },

    // End connections
    { id: edgeId(NPA, END), source: NPA, target: END, data: { kind: 'FLOW' } },
    { id: edgeId(NPB, END), source: NPB, target: END, data: { kind: 'FLOW' } },
    { id: edgeId(NPD, END), source: NPD, target: END, data: { kind: 'FLOW' } },
    { id: edgeId(NCA, END), source: NCA, target: END, data: { kind: 'FLOW' } },
    { id: edgeId(NCB, END), source: NCB, target: END, data: { kind: 'FLOW' } },
    { id: edgeId(NCD, END), source: NCD, target: END, data: { kind: 'FLOW' } },
  ];

  const narrativeFlow: RFJson = {
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.8 },
  };

  const narrativeStartNodeId = TS;

  const narrativeGraph = await payload.create({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    data: {
      project: project.id,
      kind: 'NARRATIVE',
      title: 'Narrative Graph',
      flow: narrativeFlow,
      startNodeId: narrativeStartNodeId,
      endNodeIds: [{ nodeId: END, exitKey: 'end' }],
    },
  });

  // 4) Link narrative graph to project
  await payload.update({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    id: project.id,
    data: { narrativeGraph: narrativeGraph.id },
  });

  console.log('✅ Seeded Demo Project + Narrative Graph + Storylet Graphs');
}
