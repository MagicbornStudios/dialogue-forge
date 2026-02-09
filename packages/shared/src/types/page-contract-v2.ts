import type { PageType } from './narrative';

export type PageParentContractV2 =
  | { type: 'workspace'; workspace: true }
  | { type: 'page_id'; page_id: number }
  | { type: 'block_id'; block_id: number }
  | { type: 'database_id'; database_id: string }
  | { type: 'data_source_id'; data_source_id: string; database_id?: string };

export type BlockParentContractV2 =
  | { type: 'page_id'; page_id: number }
  | { type: 'block_id'; block_id: number };

export type PageContractV2 = {
  id: number;
  project: number;
  parent: PageParentContractV2;
  properties: Record<string, unknown>;
  cover?: Record<string, unknown> | null;
  icon?: Record<string, unknown> | null;
  archived?: boolean;
  in_trash?: boolean;
  url?: string | null;
  public_url?: string | null;
  legacy?: {
    pageType?: PageType;
    title?: string;
    summary?: string | null;
    order?: number;
    narrativeGraph?: number | null;
    dialogueGraph?: number | null;
    bookHeading?: string | null;
    bookBody?: string | null;
    content?: unknown;
  };
};

export type BlockContractV2 = {
  id: number;
  page: number;
  parent_block?: number | null;
  type: string;
  position: number;
  payload: Record<string, unknown>;
  archived?: boolean;
  in_trash?: boolean;
  has_children?: boolean;
};

export type ResolvedSerializedContent = {
  serialized: string | null;
  source: 'blocks' | 'legacy' | 'empty';
};
