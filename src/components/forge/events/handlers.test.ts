import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventHandlerRegistry } from "./handlers"
import { createEvent, type DialogueForgeEvent } from "./events"

describe("EventHandlerRegistry", () => {
  let registry: EventHandlerRegistry

  beforeEach(() => {
    registry = new EventHandlerRegistry()
  })

  describe("handler registration", () => {
    it("registers a handler for an event type", () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
    })

    it("throws error when registering duplicate handler", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      
      registry.register("ui.tabChanged", handler1)
      
      expect(() => {
        registry.register("ui.tabChanged", handler2)
      }).toThrow('Handler already registered for event type "ui.tabChanged"')
    })

    it("allows registering handlers for different event types", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)
      registry.register("dialogue.openRequested", handler3)

      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
      expect(registry.hasHandler("narrative.select")).toBe(true)
      expect(registry.hasHandler("dialogue.openRequested")).toBe(true)
    })

    it("registers all event types", () => {
      const handlers = {
        "ui.tabChanged": vi.fn(),
        "narrative.select": vi.fn(),
        "dialogue.openRequested": vi.fn(),
        "dialogue.changed": vi.fn(),
        "storyletTemplate.openRequested": vi.fn(),
      }

      registry.register("ui.tabChanged", handlers["ui.tabChanged"])
      registry.register("narrative.select", handlers["narrative.select"])
      registry.register("dialogue.openRequested", handlers["dialogue.openRequested"])
      registry.register("dialogue.changed", handlers["dialogue.changed"])
      registry.register("storyletTemplate.openRequested", handlers["storyletTemplate.openRequested"])

      expect(registry.getRegisteredTypes()).toHaveLength(5)
      expect(registry.getRegisteredTypes()).toContain("ui.tabChanged")
      expect(registry.getRegisteredTypes()).toContain("narrative.select")
      expect(registry.getRegisteredTypes()).toContain("dialogue.openRequested")
      expect(registry.getRegisteredTypes()).toContain("dialogue.changed")
      expect(registry.getRegisteredTypes()).toContain("storyletTemplate.openRequested")
    })
  })

  describe("handler dispatching", () => {
    it("dispatches event to registered handler", async () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it("does nothing when dispatching to unregistered handler", async () => {
      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      
      // Should not throw
      await expect(registry.dispatch(event)).resolves.toBeUndefined()
    })

    it("passes correct event payload to handler", async () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ui.tabChanged",
          payload: { scope: "dialoguePanel", tab: "page" },
        })
      )
    })

    it("handles async handlers", async () => {
      const handler = vi.fn().mockResolvedValue(undefined)
      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("dispatches to correct handler based on event type", async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)
      registry.register("dialogue.openRequested", handler3)

      const event1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const event2 = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })
      const event3 = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })

      await registry.dispatch(event1)
      await registry.dispatch(event2)
      await registry.dispatch(event3)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler1).toHaveBeenCalledWith(event1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledWith(event2)
      expect(handler3).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledWith(event3)
    })

    it("dispatches all event types correctly", async () => {
      const handlers = {
        "ui.tabChanged": vi.fn(),
        "narrative.select": vi.fn(),
        "dialogue.openRequested": vi.fn(),
        "dialogue.changed": vi.fn(),
        "storyletTemplate.openRequested": vi.fn(),
      }

      registry.register("ui.tabChanged", handlers["ui.tabChanged"])
      registry.register("narrative.select", handlers["narrative.select"])
      registry.register("dialogue.openRequested", handlers["dialogue.openRequested"])
      registry.register("dialogue.changed", handlers["dialogue.changed"])
      registry.register("storyletTemplate.openRequested", handlers["storyletTemplate.openRequested"])

      const events = [
        createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" }),
        createEvent("narrative.select", { elementType: "act", elementId: "act_1" }),
        createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" }),
        createEvent("dialogue.changed", { dialogueId: "dialogue_1", dialogue: {}, reason: "edit" }),
        createEvent("storyletTemplate.openRequested", { templateId: "template_1", dialogueId: "dialogue_1" }),
      ]

      for (const event of events) {
        await registry.dispatch(event)
      }

      expect(handlers["ui.tabChanged"]).toHaveBeenCalledTimes(1)
      expect(handlers["narrative.select"]).toHaveBeenCalledTimes(1)
      expect(handlers["dialogue.openRequested"]).toHaveBeenCalledTimes(1)
      expect(handlers["dialogue.changed"]).toHaveBeenCalledTimes(1)
      expect(handlers["storyletTemplate.openRequested"]).toHaveBeenCalledTimes(1)
    })
  })

  describe("event routing", () => {
    it("routes events to correct handlers", async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)

      const event1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const event2 = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })

      await registry.dispatch(event1)
      await registry.dispatch(event2)

      expect(handler1).toHaveBeenCalledWith(event1)
      expect(handler1).not.toHaveBeenCalledWith(event2)
      expect(handler2).toHaveBeenCalledWith(event2)
      expect(handler2).not.toHaveBeenCalledWith(event1)
    })

    it("handles multiple dispatches to same handler", async () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)

      const event1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const event2 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "storyletTemplate" })
      const event3 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })

      await registry.dispatch(event1)
      await registry.dispatch(event2)
      await registry.dispatch(event3)

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, event1)
      expect(handler).toHaveBeenNthCalledWith(2, event2)
      expect(handler).toHaveBeenNthCalledWith(3, event3)
    })

    it("maintains handler isolation", async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)

      const event1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const event2 = createEvent("narrative.select", { elementType: "chapter", elementId: "chapter_1" })

      await registry.dispatch(event1)
      await registry.dispatch(event2)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe("handler error handling", () => {
    it("propagates synchronous errors from handlers", async () => {
      const error = new Error("Handler error")
      const handler = vi.fn().mockImplementation(() => {
        throw error
      })

      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })

      await expect(registry.dispatch(event)).rejects.toThrow("Handler error")
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("propagates async errors from handlers", async () => {
      const error = new Error("Async handler error")
      const handler = vi.fn().mockRejectedValue(error)

      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })

      await expect(registry.dispatch(event)).rejects.toThrow("Async handler error")
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("errors in one handler do not affect others", async () => {
      const error = new Error("Handler error")
      const handler1 = vi.fn().mockImplementation(() => {
        throw error
      })
      const handler2 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)

      const event1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const event2 = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })

      await expect(registry.dispatch(event1)).rejects.toThrow("Handler error")
      await registry.dispatch(event2)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledWith(event2)
    })
  })

  describe("unregister", () => {
    it("unregisters an existing handler", () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)

      expect(registry.hasHandler("ui.tabChanged")).toBe(true)

      const result = registry.unregister("ui.tabChanged")

      expect(result).toBe(true)
      expect(registry.hasHandler("ui.tabChanged")).toBe(false)
    })

    it("returns false when unregistering non-existent handler", () => {
      const result = registry.unregister("ui.tabChanged")
      expect(result).toBe(false)
    })

    it("allows re-registering after unregistering", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.unregister("ui.tabChanged")
      registry.register("ui.tabChanged", handler2)

      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
    })

    it("does not dispatch to unregistered handler", async () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      registry.unregister("ui.tabChanged")

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it("unregisters specific handler without affecting others", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      registry.register("ui.tabChanged", handler1)
      registry.register("narrative.select", handler2)
      registry.register("dialogue.openRequested", handler3)

      registry.unregister("narrative.select")

      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
      expect(registry.hasHandler("narrative.select")).toBe(false)
      expect(registry.hasHandler("dialogue.openRequested")).toBe(true)
    })
  })

  describe("hasHandler", () => {
    it("returns true for registered handler", () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
    })

    it("returns false for unregistered handler", () => {
      expect(registry.hasHandler("ui.tabChanged")).toBe(false)
    })

    it("returns false after unregistering", () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      registry.unregister("ui.tabChanged")
      expect(registry.hasHandler("ui.tabChanged")).toBe(false)
    })

    it("returns false after clearing", () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      registry.clear()
      expect(registry.hasHandler("ui.tabChanged")).toBe(false)
    })
  })

  describe("getRegisteredTypes", () => {
    it("returns empty array when no handlers registered", () => {
      expect(registry.getRegisteredTypes()).toEqual([])
    })

    it("returns array of registered event types", () => {
      registry.register("ui.tabChanged", vi.fn())
      registry.register("narrative.select", vi.fn())

      const types = registry.getRegisteredTypes()
      expect(types).toHaveLength(2)
      expect(types).toContain("ui.tabChanged")
      expect(types).toContain("narrative.select")
    })

    it("updates when handlers are unregistered", () => {
      registry.register("ui.tabChanged", vi.fn())
      registry.register("narrative.select", vi.fn())
      registry.register("dialogue.openRequested", vi.fn())

      registry.unregister("narrative.select")

      const types = registry.getRegisteredTypes()
      expect(types).toHaveLength(2)
      expect(types).toContain("ui.tabChanged")
      expect(types).not.toContain("narrative.select")
      expect(types).toContain("dialogue.openRequested")
    })

    it("returns empty array after clearing", () => {
      registry.register("ui.tabChanged", vi.fn())
      registry.register("narrative.select", vi.fn())
      registry.clear()

      expect(registry.getRegisteredTypes()).toEqual([])
    })
  })

  describe("clear", () => {
    it("clears all registered handlers", () => {
      registry.register("ui.tabChanged", vi.fn())
      registry.register("narrative.select", vi.fn())
      registry.register("dialogue.openRequested", vi.fn())

      registry.clear()

      expect(registry.getRegisteredTypes()).toEqual([])
      expect(registry.hasHandler("ui.tabChanged")).toBe(false)
      expect(registry.hasHandler("narrative.select")).toBe(false)
      expect(registry.hasHandler("dialogue.openRequested")).toBe(false)
    })

    it("does not dispatch after clearing", async () => {
      const handler = vi.fn()
      registry.register("ui.tabChanged", handler)
      registry.clear()

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it("allows re-registering after clearing", () => {
      registry.register("ui.tabChanged", vi.fn())
      registry.clear()
      registry.register("ui.tabChanged", vi.fn())

      expect(registry.hasHandler("ui.tabChanged")).toBe(true)
    })
  })

  describe("type safety", () => {
    it("handlers receive correctly typed events", async () => {
      const handler = vi.fn<[DialogueForgeEvent & { type: "ui.tabChanged" }], void>()
      registry.register("ui.tabChanged", handler)

      const event = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      await registry.dispatch(event)

      expect(handler).toHaveBeenCalledWith(event)
      const calledEvent = handler.mock.calls[0][0]
      expect(calledEvent.type).toBe("ui.tabChanged")
      expect(calledEvent.payload.scope).toBe("dialoguePanel")
      expect(calledEvent.payload.tab).toBe("page")
    })

    it("handlers receive correct payload types for all event types", async () => {
      const narrativeHandler = vi.fn()
      const dialogueOpenHandler = vi.fn()
      const dialogueChangedHandler = vi.fn()
      const storyletHandler = vi.fn()

      registry.register("narrative.select", narrativeHandler)
      registry.register("dialogue.openRequested", dialogueOpenHandler)
      registry.register("dialogue.changed", dialogueChangedHandler)
      registry.register("storyletTemplate.openRequested", storyletHandler)

      const narrativeEvent = createEvent("narrative.select", { elementType: "page", elementId: "page_1" })
      const dialogueOpenEvent = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })
      const dialogueChangedEvent = createEvent("dialogue.changed", { dialogueId: "dialogue_1", dialogue: { id: "dialogue_1" }, reason: "edit" })
      const storyletEvent = createEvent("storyletTemplate.openRequested", { templateId: "template_1", dialogueId: "dialogue_1" })

      await registry.dispatch(narrativeEvent)
      await registry.dispatch(dialogueOpenEvent)
      await registry.dispatch(dialogueChangedEvent)
      await registry.dispatch(storyletEvent)

      expect(narrativeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "narrative.select",
          payload: { elementType: "page", elementId: "page_1" },
        })
      )

      expect(dialogueOpenHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "dialogue.openRequested",
          payload: { dialogueId: "dialogue_1", reason: "page" },
        })
      )

      expect(dialogueChangedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "dialogue.changed",
          payload: { dialogueId: "dialogue_1", dialogue: { id: "dialogue_1" }, reason: "edit" },
        })
      )

      expect(storyletHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "storyletTemplate.openRequested",
          payload: { templateId: "template_1", dialogueId: "dialogue_1" },
        })
      )
    })
  })
})
