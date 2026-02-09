import type { Config } from './payload-types';

export type PayloadCollections = Config['collections'];

export type UserRecord = PayloadCollections['users'];
export type ProjectRecord = PayloadCollections['projects'];
export type MediaRecord = PayloadCollections['media'];
export type CharacterRecord = PayloadCollections['characters'];
export type PageRecord = PayloadCollections['pages'];
type PayloadBlockFallback = {
  id: number;
  page: number | { id?: number };
  parent_block?: number | { id?: number } | null;
  type: string;
  position: number;
  payload?: Record<string, unknown> | null;
  archived?: boolean;
  in_trash?: boolean;
  has_children?: boolean;
};
export type BlockRecord = PayloadCollections extends { blocks: infer T }
  ? T
  : PayloadBlockFallback;
export type ForgeGraphRecord = PayloadCollections['forge-graphs'];
export type FlagSchemaRecord = PayloadCollections['flag-schemas'];
export type GameStateRecord = PayloadCollections['game-states'];
