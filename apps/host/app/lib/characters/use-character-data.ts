'use client';

import { useMemo } from 'react';
import type {
  CharacterWorkspaceAdapter,
  CharacterPatch,
  CharacterDoc,
  RelationshipDoc,
  ProjectInfo,
  MediaUploadResult,
} from '@magicborn/characters/types';
import type { Character, Project, Media } from '../../payload-types';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';
import { payload } from '../forge/payload';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function mapProject(project: Project): ProjectInfo {
  return { id: String(project.id), title: project.name };
}

function mapCharacter(char: Character, baseUrl: string): CharacterDoc {
  const projectId = typeof char.project === 'number' ? String(char.project) : String(char.project.id);
  const relationshipGraphJson = (char as { relationshipGraphJson?: unknown }).relationshipGraphJson;
  const description = (char as { description?: string }).description;
  const imageUrl = (char as { imageUrl?: string }).imageUrl;
  let avatarUrl: string | undefined;
  if (char.avatar) {
    if (typeof char.avatar === 'object' && char.avatar !== null) {
      const media = char.avatar as Media;
      if (media.url) {
        avatarUrl = media.url.startsWith('http') ? media.url : media.url.startsWith('/') ? `${baseUrl}${media.url}` : `${baseUrl}/${media.url}`;
      } else if (media.sizes?.thumbnail?.url) {
        const thumbUrl = media.sizes.thumbnail.url;
        avatarUrl = thumbUrl.startsWith('http') ? thumbUrl : thumbUrl.startsWith('/') ? `${baseUrl}${thumbUrl}` : `${baseUrl}/${thumbUrl}`;
      } else if (media.id) {
        avatarUrl = `${baseUrl}/api/media/file/${media.id}`;
      }
    } else if (typeof char.avatar === 'number') {
      avatarUrl = `${baseUrl}/api/media/file/${char.avatar}`;
    }
  }
  return {
    id: String(char.id),
    name: char.name,
    description: description ?? undefined,
    imageUrl: imageUrl ?? undefined,
    avatarUrl,
    project: projectId,
    relationshipGraphJson: relationshipGraphJson ?? undefined,
    archivedAt: char.archivedAt ? new Date(char.archivedAt) : null,
    createdAt: char.createdAt ? new Date(char.createdAt) : undefined,
    updatedAt: char.updatedAt ? new Date(char.updatedAt) : undefined,
  };
}

export function useCharacterData(): CharacterWorkspaceAdapter {
  return useMemo((): CharacterWorkspaceAdapter => {
    const baseUrl = getBaseUrl();
    return {
    async listProjects() {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 1000 });
      return result.docs.map((doc) => mapProject(doc as Project));
    },
    async createProject(data: { name: string }) {
      const doc = (await payload.create({ collection: PAYLOAD_COLLECTIONS.PROJECTS, data: { name: data.name.trim() } })) as Project;
      return mapProject(doc);
    },
    async uploadMedia(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${baseUrl}/api/media`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Failed to upload media: ${response.status} ${await response.text()}`);
      const result = await response.json();
      const media = result.doc as Media;
      if (!media?.id) throw new Error('Invalid media upload response');
      const url = media.url
        ? (media.url.startsWith('http') ? media.url : media.url.startsWith('/') ? `${baseUrl}${media.url}` : `${baseUrl}/${media.url}`)
        : `${baseUrl}/api/media/file/${media.id}`;
      return { id: String(media.id), url };
    },
    async listCharacters(projectId: string) {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) throw new Error(`Invalid project ID: ${projectId}`);
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: { project: { equals: projectIdNum } },
        limit: 1000,
        depth: 1,
      });
      return result.docs.map((doc) => mapCharacter(doc as Character, baseUrl));
    },
    async createCharacter(projectId: string, data: CharacterPatch & { name: string }) {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) throw new Error(`Invalid project ID: ${projectId}`);
      const createData: Record<string, unknown> = {
        project: projectIdNum,
        name: data.name,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        relationshipGraphJson: data.relationshipGraphJson ?? null,
      };
      if (data.avatarId !== undefined) (createData as any).avatar = data.avatarId ? parseInt(data.avatarId, 10) : null;
      const doc = (await payload.create({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, data: createData as any })) as Character;
      const fullDoc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: doc.id, depth: 1 })) as Character;
      return mapCharacter(fullDoc, baseUrl);
    },
    async updateCharacter(characterId: string, patch: CharacterPatch) {
      const characterIdNum = parseInt(characterId, 10);
      if (isNaN(characterIdNum)) throw new Error(`Invalid character ID: ${characterId}`);
      const updateData: Record<string, unknown> = {};
      if (patch.name !== undefined) updateData.name = patch.name;
      if (patch.description !== undefined) updateData.description = patch.description ?? null;
      if (patch.imageUrl !== undefined) updateData.imageUrl = patch.imageUrl ?? null;
      if (patch.relationshipGraphJson !== undefined) updateData.relationshipGraphJson = patch.relationshipGraphJson ?? null;
      if (patch.avatarId !== undefined) (updateData as any).avatar = patch.avatarId ? parseInt(patch.avatarId, 10) : null;
      await payload.update({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum, data: updateData as any });
      const fullDoc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum, depth: 1 })) as Character;
      if (!fullDoc) throw new Error(`Failed to fetch updated character ${characterId}`);
      return mapCharacter(fullDoc, baseUrl);
    },
    async deleteCharacter(characterId: string) {
      const characterIdNum = parseInt(characterId, 10);
      if (isNaN(characterIdNum)) throw new Error(`Invalid character ID: ${characterId}`);
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum });
    },
    async listRelationshipsForProject(projectId: string) {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) throw new Error(`Invalid project ID: ${projectId}`);
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, where: { project: { equals: projectIdNum } }, limit: 1000 } as any);
      return result.docs.map((doc: any) => ({
        id: String(doc.id),
        project: String(doc.project?.id ?? doc.project),
        sourceCharacter: String(doc.sourceCharacter?.id ?? doc.sourceCharacter),
        targetCharacter: String(doc.targetCharacter?.id ?? doc.targetCharacter),
        label: doc.label ?? undefined,
        description: doc.description ?? undefined,
      }));
    },
    async createRelationship(data: {
      projectId: string;
      sourceCharacterId: string;
      targetCharacterId: string;
      label?: string;
      description?: string;
    }) {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS,
        data: {
          project: parseInt(data.projectId, 10),
          sourceCharacter: parseInt(data.sourceCharacterId, 10),
          targetCharacter: parseInt(data.targetCharacterId, 10),
          label: data.label ?? null,
          description: data.description ?? null,
        },
      } as any)) as any;
      return {
        id: String(doc.id),
        project: String(doc.project?.id ?? doc.project),
        sourceCharacter: String(doc.sourceCharacter?.id ?? doc.sourceCharacter),
        targetCharacter: String(doc.targetCharacter?.id ?? doc.targetCharacter),
        label: doc.label ?? undefined,
        description: doc.description ?? undefined,
      };
    },
    async updateRelationship(relationshipId: string, patch: { label?: string; description?: string }) {
      const idNum = parseInt(relationshipId, 10);
      if (isNaN(idNum)) throw new Error(`Invalid relationship ID: ${relationshipId}`);
      const updateData: any = {};
      if (patch.label !== undefined) updateData.label = patch.label ?? null;
      if (patch.description !== undefined) updateData.description = patch.description ?? null;
      const doc = (await payload.update({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, id: idNum, data: updateData } as any)) as any;
      return {
        id: String(doc.id),
        project: String(doc.project?.id ?? doc.project),
        sourceCharacter: String(doc.sourceCharacter?.id ?? doc.sourceCharacter),
        targetCharacter: String(doc.targetCharacter?.id ?? doc.targetCharacter),
        label: doc.label ?? undefined,
        description: doc.description ?? undefined,
      };
    },
    async deleteRelationship(relationshipId: string) {
      const idNum = parseInt(relationshipId, 10);
      if (isNaN(idNum)) throw new Error(`Invalid relationship ID: ${relationshipId}`);
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, id: idNum } as any);
    },
  };
  }, []);
}
