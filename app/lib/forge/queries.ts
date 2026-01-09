"use client"

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { getPayloadClient } from "./payload-client"
import { PAYLOAD_COLLECTIONS } from "@/app/payload-collections/enums"
import type { DialogueTree } from "@magicborn/dialogue-forge/src/types"

// ============================
// Query Key Factories
// ============================

export const queryKeys = {
  dialogues: {
    all: ["dialogues"] as const,
    lists: () => [...queryKeys.dialogues.all, "list"] as const,
    list: (projectId?: string) => [...queryKeys.dialogues.lists(), projectId] as const,
    details: () => [...queryKeys.dialogues.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.dialogues.details(), id] as const,
  },
  pages: {
    all: ["pages"] as const,
    details: () => [...queryKeys.pages.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.pages.details(), id] as const,
    byDialogueId: (dialogueId: string) => [...queryKeys.pages.all, "byDialogueId", dialogueId] as const,
    byChapterId: (chapterId: string) => [...queryKeys.pages.all, "byChapterId", chapterId] as const,
  },
  storyletTemplates: {
    all: ["storyletTemplates"] as const,
    lists: () => [...queryKeys.storyletTemplates.all, "list"] as const,
    list: (projectId?: string) => [...queryKeys.storyletTemplates.lists(), projectId] as const,
    details: () => [...queryKeys.storyletTemplates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.storyletTemplates.details(), id] as const,
    byChapterId: (chapterId: string) => [...queryKeys.storyletTemplates.all, "byChapterId", chapterId] as const,
  },
  storyletPools: {
    all: ["storyletPools"] as const,
    details: () => [...queryKeys.storyletPools.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.storyletPools.details(), id] as const,
    byChapterId: (chapterId: string) => [...queryKeys.storyletPools.all, "byChapterId", chapterId] as const,
  },
  acts: {
    all: ["acts"] as const,
    lists: () => [...queryKeys.acts.all, "list"] as const,
    list: (threadId?: string) => [...queryKeys.acts.lists(), threadId] as const,
    details: () => [...queryKeys.acts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.acts.details(), id] as const,
  },
  chapters: {
    all: ["chapters"] as const,
    lists: () => [...queryKeys.chapters.all, "list"] as const,
    list: (actId?: string) => [...queryKeys.chapters.lists(), actId] as const,
    details: () => [...queryKeys.chapters.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.chapters.details(), id] as const,
  },
  threads: {
    all: ["threads"] as const,
    lists: () => [...queryKeys.threads.all, "list"] as const,
    list: (projectId?: string) => [...queryKeys.threads.lists(), projectId] as const,
    details: () => [...queryKeys.threads.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.threads.details(), id] as const,
  },
  flagSchemas: {
    all: ["flagSchemas"] as const,
    lists: () => [...queryKeys.flagSchemas.all, "list"] as const,
    list: (projectId?: string) => [...queryKeys.flagSchemas.lists(), projectId] as const,
    details: () => [...queryKeys.flagSchemas.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.flagSchemas.details(), id] as const,
  },
  characters: {
    all: ["characters"] as const,
    lists: () => [...queryKeys.characters.all, "list"] as const,
    list: (projectId?: string) => [...queryKeys.characters.lists(), projectId] as const,
    details: () => [...queryKeys.characters.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.characters.details(), id] as const,
  },
  gameStates: {
    all: ["gameStates"] as const,
    lists: () => [...queryKeys.gameStates.all, "list"] as const,
    list: (filters?: { projectId?: string; threadId?: string; playerKey?: string; type?: string }) => [...queryKeys.gameStates.lists(), filters] as const,
    details: () => [...queryKeys.gameStates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.gameStates.details(), id] as const,
  },
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
  },
} as const

// ============================
// Dialogue Queries
// ============================

export interface DialogueDocument {
  id: string
  title: string
  tree: DialogueTree
  startNodeId: string
  project: string | { id: string }
  archivedAt?: string | null
}

/**
 * Get a dialogue by ID (returns DialogueTree)
 */
export function useDialogue(dialogueId: string | null): UseQueryResult<DialogueTree, Error> {
  return useQuery({
    queryKey: queryKeys.dialogues.detail(dialogueId || ""),
    queryFn: async () => {
      if (!dialogueId) throw new Error("dialogueId is required")
      const client = getPayloadClient()
      const doc = await client.findByID<DialogueDocument>(
        PAYLOAD_COLLECTIONS.DIALOGUES,
        dialogueId,
        { depth: 1 }
      )
      return doc.tree as DialogueTree
    },
    enabled: !!dialogueId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get a dialogue document by ID (returns full DialogueDocument)
 */
export function useDialogueDocument(dialogueId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.dialogues.detail(dialogueId || ""), "document"],
    queryFn: async () => {
      if (!dialogueId) throw new Error("dialogueId is required")
      const client = getPayloadClient()
      return client.findByID<DialogueDocument>(
        PAYLOAD_COLLECTIONS.DIALOGUES,
        dialogueId,
        { depth: 1 }
      )
    },
    enabled: !!dialogueId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List dialogues, optionally filtered by project
 */
export function useDialogues(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.dialogues.list(projectId),
    queryFn: async () => {
      const client = getPayloadClient()
      const where = projectId ? { project: { equals: projectId } } : undefined
      const result = await client.find<DialogueDocument>(PAYLOAD_COLLECTIONS.DIALOGUES, {
        where,
        depth: 1,
      })
      return result.docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        tree: doc.tree,
        startNodeId: doc.startNodeId,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Create a new dialogue
 */
export function useCreateDialogue(): UseMutationResult<DialogueDocument, Error, Partial<DialogueDocument>> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: Partial<DialogueDocument>) => {
      const client = getPayloadClient()
      return client.create<DialogueDocument>(PAYLOAD_COLLECTIONS.DIALOGUES, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.lists() })
    },
  })
}

/**
 * Update a dialogue
 */
export function useUpdateDialogue(): UseMutationResult<DialogueDocument, Error, { id: string; data: Partial<DialogueDocument> }> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DialogueDocument> }) => {
      const client = getPayloadClient()
      return client.update<DialogueDocument>(PAYLOAD_COLLECTIONS.DIALOGUES, id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.lists() })
    },
  })
}

// ============================
// Page Queries
// ============================

export interface PageDocument {
  id: string
  title?: string
  summary?: string
  order: number
  project: string | { id: string }
  chapter: string | { id: string }
  dialogue: string | { id: string }
  dialogueId?: string
  archivedAt?: string | null
}

/**
 * Get a page by ID
 */
export function usePage(pageId: string | null) {
  return useQuery({
    queryKey: queryKeys.pages.detail(pageId || ""),
    queryFn: async () => {
      if (!pageId) throw new Error("pageId is required")
      const client = getPayloadClient()
      return client.findByID<PageDocument>(PAYLOAD_COLLECTIONS.PAGES, pageId, { depth: 2 })
    },
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get a page by dialogue ID (finds the page that uses this dialogue)
 */
export function usePageByDialogueId(dialogueId: string | null) {
  return useQuery({
    queryKey: queryKeys.pages.byDialogueId(dialogueId || ""),
    queryFn: async () => {
      if (!dialogueId) throw new Error("dialogueId is required")
      const client = getPayloadClient()
      const result = await client.find<PageDocument>(PAYLOAD_COLLECTIONS.PAGES, {
        where: {
          or: [
            { dialogue: { equals: dialogueId } },
            { dialogueId: { equals: dialogueId } },
          ],
        },
        limit: 1,
        depth: 2,
      })
      return result.docs[0] || null
    },
    enabled: !!dialogueId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Update a page
 */
export function useUpdatePage(): UseMutationResult<PageDocument, Error, { id: string; data: Partial<PageDocument> }> {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PageDocument> }) => {
      const client = getPayloadClient()
      return client.update<PageDocument>(PAYLOAD_COLLECTIONS.PAGES, id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.all })
    },
  })
}

// ============================
// Storylet Template Queries
// ============================

export interface StoryletTemplateDocument {
  id: string
  title?: string
  summary?: string
  project: string | { id: string }
  dialogue: string | { id: string; tree?: DialogueTree }
  tags?: Array<{ tag: string }>
  defaultWeight?: number
}

/**
 * Get a storylet template by ID
 */
export function useStoryletTemplate(templateId: string | null) {
  return useQuery({
    queryKey: queryKeys.storyletTemplates.detail(templateId || ""),
    queryFn: async () => {
      if (!templateId) throw new Error("templateId is required")
      const client = getPayloadClient()
      return client.findByID<StoryletTemplateDocument>(
        PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES,
        templateId,
        { depth: 2 }
      )
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Narrative Element Queries
// ============================

export interface ActDocument {
  id: string
  title?: string
  summary?: string
  order: number
  project: string | { id: string }
  thread: string | { id: string }
}

export interface ChapterDocument {
  id: string
  title?: string
  summary?: string
  order: number
  project: string | { id: string }
  act: string | { id: string }
}

/**
 * Get an act by ID
 */
export function useAct(actId: string | null) {
  return useQuery({
    queryKey: queryKeys.acts.detail(actId || ""),
    queryFn: async () => {
      if (!actId) throw new Error("actId is required")
      const client = getPayloadClient()
      return client.findByID<ActDocument>(PAYLOAD_COLLECTIONS.ACTS, actId, { depth: 1 })
    },
    enabled: !!actId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get a chapter by ID
 */
export function useChapter(chapterId: string | null) {
  return useQuery({
    queryKey: queryKeys.chapters.detail(chapterId || ""),
    queryFn: async () => {
      if (!chapterId) throw new Error("chapterId is required")
      const client = getPayloadClient()
      return client.findByID<ChapterDocument>(PAYLOAD_COLLECTIONS.CHAPTERS, chapterId, { depth: 2 })
    },
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get acts by thread ID
 */
export function useActsByThread(threadId: string | null) {
  return useQuery({
    queryKey: queryKeys.acts.list(threadId || ""),
    queryFn: async () => {
      if (!threadId) throw new Error("threadId is required")
      const client = getPayloadClient()
      const result = await client.find<ActDocument>(PAYLOAD_COLLECTIONS.ACTS, {
        where: { thread: { equals: threadId } },
        sort: "order",
        depth: 1,
      })
      return result.docs
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get chapters by act ID
 */
export function useChaptersByAct(actId: string | null) {
  return useQuery({
    queryKey: queryKeys.chapters.list(actId || ""),
    queryFn: async () => {
      if (!actId) throw new Error("actId is required")
      const client = getPayloadClient()
      const result = await client.find<ChapterDocument>(PAYLOAD_COLLECTIONS.CHAPTERS, {
        where: { act: { equals: actId } },
        sort: "order",
        depth: 1,
      })
      return result.docs
    },
    enabled: !!actId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get pages by chapter ID
 */
export function usePagesByChapter(chapterId: string | null) {
  return useQuery({
    queryKey: queryKeys.pages.byChapterId(chapterId || ""),
    queryFn: async () => {
      if (!chapterId) throw new Error("chapterId is required")
      const client = getPayloadClient()
      const result = await client.find<PageDocument>(PAYLOAD_COLLECTIONS.PAGES, {
        where: { chapter: { equals: chapterId } },
        sort: "order",
        depth: 2,
      })
      return result.docs
    },
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Thread Queries
// ============================

export interface ThreadDocument {
  id: string
  title?: string
  summary?: string
  project: string | { id: string }
}

/**
 * Get a thread by ID
 */
export function useThread(threadId: string | null) {
  return useQuery({
    queryKey: queryKeys.threads.detail(threadId || ""),
    queryFn: async () => {
      if (!threadId) throw new Error("threadId is required")
      const client = getPayloadClient()
      return client.findByID<ThreadDocument>(PAYLOAD_COLLECTIONS.THREADS, threadId, { depth: 1 })
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List threads, optionally filtered by project
 */
export function useThreads(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.threads.list(projectId),
    queryFn: async () => {
      const client = getPayloadClient()
      const where = projectId ? { project: { equals: projectId } } : undefined
      const result = await client.find<ThreadDocument>(PAYLOAD_COLLECTIONS.THREADS, {
        where,
        depth: 1,
      })
      return result.docs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Flag Schema Queries
// ============================

export interface FlagSchemaDocument {
  id: string
  project: string | { id: string }
  schema: unknown // FlagSchema structure stored as JSON
}

/**
 * Get a flag schema by ID
 */
export function useFlagSchema(schemaId: string | null) {
  return useQuery({
    queryKey: queryKeys.flagSchemas.detail(schemaId || ""),
    queryFn: async () => {
      if (!schemaId) throw new Error("schemaId is required")
      const client = getPayloadClient()
      return client.findByID<FlagSchemaDocument>(PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, schemaId, { depth: 1 })
    },
    enabled: !!schemaId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List flag schemas, optionally filtered by project
 */
export function useFlagSchemas(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.flagSchemas.list(projectId),
    queryFn: async () => {
      const client = getPayloadClient()
      const where = projectId ? { project: { equals: projectId } } : undefined
      const result = await client.find<FlagSchemaDocument>(PAYLOAD_COLLECTIONS.FLAG_SCHEMAS, {
        where,
        depth: 1,
      })
      return result.docs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Character Queries
// ============================

export interface CharacterDocument {
  id: string
  name: string
  project: string | { id: string }
  avatar?: string | { id: string }
  meta?: unknown
  archivedAt?: string | null
}

/**
 * Get a character by ID
 */
export function useCharacter(characterId: string | null) {
  return useQuery({
    queryKey: queryKeys.characters.detail(characterId || ""),
    queryFn: async () => {
      if (!characterId) throw new Error("characterId is required")
      const client = getPayloadClient()
      return client.findByID<CharacterDocument>(PAYLOAD_COLLECTIONS.CHARACTERS, characterId, { depth: 2 })
    },
    enabled: !!characterId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List characters, optionally filtered by project
 */
export function useCharacters(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.characters.list(projectId),
    queryFn: async () => {
      const client = getPayloadClient()
      const where = projectId ? { project: { equals: projectId } } : undefined
      const result = await client.find<CharacterDocument>(PAYLOAD_COLLECTIONS.CHARACTERS, {
        where,
        depth: 2,
      })
      return result.docs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Game State Queries
// ============================

export interface GameStateDocument {
  id: string
  project: string | { id: string }
  type: "AUTHORED" | "RUNTIME"
  thread?: string | { id: string }
  playerKey?: string
  state: unknown // BaseGameState structure stored as JSON
}

/**
 * Get a game state by ID
 */
export function useGameState(stateId: string | null) {
  return useQuery({
    queryKey: queryKeys.gameStates.detail(stateId || ""),
    queryFn: async () => {
      if (!stateId) throw new Error("stateId is required")
      const client = getPayloadClient()
      return client.findByID<GameStateDocument>(PAYLOAD_COLLECTIONS.GAME_STATES, stateId, { depth: 2 })
    },
    enabled: !!stateId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List game states with optional filters
 */
export function useGameStates(filters?: { projectId?: string; threadId?: string; playerKey?: string; type?: "AUTHORED" | "RUNTIME" }) {
  return useQuery({
    queryKey: queryKeys.gameStates.list(filters),
    queryFn: async () => {
      const client = getPayloadClient()
      const whereConditions: Array<Record<string, unknown>> = []
      
      if (filters?.projectId) {
        whereConditions.push({ project: { equals: filters.projectId } })
      }
      if (filters?.threadId) {
        whereConditions.push({ thread: { equals: filters.threadId } })
      }
      if (filters?.playerKey) {
        whereConditions.push({ playerKey: { equals: filters.playerKey } })
      }
      if (filters?.type) {
        whereConditions.push({ type: { equals: filters.type } })
      }
      
      const where = whereConditions.length > 0 ? { and: whereConditions } : undefined
      const result = await client.find<GameStateDocument>(PAYLOAD_COLLECTIONS.GAME_STATES, {
        where,
        depth: 2,
      })
      return result.docs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Storylet Pool Queries
// ============================

export interface StoryletPoolMemberDocument {
  template: string | { id: string }
  weight?: number
}

export interface StoryletPoolDocument {
  id: string
  title?: string
  summary?: string
  project: string | { id: string }
  selectionMode: "WEIGHTED" | "UNIFORM"
  members: StoryletPoolMemberDocument[]
}

/**
 * Get a storylet pool by ID
 */
export function useStoryletPool(poolId: string | null) {
  return useQuery({
    queryKey: queryKeys.storyletPools.detail(poolId || ""),
    queryFn: async () => {
      if (!poolId) throw new Error("poolId is required")
      const client = getPayloadClient()
      return client.findByID<StoryletPoolDocument>(
        PAYLOAD_COLLECTIONS.STORYLET_POOLS,
        poolId,
        { depth: 2 }
      )
    },
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get storylet pools by chapter ID
 * Note: This requires a relationship field on pools to chapters, which may not exist.
 * For now, we'll need to query all pools and filter, or add a chapter relationship field.
 */
export function useStoryletPoolsByChapter(chapterId: string | null) {
  return useQuery({
    queryKey: queryKeys.storyletPools.byChapterId(chapterId || ""),
    queryFn: async () => {
      if (!chapterId) throw new Error("chapterId is required")
      // Note: If pools don't have a direct chapter relationship, we may need to query differently
      // For now, return empty array - this will need to be implemented based on actual schema
      const client = getPayloadClient()
      const result = await client.find<StoryletPoolDocument>(PAYLOAD_COLLECTIONS.STORYLET_POOLS, {
        // TODO: Add proper where clause when chapter relationship is defined
        depth: 2,
      })
      return result.docs
    },
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Get storylet templates by chapter ID
 * Note: Similar to pools, this may require a relationship field or different query approach
 */
export function useStoryletTemplatesByChapter(chapterId: string | null) {
  return useQuery({
    queryKey: queryKeys.storyletTemplates.byChapterId(chapterId || ""),
    queryFn: async () => {
      if (!chapterId) throw new Error("chapterId is required")
      const client = getPayloadClient()
      const result = await client.find<StoryletTemplateDocument>(PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES, {
        // TODO: Add proper where clause when chapter relationship is defined
        depth: 2,
      })
      return result.docs
    },
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Project Queries
// ============================

export interface ProjectDocument {
  id: string
  slug: string
  name: string
  description?: string
  settings?: unknown
}

/**
 * Get a project by ID
 */
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId || ""),
    queryFn: async () => {
      if (!projectId) throw new Error("projectId is required")
      const client = getPayloadClient()
      return client.findByID<ProjectDocument>(PAYLOAD_COLLECTIONS.PROJECTS, projectId, { depth: 1 })
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * List all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      const client = getPayloadClient()
      const result = await client.find<ProjectDocument>(PAYLOAD_COLLECTIONS.PROJECTS, {
        depth: 1,
      })
      return result.docs
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================
// Composite Query Hooks
// ============================

/**
 * Fetch thread with all related data (acts, chapters, pages, storylet templates, pools)
 */
export function useThreadWithAllData(threadId: string | null) {
  const threadQuery = useThread(threadId)
  const actsQuery = useActsByThread(threadId)
  
  // Get all act IDs to fetch chapters
  const actIds = useMemo(() => {
    return actsQuery.data?.map(act => act.id) || []
  }, [actsQuery.data])
  
  // Fetch chapters for all acts
  // Note: We'll need to fetch all chapters and filter, or create a batch query
  const allChaptersQuery = useQuery({
    queryKey: [...queryKeys.chapters.all, "byThread", threadId || ""],
    queryFn: async () => {
      if (!threadId || actIds.length === 0) return []
      const client = getPayloadClient()
      // Fetch chapters for all acts in this thread
      const result = await client.find<ChapterDocument>(PAYLOAD_COLLECTIONS.CHAPTERS, {
        where: {
          act: { in: actIds },
        },
        sort: "order",
        depth: 1,
      })
      return result.docs
    },
    enabled: !!threadId && actIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
  
  // Get all chapter IDs to fetch pages, templates, pools
  const chapterIds = useMemo(() => {
    return allChaptersQuery.data?.map(chapter => chapter.id) || []
  }, [allChaptersQuery.data])
  
  // Fetch pages for all chapters
  const allPagesQuery = useQuery({
    queryKey: [...queryKeys.pages.all, "byThread", threadId || ""],
    queryFn: async () => {
      if (chapterIds.length === 0) return []
      const client = getPayloadClient()
      const result = await client.find<PageDocument>(PAYLOAD_COLLECTIONS.PAGES, {
        where: {
          chapter: { in: chapterIds },
        },
        sort: "order",
        depth: 2,
      })
      return result.docs
    },
    enabled: chapterIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })
  
  // Fetch storylet templates (will need proper filtering when schema is updated)
  const allStoryletTemplatesQuery = useQuery({
    queryKey: [...queryKeys.storyletTemplates.all, "byThread", threadId || ""],
    queryFn: async () => {
      if (!threadId) return []
      const client = getPayloadClient()
      // TODO: Add proper filtering when chapter relationship is defined
      const result = await client.find<StoryletTemplateDocument>(PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES, {
        depth: 2,
      })
      return result.docs
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
  })
  
  // Fetch storylet pools (will need proper filtering when schema is updated)
  const allStoryletPoolsQuery = useQuery({
    queryKey: [...queryKeys.storyletPools.all, "byThread", threadId || ""],
    queryFn: async () => {
      if (!threadId) return []
      const client = getPayloadClient()
      // TODO: Add proper filtering when chapter relationship is defined
      const result = await client.find<StoryletPoolDocument>(PAYLOAD_COLLECTIONS.STORYLET_POOLS, {
        depth: 2,
      })
      return result.docs
    },
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000,
  })
  
  return useMemo(() => {
    if (!threadQuery.data) return null
    
    return {
      thread: threadQuery.data,
      acts: actsQuery.data || [],
      chapters: allChaptersQuery.data || [],
      pages: allPagesQuery.data || [],
      storyletTemplates: allStoryletTemplatesQuery.data || [],
      storyletPools: allStoryletPoolsQuery.data || [],
      isLoading: threadQuery.isLoading || actsQuery.isLoading || allChaptersQuery.isLoading || 
                 allPagesQuery.isLoading || allStoryletTemplatesQuery.isLoading || allStoryletPoolsQuery.isLoading,
      isError: threadQuery.isError || actsQuery.isError || allChaptersQuery.isError || 
               allPagesQuery.isError || allStoryletTemplatesQuery.isError || allStoryletPoolsQuery.isError,
      error: threadQuery.error || actsQuery.error || allChaptersQuery.error || 
             allPagesQuery.error || allStoryletTemplatesQuery.error || allStoryletPoolsQuery.error,
    }
  }, [
    threadQuery.data,
    threadQuery.isLoading,
    threadQuery.isError,
    threadQuery.error,
    actsQuery.data,
    actsQuery.isLoading,
    actsQuery.isError,
    actsQuery.error,
    allChaptersQuery.data,
    allChaptersQuery.isLoading,
    allChaptersQuery.isError,
    allChaptersQuery.error,
    allPagesQuery.data,
    allPagesQuery.isLoading,
    allPagesQuery.isError,
    allPagesQuery.error,
    allStoryletTemplatesQuery.data,
    allStoryletTemplatesQuery.isLoading,
    allStoryletTemplatesQuery.isError,
    allStoryletTemplatesQuery.error,
    allStoryletPoolsQuery.data,
    allStoryletPoolsQuery.isLoading,
    allStoryletPoolsQuery.isError,
    allStoryletPoolsQuery.error,
  ])
}

/**
 * Fetch all data needed for NarrativeWorkspace
 */
export interface WorkspaceData {
  thread: ThreadDocument | null
  dialogue: DialogueDocument | null
  flagSchema: FlagSchemaDocument | null
  gameState: GameStateDocument | null
  characters: CharacterDocument[]
  project: ProjectDocument | null
  isLoading: boolean
  isError: boolean
  error: Error | null
}

export function useWorkspaceData(
  threadId: string | null,
  dialogueId?: string | null,
  flagSchemaId?: string | null,
  gameStateId?: string | null
) {
  const threadData = useThreadWithAllData(threadId)
  const dialogueDocumentQuery = useDialogueDocument(dialogueId || null)
  const flagSchemaQuery = useFlagSchema(flagSchemaId || null)
  const gameStateQuery = useGameState(gameStateId || null)
  
  // Get project ID from thread
  const projectId = useMemo(() => {
    if (!threadData?.thread) return null
    const project = threadData.thread.project
    return typeof project === "string" ? project : project?.id || null
  }, [threadData?.thread])
  
  // Fetch project
  const projectQuery = useProject(projectId)
  
  // Fetch characters for project
  const charactersQuery = useCharacters(projectId || undefined)
  
  // Fetch authored game state for thread if gameStateId not provided
  const authoredGameStateQuery = useGameStates(
    threadId && !gameStateId
      ? { threadId, type: "AUTHORED" }
      : undefined
  )
  
  // Use provided game state or authored game state
  const activeGameState = useMemo(() => {
    if (gameStateQuery.data) return gameStateQuery.data
    if (authoredGameStateQuery.data && authoredGameStateQuery.data.length > 0) {
      return authoredGameStateQuery.data[0]
    }
    return null
  }, [gameStateQuery.data, authoredGameStateQuery.data])
  
  return useMemo(() => {
    const isLoading = 
      (threadData?.isLoading ?? false) ||
      dialogueDocumentQuery.isLoading ||
      flagSchemaQuery.isLoading ||
      gameStateQuery.isLoading ||
      authoredGameStateQuery.isLoading ||
      projectQuery.isLoading ||
      charactersQuery.isLoading
    
    const isError =
      (threadData?.isError ?? false) ||
      dialogueDocumentQuery.isError ||
      flagSchemaQuery.isError ||
      gameStateQuery.isError ||
      authoredGameStateQuery.isError ||
      projectQuery.isError ||
      charactersQuery.isError
    
    const error =
      threadData?.error ||
      dialogueDocumentQuery.error ||
      flagSchemaQuery.error ||
      gameStateQuery.error ||
      authoredGameStateQuery.error ||
      projectQuery.error ||
      charactersQuery.error
    
    return {
      thread: threadData?.thread || null,
      dialogue: dialogueDocumentQuery.data || null,
      flagSchema: flagSchemaQuery.data || null,
      gameState: activeGameState,
      characters: charactersQuery.data || [],
      project: projectQuery.data || null,
      isLoading,
      isError,
      error: error as Error | null,
    }
  }, [
    threadData,
    dialogueDocumentQuery.data,
    dialogueDocumentQuery.isLoading,
    dialogueDocumentQuery.isError,
    dialogueDocumentQuery.error,
    flagSchemaQuery.data,
    flagSchemaQuery.isLoading,
    flagSchemaQuery.isError,
    flagSchemaQuery.error,
    gameStateQuery.data,
    gameStateQuery.isLoading,
    gameStateQuery.isError,
    gameStateQuery.error,
    authoredGameStateQuery.data,
    authoredGameStateQuery.isLoading,
    authoredGameStateQuery.isError,
    authoredGameStateQuery.error,
    projectQuery.data,
    projectQuery.isLoading,
    projectQuery.isError,
    projectQuery.error,
    charactersQuery.data,
    charactersQuery.isLoading,
    charactersQuery.isError,
    charactersQuery.error,
    activeGameState,
  ])
}
