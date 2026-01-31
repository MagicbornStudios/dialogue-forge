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
 * Relationship flow node (represents a character in the POV graph)
 */
export interface RelationshipFlowNode {
  id: string // characterId
  type: 'character'
  position: Position
  data?: {
    characterId: string
  }
}

/**
 * Relationship flow edge (represents a relationship from perspective character to another)
 */
export interface RelationshipFlowEdge {
  id: string // `${source}->${target}`
  source: string // activeCharacterId (always for Option A)
  target: string // otherCharacterId
  type: 'relationship'
  data?: {
    label?: string
    why?: string // Explanation/reason for the relationship
  }
}

/**
 * Relationship flow structure (legacy / derived from JointJS when needed)
 */
export interface RelationshipFlow {
  nodes: RelationshipFlowNode[]
  edges: RelationshipFlowEdge[]
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
  archivedAt?: Date | null
  _status?: 'draft' | 'published'
  createdAt?: Date
  updatedAt?: Date
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
