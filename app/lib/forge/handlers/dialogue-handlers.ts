"use client"

import type { DialogueForgeEvent } from "@magicborn/dialogue-forge/src/components/forge/events/events"
import { DIALOGUE_FORGE_EVENT_TYPE } from "@magicborn/dialogue-forge/src/types/constants"
import type { ForgeGraph } from "@magicborn/dialogue-forge/src/types"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import { getPayloadClient } from "../payload-client"
import { PAYLOAD_COLLECTIONS } from "@/app/payload-collections/enums"
import type { DialogueDocument } from "../queries"

/**
 * Handler for dialogue.openRequested event.
 * Fetches a dialogue from PayloadCMS and returns the DialogueTree.
 * 
 * This handler can be used in two ways:
 * 1. With a query hook (for React components)
 * 2. Direct fetch (for non-React contexts)
 */
export interface DialogueOpenRequestedHandlerOptions {
  /**
   * Optional query hook result. If provided, will use the query data.
   * Otherwise, will fetch directly.
   */
  query?: UseQueryResult<ForgeGraph, Error>
  
  /**
   * Optional callback to handle the fetched dialogue.
   * If not provided, the handler will just fetch and return.
   */
  onDialogueLoaded?: (dialogue: ForgeGraph) => void | Promise<void>
  
  /**
   * Optional error handler.
   */
  onError?: (error: Error) => void
}

export function createDialogueOpenRequestedHandler(
  options: DialogueOpenRequestedHandlerOptions = {}
): (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_OPEN_REQUESTED }>) => Promise<void> {
  return async (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_OPEN_REQUESTED }>): Promise<void> => {
    try {
      const { dialogueId } = event.payload
      
      // If query is provided and has data, use it
      if (options.query?.data) {
        if (options.onDialogueLoaded) {
          await options.onDialogueLoaded(options.query.data)
        }
        return
      }
      
      // Otherwise, fetch directly
      const client = getPayloadClient()
      const doc = await client.findByID<DialogueDocument>(
        PAYLOAD_COLLECTIONS.DIALOGUES,
        dialogueId,
        { depth: 1 }
      )
      
      const dialogue = doc.tree as ForgeGraph
      
      if (options.onDialogueLoaded) {
        await options.onDialogueLoaded(dialogue)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("Failed to open dialogue:", err)
        throw err
      }
    }
  }
}

/**
 * Handler for dialogue.changed event.
 * Saves the dialogue to PayloadCMS.
 */
export interface DialogueChangedHandlerOptions {
  /**
   * Mutation hook for updating dialogues.
   */
  updateMutation: UseMutationResult<DialogueDocument, Error, { id: string; data: Partial<DialogueDocument> }>
  
  /**
   * Optional callback after successful save.
   */
  onSaved?: (dialogue: ForgeGraph) => void | Promise<void>
  
  /**
   * Optional error handler.
   */
  onError?: (error: Error) => void
  
  /**
   * Debounce delay in milliseconds. Default: 500ms.
   * Set to 0 to disable debouncing.
   */
  debounceMs?: number
}

// Debounce map for dialogue saves
const saveDebounceMap = new Map<string, NodeJS.Timeout>()

export function createDialogueChangedHandler(
  options: DialogueChangedHandlerOptions
): (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_CHANGED }>) => Promise<void> {
  return async (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_CHANGED }>): Promise<void> => {
    try {
      const { dialogueId, dialogue } = event.payload
      const debounceMs = options.debounceMs ?? 500
      
      // Clear existing debounce for this dialogue
      const existingTimeout = saveDebounceMap.get(dialogueId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      // If debouncing is disabled, save immediately
      if (debounceMs === 0) {
        await saveDialogue(dialogueId, dialogue, options)
        return
      }
      
      // Otherwise, debounce the save
      const timeout = setTimeout(async () => {
        saveDebounceMap.delete(dialogueId)
        await saveDialogue(dialogueId, dialogue, options)
      }, debounceMs)
      
      saveDebounceMap.set(dialogueId, timeout)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("Failed to save dialogue:", err)
        throw err
      }
    }
  }
}

async function saveDialogue(
  dialogueId: string,
  dialogue: unknown,
  options: DialogueChangedHandlerOptions
) {
  const dialogueTree = dialogue as ForgeGraph
  
  await options.updateMutation.mutateAsync({
    id: dialogueId,
    data: {
      tree: dialogueTree,
      startNodeId: dialogueTree.startNodeId,
      title: dialogueTree.title,
    },
  })
  
  if (options.onSaved) {
    await options.onSaved(dialogueTree)
  }
}
