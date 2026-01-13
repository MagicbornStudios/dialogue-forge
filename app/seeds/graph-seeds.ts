// payload-seed/seed-project-with-graph.ts
import type { Payload } from 'payload';
import { PAYLOAD_COLLECTIONS } from '../payload-collections/enums';

import {
  FORGE_GRAPH_KIND,
  FORGE_NODE_TYPE,
  FORGE_EDGE_KIND,
  FORGE_STORYLET_CALL_MODE,
  type ForgeGraphKind,
  type ForgeNodeType,
  type ForgeEdgeKind,
  type ForgeFlowJson,
  type ForgeFlowNode,
  type ForgeFlowEdge,
  type ForgeGraphDoc,
  type ForgeStoryletCall,
  type ForgeNode,
} from '@/src/types/forge/forge-graph';

function edgeId(source: string, target: string, suffix?: string) {
  return `e_${source}_${target}${suffix ? `_${suffix}` : ''}`;
}

function node(
  id: string,
  type: ForgeNodeType,
  position: { x: number; y: number },
  data: Partial<ForgeNode> = {}
): ForgeFlowNode {
  return {
    id,
    type,
    position,
    data: {
      id,
      type,
      ...data,
    },
  };
}

function edge(
  source: string,
  target: string,
  opts: {
    kind?: ForgeEdgeKind;
    label?: string;
    type?: string; // reactflow edge "type" for custom rendering (e.g. 'choice')
    idSuffix?: string;
    data?: Record<string, unknown>;
  } = {}
): ForgeFlowEdge {
  const { kind, label, type, idSuffix, data } = opts;
  return {
    id: edgeId(source, target, idSuffix),
    source,
    target,
    type,
    label,
    data: {
      ...(data ?? {}),
      kind: kind ?? FORGE_EDGE_KIND.FLOW,
      ...(label ? { label } : {}),
    },
  };
}

function flow(nodes: ForgeFlowNode[], edges: ForgeFlowEdge[], viewport?: { x: number; y: number; zoom: number }): ForgeFlowJson {
  return {
    nodes,
    edges,
    viewport,
  };
}

async function createForgeGraph(payload: Payload, data: Omit<ForgeGraphDoc, 'updatedAt' | 'createdAt'>) {
  // Payload will set createdAt/updatedAt
  return payload.create({
    collection: PAYLOAD_COLLECTIONS.FORGE_GRAPHS as any,
    data,
  }) as unknown as ForgeGraphDoc;
}

export async function seedProjectWithNarrativeGraph(payload: Payload) {
  // Avoid dupes
  const existing = await payload.find({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    where: { name: { equals: 'Demo Project' } },
    limit: 1,
  });

  if (existing.docs.length > 0) return;

  // 1) Create Project
  const project = await payload.create({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    data: {
      name: 'Demo Project',
      slug: 'demo-project',
      description: 'Seeded project with a narrative graph + a storylet graph (plus referenced storylets).',
    },
  });

  // ---------------------------------------------------------------------------
  // 2) Create referenced Storylet graphs (STL1 + STL2) so detours point at real docs
  // ---------------------------------------------------------------------------

  // STL1 (simple)
  const STL1_START = 'stl1_start';
  const STL1_END = 'stl1_end';

  const stl1Flow = flow(
    [
      node(STL1_START, FORGE_NODE_TYPE.CHARACTER, { x: 0, y: 0 }, { label: 'STL1: Start', content: 'Storylet 1 begins.' }),
      node(STL1_END, FORGE_NODE_TYPE.END, { x: 320, y: 0 }, { label: 'STL1: End' }),
    ],
    [
      edge(STL1_START, STL1_END, { kind: FORGE_EDGE_KIND.DEFAULT, label: 'default' }),
    ],
    { x: 0, y: 0, zoom: 1 }
  );

  const stl1 = await createForgeGraph(payload, {
    id: 0 as any, // ignored by Payload; included to satisfy type in this helper signature
    project: project.id,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Storylet 1',
    startNodeId: STL1_START,
    endNodeIds: [{ nodeId: STL1_END, exitKey: 'end' }],
    flow: stl1Flow,
    compiledYarn: null,
  } as any);

  // STL2 (simple)
  const STL2_START = 'stl2_start';
  const STL2_END = 'stl2_end';

  const stl2Flow = flow(
    [
      node(STL2_START, FORGE_NODE_TYPE.CHARACTER, { x: 0, y: 0 }, { label: 'STL2: Start', content: 'Storylet 2 begins.' }),
      node(STL2_END, FORGE_NODE_TYPE.END, { x: 320, y: 0 }, { label: 'STL2: End' }),
    ],
    [
      edge(STL2_START, STL2_END, { kind: FORGE_EDGE_KIND.DEFAULT, label: 'default' }),
    ],
    { x: 0, y: 0, zoom: 1 }
  );

  const stl2 = await createForgeGraph(payload, {
    id: 0 as any,
    project: project.id,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Storylet 2',
    startNodeId: STL2_START,
    endNodeIds: [{ nodeId: STL2_END, exitKey: 'end' }],
    flow: stl2Flow,
    compiledYarn: null,
  } as any);

  // ---------------------------------------------------------------------------
  // 3) Create MAIN STORYLET graph (your first flowchart)
  // ---------------------------------------------------------------------------
  //
  // flowchart
  //   C1[Character] --> CN1{Conditional}
  //   CN1 --> P1[Player]
  //   CN1 --> DET1[Detour]
  //   P1 -->|Choice 1| CH_A[Character A]
  //   P1 -->|Choice 1| P3[Player B]
  //   P1 -->|Choice 2| C2[Character after Choice 2]
  //   C2 --> DET2[Detour Node]
  //   DET2 --> COND2[Conditional Node]
  //   COND2 -->|Condition A met| CH_B[Character B]
  //   COND2 -->|Condition B met| CH_C[Character C]
  //   COND2 -->|Default| CH_D[Default Character]
  //   DET1 -. uses storylet .- STL1[Storylet Data]
  //   DET2 -. uses storylet .- STL2[Storylet Data]
  //
  const S_C1 = 's_c1';
  const S_CN1 = 's_cond1';
  const S_P1 = 's_player1';
  const S_DET1 = 's_det1';

  const S_CH_A = 's_char_a';
  const S_P3 = 's_player_b';
  const S_C2 = 's_char_after_choice2';

  const S_DET2 = 's_det2';
  const S_COND2 = 's_cond2';
  const S_CH_B = 's_char_b';
  const S_CH_C = 's_char_c';
  const S_CH_D = 's_char_d';

  const S_STL1_DATA = 's_stl1_data';
  const S_STL2_DATA = 's_stl2_data';

  const storylet1Call: ForgeStoryletCall = {
    mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
    targetGraphId: stl1.id,
    targetStartNodeId: STL1_START,
  };

  const storylet2Call: ForgeStoryletCall = {
    mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN,
    targetGraphId: stl2.id,
    targetStartNodeId: STL2_START,
  };

  const mainStoryletNodes: ForgeFlowNode[] = [
    node(S_C1, FORGE_NODE_TYPE.CHARACTER, { x: 0, y: 0 }, { label: 'Character', content: 'Opening character line.' }),
    node(S_CN1, FORGE_NODE_TYPE.CONDITIONAL, { x: 280, y: 0 }, { label: 'Conditional' }),

    node(S_P1, FORGE_NODE_TYPE.PLAYER, { x: 560, y: -80 }, {
      label: 'Player',
      content: 'Player prompt.',
      choices: [
        { id: 'choice_1', text: 'Choice 1', nextNodeId: S_CH_A },
        { id: 'choice_2', text: 'Choice 2', nextNodeId: S_C2 },
      ],
    }),

    node(S_DET1, FORGE_NODE_TYPE.DETOUR, { x: 560, y: 110 }, {
      label: 'Detour',
      storyletCall: storylet1Call,
    }),

    node(S_CH_A, FORGE_NODE_TYPE.CHARACTER, { x: 860, y: -150 }, { label: 'Character A', content: 'Branch A response.' }),
    node(S_P3, FORGE_NODE_TYPE.PLAYER, { x: 860, y: -40 }, {
      label: 'Player B',
      content: 'Follow-up player prompt.',
      choices: [{ id: 'choice_b1', text: 'Continue', nextNodeId: S_C2 }],
    }),

    node(S_C2, FORGE_NODE_TYPE.CHARACTER, { x: 860, y: 60 }, { label: 'Character after Choice 2', content: 'Post-choice character line.' }),

    node(S_DET2, FORGE_NODE_TYPE.DETOUR, { x: 1140, y: 60 }, {
      label: 'Detour Node',
      storyletCall: storylet2Call,
    }),

    node(S_COND2, FORGE_NODE_TYPE.CONDITIONAL, { x: 1420, y: 60 }, { label: 'Conditional Node' }),

    node(S_CH_B, FORGE_NODE_TYPE.CHARACTER, { x: 1720, y: -30 }, { label: 'Character B', content: 'Condition A met.' }),
    node(S_CH_C, FORGE_NODE_TYPE.CHARACTER, { x: 1720, y: 60 }, { label: 'Character C', content: 'Condition B met.' }),
    node(S_CH_D, FORGE_NODE_TYPE.CHARACTER, { x: 1720, y: 150 }, { label: 'Default Character', content: 'Default branch.' }),

    // Visual-only "Storylet Data" nodes (still ForgeNodeType.STORYLET)
    node(S_STL1_DATA, FORGE_NODE_TYPE.STORYLET, { x: 860, y: 220 }, { label: 'Storylet Data (STL1)', storyletCall: { ...storylet1Call } }),
    node(S_STL2_DATA, FORGE_NODE_TYPE.STORYLET, { x: 1420, y: 260 }, { label: 'Storylet Data (STL2)', storyletCall: { ...storylet2Call } }),
  ];

  const mainStoryletEdges: ForgeFlowEdge[] = [
    edge(S_C1, S_CN1, { kind: FORGE_EDGE_KIND.FLOW }),

    // Conditional routes to player or detour
    edge(S_CN1, S_P1, { kind: FORGE_EDGE_KIND.CONDITION, label: 'to player' }),
    edge(S_CN1, S_DET1, { kind: FORGE_EDGE_KIND.CONDITION, label: 'to detour' }),

    // Player choices
    edge(S_P1, S_CH_A, { kind: FORGE_EDGE_KIND.CHOICE, label: 'Choice 1', type: 'choice', idSuffix: 'choice1_a' }),
    edge(S_P1, S_P3, { kind: FORGE_EDGE_KIND.CHOICE, label: 'Choice 1', type: 'choice', idSuffix: 'choice1_b' }),
    edge(S_P1, S_C2, { kind: FORGE_EDGE_KIND.CHOICE, label: 'Choice 2', type: 'choice', idSuffix: 'choice2' }),

    // Continue into detour 2 chain
    edge(S_P3, S_C2, { kind: FORGE_EDGE_KIND.FLOW, label: 'continue' }),
    edge(S_C2, S_DET2, { kind: FORGE_EDGE_KIND.FLOW }),

    edge(S_DET2, S_COND2, { kind: FORGE_EDGE_KIND.FLOW }),

    // Conditional outputs
    edge(S_COND2, S_CH_B, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition A met' }),
    edge(S_COND2, S_CH_C, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition B met' }),
    edge(S_COND2, S_CH_D, { kind: FORGE_EDGE_KIND.DEFAULT, label: 'Default' }),

    // Storylet visuals (data reference nodes)
    edge(S_DET1, S_STL1_DATA, { kind: FORGE_EDGE_KIND.VISUAL, label: 'uses storylet' }),
    edge(S_DET2, S_STL2_DATA, { kind: FORGE_EDGE_KIND.VISUAL, label: 'uses storylet' }),
  ];

  const mainStoryletFlow = flow(mainStoryletNodes, mainStoryletEdges, { x: 0, y: 0, zoom: 0.9 });

  const mainStoryletGraph = await createForgeGraph(payload, {
    id: 0 as any,
    project: project.id,
    kind: FORGE_GRAPH_KIND.STORYLET,
    title: 'Demo Storylet Graph',
    startNodeId: S_C1,
    endNodeIds: [
      { nodeId: S_CH_B, exitKey: 'condA' },
      { nodeId: S_CH_C, exitKey: 'condB' },
      { nodeId: S_CH_D, exitKey: 'default' },
    ],
    flow: mainStoryletFlow,
    compiledYarn: null,
  } as any);

  // ---------------------------------------------------------------------------
  // 4) Create NARRATIVE graph (your second flowchart)
  // ---------------------------------------------------------------------------
  //
  // flowchart TB
  //   TS[Thread Graph Start] --> AN[Act Node]
  //   AN --> CH1[Chapter Node]
  //   CH1 --> PG1[Page Node]
  //   PG1 --> DET1[Detour Node] --> COND1[Conditional Node] --> (NPA/NPB/NPD) --> END
  //   CH1 --> DET2[Detour Node] --> COND2[Conditional Node] --> (NCA/NCB/NCD) --> END
  //   DET1 -. uses storylet .- STL1[Storylet Data]
  //   DET2 -. uses storylet .- STL2[Storylet Data]
  //
  const N_TS = 'n_ts';
  const N_AN = 'n_act';
  const N_CH1 = 'n_ch1';
  const N_PG1 = 'n_pg1';

  const N_DET1 = 'n_det_page';
  const N_COND1 = 'n_cond_page';
  const N_NPA = 'n_page_a';
  const N_NPB = 'n_page_b';
  const N_NPD = 'n_page_default';

  const N_DET2 = 'n_det_chapter';
  const N_COND2 = 'n_cond_chapter';
  const N_NCA = 'n_ch_page_a';
  const N_NCB = 'n_ch_page_b';
  const N_NCD = 'n_ch_default';

  const N_STL1_DATA = 'n_stl1_data';
  const N_STL2_DATA = 'n_stl2_data';

  const N_END = 'n_end';

  const narrativeNodes: ForgeFlowNode[] = [
    // Use ACT for "thread start" to stay within ForgeNodeType
    node(N_TS, FORGE_NODE_TYPE.ACT, { x: 0, y: 0 }, { label: 'Thread Graph Start' }),
    node(N_AN, FORGE_NODE_TYPE.ACT, { x: 260, y: 0 }, { label: 'Act Node' }),

    node(N_CH1, FORGE_NODE_TYPE.CHAPTER, { x: 520, y: 0 }, { label: 'Chapter Node' }),
    node(N_PG1, FORGE_NODE_TYPE.PAGE, { x: 780, y: 0 }, { label: 'Page Node' }),

    // Page detour chain
    node(N_DET1, FORGE_NODE_TYPE.DETOUR, { x: 1040, y: -70 }, {
      label: 'Detour Node (Page)',
      storyletCall: { mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN, targetGraphId: stl1.id, targetStartNodeId: STL1_START },
    }),
    node(N_COND1, FORGE_NODE_TYPE.CONDITIONAL, { x: 1300, y: -70 }, { label: 'Conditional Node (Page Detour)' }),
    node(N_NPA, FORGE_NODE_TYPE.PAGE, { x: 1560, y: -150 }, { label: 'Next Page A' }),
    node(N_NPB, FORGE_NODE_TYPE.PAGE, { x: 1560, y: -70 }, { label: 'Next Page B' }),
    node(N_NPD, FORGE_NODE_TYPE.PAGE, { x: 1560, y: 10 }, { label: 'Default Next Page' }),

    // Chapter detour chain
    node(N_DET2, FORGE_NODE_TYPE.DETOUR, { x: 780, y: 190 }, {
      label: 'Detour Node (Chapter)',
      storyletCall: { mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN, targetGraphId: stl2.id, targetStartNodeId: STL2_START },
    }),
    node(N_COND2, FORGE_NODE_TYPE.CONDITIONAL, { x: 1040, y: 190 }, { label: 'Conditional Node (Chapter Detour)' }),
    node(N_NCA, FORGE_NODE_TYPE.PAGE, { x: 1300, y: 110 }, { label: 'Next Chapter Page A' }),
    node(N_NCB, FORGE_NODE_TYPE.PAGE, { x: 1300, y: 190 }, { label: 'Next Chapter Page B' }),
    node(N_NCD, FORGE_NODE_TYPE.PAGE, { x: 1300, y: 270 }, { label: 'Default Chapter Next' }),

    // Visual-only storylet data nodes
    node(N_STL1_DATA, FORGE_NODE_TYPE.STORYLET, { x: 1040, y: 60 }, {
      label: 'Storylet Data (STL1)',
      storyletCall: { mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN, targetGraphId: stl1.id },
    }),
    node(N_STL2_DATA, FORGE_NODE_TYPE.STORYLET, { x: 780, y: 310 }, {
      label: 'Storylet Data (STL2)',
      storyletCall: { mode: FORGE_STORYLET_CALL_MODE.DETOUR_RETURN, targetGraphId: stl2.id },
    }),

    node(N_END, FORGE_NODE_TYPE.END, { x: 1820, y: 0 }, { label: 'End' }),
  ];

  const narrativeEdges: ForgeFlowEdge[] = [
    // Main flow
    edge(N_TS, N_AN, { kind: FORGE_EDGE_KIND.DEFAULT }),
    edge(N_AN, N_CH1, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_CH1, N_PG1, { kind: FORGE_EDGE_KIND.FLOW }),

    // Chapter detour branch
    edge(N_CH1, N_DET2, { kind: FORGE_EDGE_KIND.FLOW, label: 'detour' }),
    edge(N_DET2, N_COND2, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_COND2, N_NCA, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition A met' }),
    edge(N_COND2, N_NCB, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition B met' }),
    edge(N_COND2, N_NCD, { kind: FORGE_EDGE_KIND.DEFAULT, label: 'Default' }),

    // Page detour branch
    edge(N_PG1, N_DET1, { kind: FORGE_EDGE_KIND.FLOW, label: 'detour' }),
    edge(N_DET1, N_COND1, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_COND1, N_NPA, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition A met' }),
    edge(N_COND1, N_NPB, { kind: FORGE_EDGE_KIND.CONDITION, label: 'Condition B met' }),
    edge(N_COND1, N_NPD, { kind: FORGE_EDGE_KIND.DEFAULT, label: 'Default' }),

    // Storylet ref visuals
    edge(N_DET1, N_STL1_DATA, { kind: FORGE_EDGE_KIND.VISUAL, label: 'uses storylet' }),
    edge(N_DET2, N_STL2_DATA, { kind: FORGE_EDGE_KIND.VISUAL, label: 'uses storylet' }),

    // End connections
    edge(N_NPA, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_NPB, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_NPD, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_NCA, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_NCB, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
    edge(N_NCD, N_END, { kind: FORGE_EDGE_KIND.FLOW }),
  ];

  const narrativeFlow = flow(narrativeNodes, narrativeEdges, { x: 0, y: 0, zoom: 0.8 });

  const narrativeGraph = await createForgeGraph(payload, {
    id: 0 as any,
    project: project.id,
    kind: FORGE_GRAPH_KIND.NARRATIVE,
    title: 'Narrative Graph',
    startNodeId: N_TS,
    endNodeIds: [{ nodeId: N_END, exitKey: 'end' }],
    flow: narrativeFlow,
    compiledYarn: null,
  } as any);

  // ---------------------------------------------------------------------------
  // 5) Link graphs to project
  // ---------------------------------------------------------------------------

  // If your projects collection has both narrativeGraph + storyletGraph, keep both.
  // If it only has narrativeGraph, remove storyletGraph from this update.
  await payload.update({
    collection: PAYLOAD_COLLECTIONS.PROJECTS as any,
    id: project.id,
    data: {
      narrativeGraph: narrativeGraph.id,
      storyletGraph: mainStoryletGraph.id,
    },
  });

  // Optional: you might also want to store stl1/stl2 IDs on project (if schema supports).
  // Otherwise they remain discoverable via graph listing/filtering.

  // eslint-disable-next-line no-console
  console.log('✅ Seeded Demo Project + Narrative Graph + Demo Storylet Graph + STL1/STL2');
}
