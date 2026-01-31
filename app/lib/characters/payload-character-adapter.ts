/**
 * Payload adapter for Character workspace
 * Implements CharacterWorkspaceAdapter using Payload CMS
 */

import { PayloadSDK } from '@payloadcms/sdk';
import type {
  CharacterWorkspaceAdapter,
  CharacterPatch,
  CharacterDoc,
  ProjectInfo,
  MediaUploadResult,
} from '@/characters/types';
import type { Character, Project, Media } from '@/app/payload-types';
import { PAYLOAD_COLLECTIONS } from '@/app/payload-collections/enums';

/**
 * Map Payload Project to ProjectInfo
 */
function mapProject(project: Project): ProjectInfo {
  return {
    id: String(project.id),
    title: project.name,
  };
}

/**
 * Map Payload Character to CharacterDoc
 * Handles type conversion and field mapping
 */
function mapCharacter(char: Character, baseUrl: string): CharacterDoc {
  // Extract project ID (can be number or Project object)
  const projectId = typeof char.project === 'number' 
    ? String(char.project) 
    : String(char.project.id);

  const relationshipGraphJson = (char as any).relationshipGraphJson;

  // Extract description and imageUrl (may not be in type definition yet)
  const description = (char as any).description;
  const imageUrl = (char as any).imageUrl;

  // Extract avatar URL from avatar relationship
  let avatarUrl: string | undefined = undefined;
  if (char.avatar) {
    if (typeof char.avatar === 'object' && char.avatar !== null) {
      // Avatar is a Media object
      const media = char.avatar as Media;
      
      // Try multiple URL sources in order of preference
      // 1. Use media.url if available (most reliable)
      if (media.url) {
        if (media.url.startsWith('http')) {
          avatarUrl = media.url;
        } else if (media.url.startsWith('/')) {
          avatarUrl = `${baseUrl}${media.url}`;
        } else {
          avatarUrl = `${baseUrl}/${media.url}`;
        }
      }
      // 2. Try thumbnail URL if available
      else if (media.sizes?.thumbnail?.url) {
        const thumbUrl = media.sizes.thumbnail.url;
        if (thumbUrl.startsWith('http')) {
          avatarUrl = thumbUrl;
        } else if (thumbUrl.startsWith('/')) {
          avatarUrl = `${baseUrl}${thumbUrl}`;
        } else {
          avatarUrl = `${baseUrl}/${thumbUrl}`;
        }
      }
      // 3. Fallback to API endpoint
      else if (media.id) {
        avatarUrl = `${baseUrl}/api/media/file/${media.id}`;
      }
    } else if (typeof char.avatar === 'number') {
      // Avatar is just an ID, use API endpoint
      avatarUrl = `${baseUrl}/api/media/file/${char.avatar}`;
    }
  }

  return {
    id: String(char.id),
    name: char.name,
    description: description ?? undefined,
    imageUrl: imageUrl ?? undefined,
    avatarUrl: avatarUrl,
    project: projectId,
    relationshipGraphJson: relationshipGraphJson ?? undefined,
    archivedAt: char.archivedAt ? new Date(char.archivedAt) : null,
    _status: char._status ?? undefined,
    createdAt: char.createdAt ? new Date(char.createdAt) : undefined,
    updatedAt: char.updatedAt ? new Date(char.updatedAt) : undefined,
  };
}

export class PayloadCharacterAdapter implements CharacterWorkspaceAdapter {
  private baseUrl: string
  private payload: PayloadSDK

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl;
    this.payload = new PayloadSDK({
      baseURL: `${this.baseUrl}/api`,
    });
  }

  async listProjects(): Promise<ProjectInfo[]> {
    const result = await this.payload.find({
      collection: PAYLOAD_COLLECTIONS.PROJECTS,
      limit: 1000,
    });
    return result.docs.map((doc) => mapProject(doc as Project));
  }

  async createProject(data: { name: string }): Promise<ProjectInfo> {
    const doc = await this.payload.create({
      collection: PAYLOAD_COLLECTIONS.PROJECTS,
      data: { name: data.name.trim() },
    }) as Project;
    return mapProject(doc);
  }

  async uploadMedia(file: File): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/media`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload media: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const media = result.doc as Media;

    if (!media || !media.id) {
      throw new Error('Invalid media upload response');
    }

    // Construct full URL - PayloadCMS serves media via /api/media/file/:id or url field
    let url: string;
    if (media.url) {
      if (media.url.startsWith('http')) {
        url = media.url;
      } else if (media.url.startsWith('/')) {
        url = `${this.baseUrl}${media.url}`;
      } else {
        url = `${this.baseUrl}/${media.url}`;
      }
    } else if (media.id) {
      // Fallback: use PayloadCMS API endpoint
      url = `${this.baseUrl}/api/media/file/${media.id}`;
    } else {
      // Last resort: try filename
      url = `${this.baseUrl}/media/${media.filename || ''}`;
    }

    return {
      id: String(media.id),
      url: url,
    };
  }

  async listCharacters(projectId: string): Promise<CharacterDoc[]> {
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum)) {
      throw new Error(`Invalid project ID: ${projectId}`);
    }

    const result = await this.payload.find({
      collection: PAYLOAD_COLLECTIONS.CHARACTERS,
      where: {
        project: {
          equals: projectIdNum,
        },
      },
      limit: 1000,
      depth: 1, // Include related media objects
    });
    return result.docs.map((doc) => mapCharacter(doc as Character, this.baseUrl));
  }

  async createCharacter(projectId: string, data: CharacterPatch & { name: string }): Promise<CharacterDoc> {
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(projectIdNum)) {
      throw new Error(`Invalid project ID: ${projectId}`);
    }

    const createData: any = {
      project: projectIdNum,
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      relationshipGraphJson: data.relationshipGraphJson ?? null,
      _status: 'draft',
    };

    if (data.avatarId !== undefined) {
      createData.avatar = data.avatarId ? parseInt(data.avatarId, 10) : null;
    }

    const doc = await this.payload.create({
      collection: PAYLOAD_COLLECTIONS.CHARACTERS,
      data: createData,
    }) as Character;

    // Fetch with depth to include avatar media
    const fullDoc = await this.payload.findByID({
      collection: PAYLOAD_COLLECTIONS.CHARACTERS,
      id: doc.id,
      depth: 1,
    }) as Character;

    return mapCharacter(fullDoc, this.baseUrl);
  }

  async updateCharacter(characterId: string, patch: CharacterPatch): Promise<CharacterDoc> {
    const characterIdNum = parseInt(characterId, 10);
    if (isNaN(characterIdNum)) {
      throw new Error(`Invalid character ID: ${characterId}`);
    }

    const updateData: any = {};
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.description !== undefined) updateData.description = patch.description ?? null;
    if (patch.imageUrl !== undefined) updateData.imageUrl = patch.imageUrl ?? null;
    if (patch.relationshipGraphJson !== undefined) updateData.relationshipGraphJson = patch.relationshipGraphJson ?? null;
    if (patch.avatarId !== undefined) {
      updateData.avatar = patch.avatarId ? parseInt(patch.avatarId, 10) : null;
    }

    // Update the character
    try {
      const updateResult = await this.payload.update({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        id: characterIdNum,
        data: updateData,
      });

      // Handle different response structures - PayloadSDK might return { doc: ... } or the doc directly
      const doc = (updateResult as any)?.doc || updateResult as Character;
      const docId = doc?.id || characterIdNum;
      
      // Always fetch with depth to ensure we have the full document with relationships
      const fullDoc = await this.payload.findByID({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        id: docId,
        depth: 1,
      }) as Character;

      if (!fullDoc) {
        throw new Error(`Failed to fetch updated character ${characterId} after update`);
      }

      return mapCharacter(fullDoc, this.baseUrl);
    } catch (error) {
      console.error('Error updating character:', error);
      console.error('Update data:', updateData);
      throw error;
    }
  }

  async deleteCharacter(characterId: string): Promise<void> {
    const characterIdNum = parseInt(characterId, 10);
    if (isNaN(characterIdNum)) {
      throw new Error(`Invalid character ID: ${characterId}`);
    }

    await this.payload.delete({
      collection: PAYLOAD_COLLECTIONS.CHARACTERS,
      id: characterIdNum,
    });
  }
}

/**
 * Factory to create Payload character adapter with default configuration
 */
export function makePayloadCharacterAdapter(options: {
  baseUrl: string
  projectId?: string
}): PayloadCharacterAdapter {
  return new PayloadCharacterAdapter(options)
}