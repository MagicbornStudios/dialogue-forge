"use client"

import { NARRATIVE_ELEMENT, STORYLET_SELECTION_MODE } from "@magicborn/dialogue-forge/src/types/narrative"
import type { DialogueTree, StoryThread, NarrativeAct, NarrativeChapter, NarrativePage, StoryletTemplate, StoryletPool } from "@magicborn/dialogue-forge/src/types"
import type { FlagSchema } from "@magicborn/dialogue-forge/src/types/flags"
import type { Character } from "@magicborn/dialogue-forge/src/types/characters"
import type { BaseGameState } from "@magicborn/dialogue-forge/src/types/game-state"
import type {
  ThreadDocument,
  ActDocument,
  ChapterDocument,
  PageDocument,
  StoryletTemplateDocument,
  StoryletPoolDocument,
  DialogueDocument,
  FlagSchemaDocument,
  CharacterDocument,
  GameStateDocument,
} from "./queries"

// ============================
// Helper Functions
// ============================

/**
 * Extract ID from a relationship field (can be string ID or populated object)
 */
export function getRelationshipId(rel: string | { id: string } | undefined | null): string | null {
  if (!rel) return null
  if (typeof rel === "string") return rel
  if (typeof rel === "object" && "id" in rel) return rel.id
  return null
}

/**
 * Sort items by order field
 */
export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

// ============================
// Thread Data Preparation
// ============================

/**
 * Prepare thread data with nested structure from flat PayloadCMS relationships
 */
export function prepareThreadData(
  thread: ThreadDocument,
  acts: ActDocument[],
  chapters: ChapterDocument[],
  pages: PageDocument[],
  storyletTemplates: StoryletTemplateDocument[],
  storyletPools: StoryletPoolDocument[]
): StoryThread {
  const threadId = thread.id
  
  // Filter and sort acts for this thread
  const threadActs = sortByOrder(
    acts.filter(act => getRelationshipId(act.thread) === threadId)
  ).map(act => buildActData(act, chapters, pages, storyletTemplates, storyletPools))
  
  return {
    id: thread.id,
    title: thread.title,
    summary: thread.summary,
    type: NARRATIVE_ELEMENT.THREAD,
    acts: threadActs,
  }
}

/**
 * Build act data with nested chapters
 */
function buildActData(
  act: ActDocument,
  chapters: ChapterDocument[],
  pages: PageDocument[],
  storyletTemplates: StoryletTemplateDocument[],
  storyletPools: StoryletPoolDocument[]
): NarrativeAct {
  const actId = act.id
  
  // Filter and sort chapters for this act
  const actChapters = sortByOrder(
    chapters.filter(chapter => getRelationshipId(chapter.act) === actId)
  ).map(chapter => buildChapterData(chapter, pages, storyletTemplates, storyletPools))
  
  return {
    id: act.id,
    title: act.title,
    summary: act.summary,
    type: NARRATIVE_ELEMENT.ACT,
    chapters: actChapters,
  }
}

/**
 * Build chapter data with nested pages, storylet templates, and pools
 */
function buildChapterData(
  chapter: ChapterDocument,
  pages: PageDocument[],
  storyletTemplates: StoryletTemplateDocument[],
  storyletPools: StoryletPoolDocument[]
): NarrativeChapter {
  const chapterId = chapter.id
  
  // Filter and sort pages for this chapter
  const chapterPages = sortByOrder(
    pages.filter(page => getRelationshipId(page.chapter) === chapterId)
  ).map(page => ({
    id: page.id,
    title: page.title,
    summary: page.summary,
    dialogueId: getRelationshipId(page.dialogue) || page.dialogueId || "",
    type: NARRATIVE_ELEMENT.PAGE,
  }))
  
  // Filter storylet templates for this chapter
  // Note: If templates don't have direct chapter relationship, this will need adjustment
  const chapterStoryletTemplates: StoryletTemplate[] = storyletTemplates
    .filter(template => {
      // TODO: Add proper filtering when chapter relationship is defined
      // For now, return empty array or all templates (will need schema update)
      return false
    })
    .map(template => ({
      id: template.id,
      title: template.title,
      summary: template.summary,
      dialogueId: getRelationshipId(template.dialogue) || "",
      type: NARRATIVE_ELEMENT.STORYLET,
    }))
  
  // Filter storylet pools for this chapter
  // Note: If pools don't have direct chapter relationship, this will need adjustment
  const chapterStoryletPools: StoryletPool[] = storyletPools
    .filter(pool => {
      // TODO: Add proper filtering when chapter relationship is defined
      return false
    })
    .map(pool => ({
      id: pool.id,
      title: pool.title,
      summary: pool.summary,
      selectionMode: pool.selectionMode === "WEIGHTED" ? STORYLET_SELECTION_MODE.WEIGHTED : STORYLET_SELECTION_MODE.UNIFORM,
      members: pool.members.map(member => ({
        templateId: getRelationshipId(member.template) || "",
        weight: member.weight,
      })),
    }))
  
  return {
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    type: NARRATIVE_ELEMENT.CHAPTER,
    pages: chapterPages,
    storyletTemplates: chapterStoryletTemplates.length > 0 ? chapterStoryletTemplates : undefined,
    storyletPools: chapterStoryletPools.length > 0 ? chapterStoryletPools : undefined,
  }
}

// ============================
// Dialogue Data Preparation
// ============================

/**
 * Prepare dialogue data from PayloadCMS document
 */
export function prepareDialogueData(dialogueDoc: DialogueDocument): DialogueTree {
  // Extract tree JSON field - it should already be a DialogueTree
  return dialogueDoc.tree as DialogueTree
}

// ============================
// Flag Schema Data Preparation
// ============================

/**
 * Prepare flag schema data from PayloadCMS document
 */
export function prepareFlagSchemaData(schemaDoc: FlagSchemaDocument): FlagSchema {
  // Extract schema JSON field - it should already be a FlagSchema
  return schemaDoc.schema as FlagSchema
}

// ============================
// Character Data Preparation
// ============================

/**
 * Transform character document to Character type
 */
function transformCharacterDocument(charDoc: CharacterDocument): Character {
  return {
    id: charDoc.id,
    name: charDoc.name,
    avatar: typeof charDoc.avatar === "object" && charDoc.avatar ? charDoc.avatar.id : charDoc.avatar,
    meta: charDoc.meta,
  }
}

/**
 * Prepare characters data as Record from array
 */
export function prepareCharactersData(characters: CharacterDocument[]): Record<string, Character> {
  const record: Record<string, Character> = {}
  characters.forEach(char => {
    record[char.id] = transformCharacterDocument(char)
  })
  return record
}

// ============================
// Game State Data Preparation
// ============================

/**
 * Prepare game state data with characters populated from project
 */
export function prepareGameStateData(
  gameStateDoc: GameStateDocument,
  projectCharacters: CharacterDocument[]
): BaseGameState {
  const state = gameStateDoc.state as { flags?: Record<string, unknown>; characterIds?: string[] }
  
  // Get character IDs from game state
  const characterIds = state.characterIds || []
  
  // Build characters record from project characters
  const characters: Record<string, Character> = {}
  characterIds.forEach(id => {
    const char = projectCharacters.find(c => c.id === id)
    if (char) {
      characters[id] = transformCharacterDocument(char)
    }
  })
  
  return {
    flags: (state.flags as Record<string, boolean | number | string>) || {},
    characters, // Characters populated from project
  }
}
