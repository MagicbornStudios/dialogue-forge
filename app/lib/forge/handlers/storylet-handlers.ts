"use client"

import type { DialogueForgeEvent } from "@magicborn/dialogue-forge/src/components/forge/events/events"
import { DIALOGUE_FORGE_EVENT_TYPE } from "@magicborn/dialogue-forge/src/types/constants"
import type { UseQueryResult } from "@tanstack/react-query"
import { getPayloadClient } from "../payload-client"
import { PAYLOAD_COLLECTIONS } from "@/app/payload-collections/enums"
import type { StoryletTemplateDocument } from "../queries"

/**
 * Handler for storyletTemplate.openRequested event.
 * Fetches a storylet template from PayloadCMS with its dialogue.
 */
export interface StoryletTemplateOpenRequestedHandlerOptions {
  /**
   * Optional query hook result. If provided, will use the query data.
   * Otherwise, will fetch directly.
   */
  query?: UseQueryResult<StoryletTemplateDocument, Error>
  
  /**
   * Optional callback to handle the fetched template.
   */
  onTemplateLoaded?: (template: StoryletTemplateDocument) => void | Promise<void>
  
  /**
   * Optional error handler.
   */
  onError?: (error: Error) => void
}

export function createStoryletTemplateOpenRequestedHandler(
  options: StoryletTemplateOpenRequestedHandlerOptions = {}
): (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.STORYLET_TEMPLATE_OPEN_REQUESTED }>) => Promise<void> {
  return async (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.STORYLET_TEMPLATE_OPEN_REQUESTED }>): Promise<void> => {
    try {
      const payload = event.payload as { templateId: string; dialogueId: string }
      const { templateId } = payload
      
      // If query is provided and has data, use it
      if (options.query?.data) {
        if (options.onTemplateLoaded) {
          await options.onTemplateLoaded(options.query.data)
        }
        return
      }
      
      // Otherwise, fetch directly
      const client = getPayloadClient()
      const template = await client.findByID<StoryletTemplateDocument>(
        PAYLOAD_COLLECTIONS.STORYLET_TEMPLATES,
        templateId,
        { depth: 2 } // Include dialogue relationship
      )
      
      if (options.onTemplateLoaded) {
        await options.onTemplateLoaded(template)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("Failed to open storylet template:", err)
        throw err
      }
    }
  }
}
