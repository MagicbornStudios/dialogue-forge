'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Character, Project, Media } from '../../payload-types';
import { PAYLOAD_COLLECTIONS } from '../../payload-collections/enums';
import { payload } from '../forge/payload';
import type {
  CharacterWorkspaceAdapter,
  CharacterPatch,
  CharacterDoc,
  RelationshipDoc,
  ProjectInfo,
  MediaUploadResult,
} from '@magicborn/characters/types';

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
    relationshipGraphJson: (relationshipGraphJson ?? undefined) as CharacterDoc['relationshipGraphJson'],
    archivedAt: char.archivedAt ? new Date(char.archivedAt) : null,
    createdAt: char.createdAt ? new Date(char.createdAt) : undefined,
    updatedAt: char.updatedAt ? new Date(char.updatedAt) : undefined,
  };
}

function mapRelationship(doc: any): RelationshipDoc {
  return {
    id: String(doc.id),
    project: String(doc.project?.id ?? doc.project),
    sourceCharacter: String(doc.sourceCharacter?.id ?? doc.sourceCharacter),
    targetCharacter: String(doc.targetCharacter?.id ?? doc.targetCharacter),
    label: doc.label ?? undefined,
    description: doc.description ?? undefined,
  };
}

export const characterQueryKeys = {
  all: ['characters'] as const,
  projects: () => [...characterQueryKeys.all, 'projects'] as const,
  list: (projectId: string) => [...characterQueryKeys.all, 'list', projectId] as const,
  relationships: (projectId: string) => [...characterQueryKeys.all, 'relationships', projectId] as const,
};

export function useCharacterProjects() {
  return useQuery({
    queryKey: characterQueryKeys.projects(),
    queryFn: async (): Promise<ProjectInfo[]> => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 1000 });
      return result.docs.map((doc) => mapProject(doc as Project));
    },
  });
}

export function useCharacters(projectId: string | null) {
  return useQuery({
    queryKey: characterQueryKeys.list(projectId ?? ''),
    queryFn: async (): Promise<CharacterDoc[]> => {
      const projectIdNum = parseInt(projectId!, 10);
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: { project: { equals: projectIdNum } },
        limit: 1000,
        depth: 1,
      });
      return result.docs.map((doc) => mapCharacter(doc as Character, getBaseUrl()));
    },
    enabled: projectId != null && !Number.isNaN(parseInt(projectId, 10)),
  });
}

export function useRelationships(projectId: string | null) {
  return useQuery({
    queryKey: characterQueryKeys.relationships(projectId ?? ''),
    queryFn: async (): Promise<RelationshipDoc[]> => {
      const projectIdNum = parseInt(projectId!, 10);
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS,
        where: { project: { equals: projectIdNum } },
        limit: 1000,
      } as any);
      return result.docs.map((doc: any) => mapRelationship(doc));
    },
    enabled: projectId != null && !Number.isNaN(parseInt(projectId, 10)),
  });
}

type QueryClientLike = {
  fetchQuery: <T>(opts: { queryKey: readonly unknown[]; queryFn: () => Promise<T> }) => Promise<T>;
};

export async function fetchCharacterProjects(queryClient: QueryClientLike): Promise<ProjectInfo[]> {
  return queryClient.fetchQuery({
    queryKey: characterQueryKeys.projects(),
    queryFn: async () => {
      const result = await payload.find({ collection: PAYLOAD_COLLECTIONS.PROJECTS, limit: 1000 });
      return result.docs.map((doc) => mapProject(doc as Project));
    },
  });
}

export async function fetchCharacters(queryClient: QueryClientLike, projectId: string): Promise<CharacterDoc[]> {
  return queryClient.fetchQuery({
    queryKey: characterQueryKeys.list(projectId),
    queryFn: async () => {
      const projectIdNum = parseInt(projectId, 10);
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.CHARACTERS,
        where: { project: { equals: projectIdNum } },
        limit: 1000,
        depth: 1,
      });
      return result.docs.map((doc) => mapCharacter(doc as Character, getBaseUrl()));
    },
  });
}

export async function fetchRelationships(queryClient: QueryClientLike, projectId: string): Promise<RelationshipDoc[]> {
  return queryClient.fetchQuery({
    queryKey: characterQueryKeys.relationships(projectId),
    queryFn: async () => {
      const projectIdNum = parseInt(projectId, 10);
      const result = await payload.find({
        collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS,
        where: { project: { equals: projectIdNum } },
        limit: 1000,
      } as any);
      return result.docs.map((doc: any) => mapRelationship(doc));
    },
  });
}

export function useCreateCharacterProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const doc = (await payload.create({
        collection: PAYLOAD_COLLECTIONS.PROJECTS,
        data: { name: data.name.trim() },
      })) as Project;
      return mapProject(doc);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterQueryKeys.projects() }),
  });
}

export function useUploadCharacterMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<MediaUploadResult> => {
      const baseUrl = getBaseUrl();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${baseUrl}/api/media`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Failed to upload media: ${response.status} ${await response.text()}`);
      const result = await response.json();
      const media = result.doc as Media;
      if (!media?.id) throw new Error('Invalid media upload response');
      const url = media.url
        ? media.url.startsWith('http') ? media.url : media.url.startsWith('/') ? `${baseUrl}${media.url}` : `${baseUrl}/${media.url}`
        : `${baseUrl}/api/media/file/${media.id}`;
      return { id: String(media.id), url };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: characterQueryKeys.all }),
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; data: CharacterPatch & { name: string } }) => {
      const projectIdNum = parseInt(input.projectId, 10);
      const createData: Record<string, unknown> = {
        project: projectIdNum,
        name: input.data.name,
        description: input.data.description ?? null,
        imageUrl: input.data.imageUrl ?? null,
        relationshipGraphJson: input.data.relationshipGraphJson ?? null,
      };
      if (input.data.avatarId !== undefined) (createData as any).avatar = input.data.avatarId ? parseInt(input.data.avatarId, 10) : null;
      const doc = (await payload.create({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, data: createData as any })) as Character;
      const fullDoc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: doc.id, depth: 1 })) as Character;
      return mapCharacter(fullDoc, getBaseUrl());
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: characterQueryKeys.list(variables.projectId) }),
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { characterId: string; patch: CharacterPatch }) => {
      const characterIdNum = parseInt(input.characterId, 10);
      const updateData: Record<string, unknown> = {};
      if (input.patch.name !== undefined) updateData.name = input.patch.name;
      if (input.patch.description !== undefined) updateData.description = input.patch.description ?? null;
      if (input.patch.imageUrl !== undefined) updateData.imageUrl = input.patch.imageUrl ?? null;
      if (input.patch.relationshipGraphJson !== undefined) updateData.relationshipGraphJson = input.patch.relationshipGraphJson ?? null;
      if (input.patch.avatarId !== undefined) (updateData as any).avatar = input.patch.avatarId ? parseInt(input.patch.avatarId, 10) : null;
      await payload.update({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum, data: updateData as any });
      const fullDoc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum, depth: 1 })) as Character;
      if (!fullDoc) throw new Error(`Failed to fetch updated character ${input.characterId}`);
      return mapCharacter(fullDoc, getBaseUrl());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.list(data.project) });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (characterId: string) => {
      const characterIdNum = parseInt(characterId, 10);
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum })) as Character;
      const projectId = typeof doc.project === 'number' ? String(doc.project) : String((doc.project as { id?: number })?.id);
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.CHARACTERS, id: characterIdNum });
      return { characterId, projectId };
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: characterQueryKeys.list(data.projectId) }),
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      sourceCharacterId: string;
      targetCharacterId: string;
      label?: string;
      description?: string;
    }) => {
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
      return mapRelationship(doc);
    },
    onSuccess: (data) =>
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.relationships(data.project) }),
  });
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { relationshipId: string; patch: { label?: string; description?: string } }) => {
      const idNum = parseInt(input.relationshipId, 10);
      const updateData: any = {};
      if (input.patch.label !== undefined) updateData.label = input.patch.label ?? null;
      if (input.patch.description !== undefined) updateData.description = input.patch.description ?? null;
      const doc = (await payload.update({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, id: idNum, data: updateData } as any)) as any;
      return mapRelationship(doc);
    },
    onSuccess: (data) =>
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.relationships(data.project) }),
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const idNum = parseInt(relationshipId, 10);
      const doc = (await payload.findByID({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, id: idNum } as any)) as any;
      const projectId = String(doc.project?.id ?? doc.project);
      await payload.delete({ collection: PAYLOAD_COLLECTIONS.RELATIONSHIPS, id: idNum } as any);
      return { relationshipId, projectId };
    },
    onSuccess: (data) =>
      queryClient.invalidateQueries({ queryKey: characterQueryKeys.relationships(data.projectId) }),
  });
}
