/**
 * Character workspace adapter contracts
 * These define the host ↔ workspace boundary
 */

import type { CharacterDoc, RelationshipDoc } from './character'

/**
 * Project info (minimal)
 */
export interface ProjectInfo {
  id: string
  title: string
}

/**
 * Character create/update patch
 */
export interface CharacterPatch {
  name?: string
  description?: string
  imageUrl?: string
  avatarId?: string | null
  /** JointJS graph snapshot (graph.toJSON()) */
  relationshipGraphJson?: CharacterDoc['relationshipGraphJson']
}

/**
 * Media upload result
 */
export interface MediaUploadResult {
  id: string
  url: string
}

/**
 * Character workspace adapter
 * Host layer must implement this to provide data access to the workspace
 */
export interface CharacterWorkspaceAdapter {
  /**
   * List all projects available to the user
   */
  listProjects(): Promise<ProjectInfo[]>

  /**
   * Create a new project (optional – e.g. open Admin if not implemented).
   */
  createProject?(data: { name: string }): Promise<ProjectInfo>

  /**
   * List all characters for a project
   */
  listCharacters(projectId: string): Promise<CharacterDoc[]>

  /**
   * Create a new character
   */
  createCharacter(projectId: string, data: CharacterPatch & { name: string }): Promise<CharacterDoc>

  /**
   * Update an existing character (partial update)
   */
  updateCharacter(characterId: string, patch: CharacterPatch): Promise<CharacterDoc>

  /**
   * Delete a character (optional - can be used for cleanup)
   */
  deleteCharacter?(characterId: string): Promise<void>

  /**
   * Upload a media file to the media collection
   */
  uploadMedia(file: File): Promise<MediaUploadResult>

  /**
   * List relationships for a project (for matching links to label/description)
   */
  listRelationshipsForProject(projectId: string): Promise<RelationshipDoc[]>

  /**
   * Create a relationship (call when adding a link on the graph)
   */
  createRelationship(data: {
    projectId: string
    sourceCharacterId: string
    targetCharacterId: string
    label?: string
    description?: string
  }): Promise<RelationshipDoc>

  /**
   * Update a relationship's label and/or description
   */
  updateRelationship(
    relationshipId: string,
    patch: { label?: string; description?: string }
  ): Promise<RelationshipDoc>

  /**
   * Delete a relationship (optional; call when removing link from list)
   */
  deleteRelationship?(relationshipId: string): Promise<void>
}
