"use client"

import type { DialogueForgeEvent } from "./events"

/**
 * Type-safe handler function for a specific event type.
 */
type EventHandler<Type extends DialogueForgeEvent["type"]> = (
  event: Extract<DialogueForgeEvent, { type: Type }>
) => void | Promise<void>

/**
 * Map of event types to their handler functions.
 */
type HandlerMap = {
  [Type in DialogueForgeEvent["type"]]?: EventHandler<Type>
}

/**
 * EventHandlerRegistry provides type-safe event handler registration and dispatching.
 * 
 * @example
 * ```typescript
 * const registry = new EventHandlerRegistry()
 * 
 * registry.register("ui.tabChanged", (event) => {
 *   console.log("Tab changed:", event.payload.tab)
 * })
 * 
 * registry.dispatch(createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" }))
 * ```
 */
export class EventHandlerRegistry {
  private handlers: HandlerMap = {}

  /**
   * Register a type-safe handler for a specific event type.
   * 
   * @param type - The event type to handle
   * @param handler - The handler function that receives the typed event
   * @throws Error if a handler is already registered for this type
   */
  register<Type extends DialogueForgeEvent["type"]>(
    type: Type,
    handler: EventHandler<Type>
  ): void {
    if (this.handlers[type]) {
      throw new Error(
        `Handler already registered for event type "${type}". Unregister the existing handler first.`
      )
    }
    this.handlers[type] = handler as HandlerMap[Type]
  }

  /**
   * Unregister a handler for a specific event type.
   * 
   * @param type - The event type to unregister
   * @returns true if a handler was removed, false if none was registered
   */
  unregister<Type extends DialogueForgeEvent["type"]>(type: Type): boolean {
    if (this.handlers[type]) {
      delete this.handlers[type]
      return true
    }
    return false
  }

  /**
   * Dispatch an event to its registered handler.
   * 
   * @param event - The event to dispatch
   * @returns Promise that resolves when the handler completes (or immediately if no handler)
   * @throws Error if the handler throws (errors are not caught to allow proper error handling)
   */
  async dispatch(event: DialogueForgeEvent): Promise<void> {
    const handler = this.handlers[event.type]
    if (handler) {
      // Type assertion is safe because we store handlers with matching types
      await (handler as (event: DialogueForgeEvent) => void | Promise<void>)(event)
    }
  }

  /**
   * Check if a handler is registered for a specific event type.
   * 
   * @param type - The event type to check
   * @returns true if a handler is registered, false otherwise
   */
  hasHandler<Type extends DialogueForgeEvent["type"]>(type: Type): boolean {
    return type in this.handlers && this.handlers[type] !== undefined
  }

  /**
   * Get all registered event types.
   * 
   * @returns Array of event types that have registered handlers
   */
  getRegisteredTypes(): DialogueForgeEvent["type"][] {
    return Object.keys(this.handlers) as DialogueForgeEvent["type"][]
  }

  /**
   * Clear all registered handlers.
   */
  clear(): void {
    this.handlers = {}
  }
}
