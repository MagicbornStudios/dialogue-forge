export type ForgeProjectSummary = {
  id: number;
  name: string;
  slug?: string | null;
  narrativeGraph?: number | null;
  storyletGraphs?: number[] | null;
  activeGameStateId?: number | null;
};

export type ForgeFlagSchema = {
  id: number;
  schema: unknown;
};
