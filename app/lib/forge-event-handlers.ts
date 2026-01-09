"use client"

import { useCallback, useRef, useEffect } from "react"
import { EventHandlerRegistry } from "@magicborn/dialogue-forge/src/components/forge/events/handlers"
import type { DialogueForgeEvent } from "@magicborn/dialogue-forge/src/components/forge/events/events"
import {
  createDialogueOpenRequestedHandler,
  createDialogueChangedHandler,
  createStoryletTemplateOpenRequestedHandler,
  createNarrativeSelectHandler,
  type DialogueOpenRequestedHandlerOptions,
  type DialogueChangedHandlerOptions,
  type StoryletTemplateOpenRequestedHandlerOptions,
  type NarrativeSelectHandlerOptions,
} from "./forge/handlers"
import {
  useDialogue,
  useUpdateDialogue,
  useStoryletTemplate,
  useAct,
  useChapter,
  usePage,
} from "./forge/queries"

/**
 * Type-safe handler function for a specific event type.
 */
type EventHandler<Type extends DialogueForgeEvent["type"]> = (
  event: Extract<DialogueForgeEvent, { type: Type }>
) => void | Promise<void>

/**
 * Map of event types to their handler functions.
 * All handlers are optional - only register handlers for events you want to handle.
 */
export type ForgeEventHandlerMap = {
  [Type in DialogueForgeEvent["type"]]?: EventHandler<Type>
}

/**
 * Result of creating forge event handlers.
 * Provides the registry and a dispatch function for manual event dispatching.
 */
export interface ForgeEventHandlers {
  /**
   * The event handler registry instance.
   * Can be used to manually register/unregister handlers or check registration status.
   */
  registry: EventHandlerRegistry

  /**
   * Dispatch an event to registered handlers.
   * This is the same as calling registry.dispatch(event).
   */
  dispatch: (event: DialogueForgeEvent) => Promise<void>

  /**
   * Callback function that can be passed to NarrativeWorkspace's onEvent prop.
   * This will dispatch events to all registered handlers.
   */
  onEvent: (event: DialogueForgeEvent) => void
}

/**
 * Create forge event handlers with type-safe handler registration.
 * 
 * @param handlers - Map of event types to their handler functions
 * @returns Object with registry, dispatch function, and onEvent callback
 * 
 * @example
 * ```typescript
 * const handlers = createForgeEventHandlers({
 *   'ui.tabChanged': (event) => {
 *     console.log('Tab changed:', event.payload.tab)
 *   },
 *   'dialogue.changed': async (event) => {
 *     await saveDialogue(event.payload.dialogueId, event.payload.dialogue)
 *   },
 * })
 * 
 * // Use in NarrativeWorkspace
 * <NarrativeWorkspace
 *   onEvent={handlers.onEvent}
 *   // ... other props
 * />
 * ```
 */
export function createForgeEventHandlers(
  handlers: ForgeEventHandlerMap
): ForgeEventHandlers {
  const registry = new EventHandlerRegistry()

  // Register all provided handlers
  for (const [type, handler] of Object.entries(handlers)) {
    if (handler) {
      registry.register(
        type as DialogueForgeEvent["type"],
        handler as EventHandler<DialogueForgeEvent["type"]>
      )
    }
  }

  const dispatch = async (event: DialogueForgeEvent): Promise<void> => {
    await registry.dispatch(event)
  }

  const onEvent = (event: DialogueForgeEvent): void => {
    // Dispatch synchronously but don't await (fire and forget)
    // This matches the NarrativeWorkspace onEvent signature
    void dispatch(event)
  }

  return {
    registry,
    dispatch,
    onEvent,
  }
}

/**
 * React hook for using forge event handlers in components.
 * 
 * Creates handlers on mount and cleans them up on unmount.
 * Returns an onEvent callback that can be passed to NarrativeWorkspace.
 * 
 * @param handlers - Map of event types to their handler functions
 * @returns onEvent callback for NarrativeWorkspace
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const onEvent = useForgeEventHandlers({
 *     'ui.tabChanged': (event) => {
 *       console.log('Tab changed:', event.payload.tab)
 *     },
 *     'dialogue.changed': async (event) => {
 *       await saveDialogue(event.payload.dialogueId, event.payload.dialogue)
 *     },
 *   })
 * 
 *   return (
 *     <NarrativeWorkspace
 *       onEvent={onEvent}
 *       // ... other props
 *     />
 *   )
 * }
 * ```
 */
export function useForgeEventHandlers(
  handlers: ForgeEventHandlerMap
): (event: DialogueForgeEvent) => void {
  // Use ref to store handlers so we can recreate registry when handlers change
  const handlersRef = useRef<ForgeEventHandlerMap>(handlers)
  handlersRef.current = handlers

  // Create registry instance that persists across renders
  const registryRef = useRef<EventHandlerRegistry | null>(null)
  if (!registryRef.current) {
    registryRef.current = new EventHandlerRegistry()
  }

  // Register/unregister handlers when they change
  useEffect(() => {
    const registry = registryRef.current
    if (!registry) return

    const currentHandlers = handlersRef.current

    // Register all current handlers
    for (const [type, handler] of Object.entries(currentHandlers)) {
      if (handler) {
        // Unregister existing handler first if any
        registry.unregister(type as DialogueForgeEvent["type"])
        // Register new handler
        registry.register(
          type as DialogueForgeEvent["type"],
          handler as EventHandler<DialogueForgeEvent["type"]>
        )
      }
    }

    // Cleanup: unregister all handlers on unmount
    return () => {
      if (registry) {
        const registeredTypes = registry.getRegisteredTypes()
        for (const type of registeredTypes) {
          registry.unregister(type)
        }
      }
    }
  }, []) // Empty deps - we use refs to access current handlers

  // Re-register handlers when handlers object reference changes
  // This allows handlers to be updated without recreating the hook
  useEffect(() => {
    const registry = registryRef.current
    if (!registry) return

    const currentHandlers = handlersRef.current

    // Get currently registered types
    const registeredTypes = registry.getRegisteredTypes()

    // Unregister handlers that are no longer in the map
    for (const type of registeredTypes) {
      if (!(type in currentHandlers) || !currentHandlers[type]) {
        registry.unregister(type)
      }
    }

    // Register/update handlers
    for (const [type, handler] of Object.entries(currentHandlers)) {
      if (handler) {
        registry.unregister(type as DialogueForgeEvent["type"])
        registry.register(
          type as DialogueForgeEvent["type"],
          handler as EventHandler<DialogueForgeEvent["type"]>
        )
      }
    }
  }, [handlers])

  // Create stable onEvent callback
  const onEvent = useCallback((event: DialogueForgeEvent): void => {
    const registry = registryRef.current
    if (registry) {
      // Dispatch synchronously but don't await (fire and forget)
      void registry.dispatch(event)
    }
  }, [])

  return onEvent
}

/**
 * Options for creating default event handlers with queries.
 */
export interface UseForgeEventHandlersWithDefaultsOptions {
  /**
   * Optional overrides for specific handlers.
   * Handlers not specified will use defaults with queries.
   */
  overrides?: Partial<ForgeEventHandlerMap>
  
  /**
   * Options for dialogue handlers.
   */
  dialogueOptions?: {
    openRequested?: Partial<DialogueOpenRequestedHandlerOptions>
    changed?: Partial<DialogueChangedHandlerOptions>
  }
  
  /**
   * Options for storylet template handlers.
   */
  storyletOptions?: {
    openRequested?: Partial<StoryletTemplateOpenRequestedHandlerOptions>
  }
  
  /**
   * Options for narrative select handlers.
   */
  narrativeOptions?: {
    select?: Partial<NarrativeSelectHandlerOptions>
  }
}

/**
 * React hook that creates forge event handlers with default PayloadCMS integration.
 * 
 * This hook automatically sets up handlers for all event types using React Query hooks.
 * You can override specific handlers by providing them in the `overrides` option.
 * 
 * @param options - Configuration options for handlers
 * @returns onEvent callback for NarrativeWorkspace
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const onEvent = useForgeEventHandlersWithDefaults({
 *     dialogueOptions: {
 *       changed: {
 *         debounceMs: 1000, // Custom debounce
 *         onSaved: (dialogue) => console.log('Saved:', dialogue.id),
 *       },
 *     },
 *     overrides: {
 *       'ui.tabChanged': (event) => {
 *         // Custom tab change handler
 *       },
 *     },
 *   })
 * 
 *   return (
 *     <NarrativeWorkspace
 *       onEvent={onEvent}
 *       // ... other props
 *     />
 *   )
 * }
 * ```
 */
export function useForgeEventHandlersWithDefaults(
  options: UseForgeEventHandlersWithDefaultsOptions = {}
): (event: DialogueForgeEvent) => void {
  const { overrides = {}, dialogueOptions = {}, storyletOptions = {}, narrativeOptions = {} } = options
  
  // Set up queries for handlers that need them
  // Note: These queries are created but may not be used if the handler fetches directly
  // They're available for handlers that want to use cached data
  
  // Set up mutations
  const updateDialogueMutation = useUpdateDialogue()
  
  // Create default handlers
  const dialogueOpenRequestedHandler: EventHandler<"dialogue.openRequested"> = async (event) => {
    await createDialogueOpenRequestedHandler({
      ...dialogueOptions.openRequested,
    })(event)
  }
  
  const dialogueChangedHandler: EventHandler<"dialogue.changed"> = async (event) => {
    await createDialogueChangedHandler({
      updateMutation: updateDialogueMutation,
      ...dialogueOptions.changed,
    })(event)
  }
  
  const storyletTemplateOpenRequestedHandler: EventHandler<"storyletTemplate.openRequested"> = async (event) => {
    await createStoryletTemplateOpenRequestedHandler({
      ...storyletOptions.openRequested,
    })(event)
  }
  
  const narrativeSelectHandler: EventHandler<"narrative.select"> = async (event) => {
    await createNarrativeSelectHandler({
      ...narrativeOptions.select,
    })(event)
  }
  
  // Combine default handlers with overrides
  const handlers: ForgeEventHandlerMap = {
    'dialogue.openRequested': dialogueOpenRequestedHandler,
    'dialogue.changed': dialogueChangedHandler,
    'storyletTemplate.openRequested': storyletTemplateOpenRequestedHandler,
    'narrative.select': narrativeSelectHandler,
    // Apply overrides (they take precedence)
    ...overrides,
  }
  
  return useForgeEventHandlers(handlers)
}
