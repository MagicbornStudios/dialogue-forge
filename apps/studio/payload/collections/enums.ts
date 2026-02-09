/**
 * Payload Collection Name Constants
 * 
 * Use these constants instead of string literals for collection names
 * to ensure type safety and prevent typos.
 */

export const PAYLOAD_COLLECTIONS = {
  PROJECTS: 'projects',
  MEDIA: 'media',
  CHARACTERS: 'characters',
  RELATIONSHIPS: 'relationships',
  DIALOGUES: 'dialogues',
  PAGES: 'pages',
  STORYLET_TEMPLATES: 'storylet-templates',
  STORYLET_POOLS: 'storylet-pools',
  FLAG_SCHEMAS: 'flag-schemas',
  GAME_STATES: 'game-states',
  USERS: 'users',
  FORGE_GRAPHS: 'forge-graphs',
  BLOCKS: 'blocks',
} as const

export type PayloadCollectionName = typeof PAYLOAD_COLLECTIONS[keyof typeof PAYLOAD_COLLECTIONS]
