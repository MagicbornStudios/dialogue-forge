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
  DIALOGUES: 'dialogues',
  THREADS: 'threads',
  ACTS: 'acts',
  CHAPTERS: 'chapters',
  PAGES: 'pages',
  STORYLET_TEMPLATES: 'storylet-templates',
  STORYLET_POOLS: 'storylet-pools',
  FLAG_SCHEMAS: 'flag-schemas',
  GAME_STATES: 'game-states',
  USERS: 'users',
  FORGE_GRAPHS: 'forge-graphs',
} as const

export type PayloadCollectionName = typeof PAYLOAD_COLLECTIONS[keyof typeof PAYLOAD_COLLECTIONS]
