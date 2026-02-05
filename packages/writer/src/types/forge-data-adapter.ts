import type { ForgeProjectSummary } from '@magicborn/forge';
import type { ForgeGraphDoc, ForgeGraphKind, ForgeReactFlowJson } from '@magicborn/shared/types/forge-graph';
import type { ForgePage } from '@magicborn/shared/types/narrative';

export type { ForgeProjectSummary };

export interface WriterForgeDataAdapter {
  listGraphs(projectId: number, kind?: ForgeGraphKind): Promise<ForgeGraphDoc[]>;
  getGraph(graphId: number): Promise<ForgeGraphDoc>;
  createGraph(input: {
    projectId: number;
    kind: ForgeGraphKind;
    title: string;
    flow: ForgeReactFlowJson;
    startNodeId: string;
    endNodeIds: { nodeId: string; exitKey?: string }[];
  }): Promise<ForgeGraphDoc>;
  updateGraph(
    graphId: number,
    patch: Partial<Pick<ForgeGraphDoc, 'title' | 'flow' | 'startNodeId' | 'endNodeIds' | 'compiledYarn'>>
  ): Promise<ForgeGraphDoc>;
  deleteGraph(graphId: number): Promise<void>;
  getProject(projectId: number): Promise<ForgeProjectSummary>;
  createAct?(input: {
    projectId: number;
    name: string;
    summary?: string | null;
    order: number;
  }): Promise<ForgePage>;
}
