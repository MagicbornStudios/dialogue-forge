/**
 * Character workspace types
 * Domain layer - these types are independent from PayloadCMS types
 */

/**
 * Position in 2D space (used by relationship graph and other graph formats)
 */
export interface Position {
  x: number
  y: number
}






/**
 * JointJS graph snapshot (graph.toJSON()). Stored on Character.relationshipGraphJson.
 */
export type JointGraphJson = Record<string, unknown>

/**
 * Character document (domain representation)
 * Independent from PayloadCMS types
 */
export interface CharacterDoc {
  id: string
  name: string
  description?: string
  imageUrl?: string
  avatarUrl?: string
  project: string
  /** JointJS graph snapshot (graph.toJSON()). Saved from the relationship graph editor. */
  relationshipGraphJson?: JointGraphJson
pdatedAt?: Date
}

/**
 * Minimal character info for workspace operations
 */
export interface CharacterInfo {
  id: string
  name: string
  description?: string
  imageUrl?: string
  avatarUrl?: string
}

/**
 * Character workspace tool mode
 */
export const TOOL_MODE = {
  SELECT: 'select',
  PAN: 'pan',
  LINK: 'link',
} as const

export type ToolMode = typeof TOOL_MODE[keyof typeof TOOL_MODE]

/**
 * Relationship document (domain representation).
 * Stored in Payload relationships collection; links to characters and project.
 */
export interface RelationshipDoc {
  id: string
  project: string
  sourceCharacter: string
  targetCharacter: string
  label?: string
  description?: string
}

/**
 * Edge shape for relationship list (id, source, target, optional label/description, optional relationship id).
 */
export interface RelationshipFlowEdge {
  id: string
  source: string
  target: string
  data?: { label?: string; why?: string }
  relationshipId?: string
}
