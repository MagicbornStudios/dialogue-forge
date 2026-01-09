"use client"

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query"
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
  },
  storyletTemplates: {
    all: ["storyletTemplates"] as const,
    details: () => [...queryKeys.storyletTemplates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.storyletTemplates.details(), id] as const,
  },
  acts: {
    all: ["acts"] as const,
    details: () => [...queryKeys.acts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.acts.details(), id] as const,
  },
  chapters: {
    all: ["chapters"] as const,
    details: () => [...queryKeys.chapters.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.chapters.details(), id] as const,
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
 * Get a dialogue by ID
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
