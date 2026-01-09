"use client"

import type { DialogueForgeEvent } from "@magicborn/dialogue-forge/src/components/forge/events/events"
import { DIALOGUE_FORGE_EVENT_TYPE } from "@magicborn/dialogue-forge/src/types/constants"
import { NARRATIVE_ELEMENT } from "@magicborn/dialogue-forge/src/types/narrative"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ActDocument, ChapterDocument, PageDocument } from "../queries"

/**
 * Handler for narrative.select event.
 * Fetches the selected narrative element (act, chapter, or page).
 */
export interface NarrativeSelectHandlerOptions {
  /**
   * Optional query hooks for fetching elements.
   */
  queries?: {
    act?: UseQueryResult<ActDocument, Error>
    chapter?: UseQueryResult<ChapterDocument, Error>
    page?: UseQueryResult<PageDocument, Error>
  }
  
  /**
   * Optional callback to handle the selected element.
   */
  onElementSelected?: (element: ActDocument | ChapterDocument | PageDocument) => void | Promise<void>
  
  /**
   * Optional error handler.
   */
  onError?: (error: Error) => void
}

export function createNarrativeSelectHandler(
  options: NarrativeSelectHandlerOptions = {}
): (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.NARRATIVE_SELECT }>) => Promise<void> {
  return async (event: Extract<DialogueForgeEvent, { type: typeof DIALOGUE_FORGE_EVENT_TYPE.NARRATIVE_SELECT }>): Promise<void> => {
    try {
      const payload = event.payload as { elementType: typeof NARRATIVE_ELEMENT.ACT | typeof NARRATIVE_ELEMENT.CHAPTER | typeof NARRATIVE_ELEMENT.PAGE; elementId: string }
      const { elementType, elementId } = payload
      
      // Try to use query data if available
      let element: ActDocument | ChapterDocument | PageDocument | undefined
      
      if (elementType === NARRATIVE_ELEMENT.ACT && options.queries?.act?.data) {
        element = options.queries.act.data
      } else if (elementType === NARRATIVE_ELEMENT.CHAPTER && options.queries?.chapter?.data) {
        element = options.queries.chapter.data
      } else if (elementType === NARRATIVE_ELEMENT.PAGE && options.queries?.page?.data) {
        element = options.queries.page.data
      }
      
      // If we have the element from queries, use it
      if (element && options.onElementSelected) {
        await options.onElementSelected(element)
      }
      
      // Otherwise, the handler just acknowledges the selection
      // The actual fetching can be done by the component using the queries
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("Failed to handle narrative selection:", err)
        throw err
      }
    }
  }
}
