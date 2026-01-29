/**
 * Character workspace adapter contracts
 * These define the host ↔ workspace boundary
 */

import type { CharacterDoc } from './character'

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
  relationshipFlow?: CharacterDoc['relationshipFlow']
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
}
