import type { Config } from './payload-types';

export type PayloadCollections = Config['collections'];

export type UserRecord = PayloadCollections['users'];
export type ProjectRecord = PayloadCollections['projects'];
export type MediaRecord = PayloadCollections['media'];
export type CharacterRecord = PayloadCollections['characters'];
export type PageRecord = PayloadCollections['pages'];
export type ForgeGraphRecord = PayloadCollections['forge-graphs'];
export type FlagSchemaRecord = PayloadCollections['flag-schemas'];
export type GameStateRecord = PayloadCollections['game-states'];
