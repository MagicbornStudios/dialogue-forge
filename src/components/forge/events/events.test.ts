import { describe, it, expect } from "vitest"
import { createEvent, type DialogueForgeEvent } from "./events"

describe("createEvent", () => {
  describe("event envelope structure", () => {
    it("creates a v1 event envelope", () => {
      const evt = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(evt.id.length).toBeGreaterThan(0)
      expect(typeof evt.ts).toBe("number")
      expect(evt.type).toBe("ui.tabChanged")
      expect(evt.payload).toEqual({ scope: "dialoguePanel", tab: "page" })
    })
  })

  describe("all event types", () => {
    it("creates ui.tabChanged event", () => {
      const evt = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      expect(evt.type).toBe("ui.tabChanged")
      expect(evt.payload).toEqual({ scope: "dialoguePanel", tab: "page" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(typeof evt.ts).toBe("number")

      const evt2 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "storyletTemplate" })
      expect(evt2.type).toBe("ui.tabChanged")
      expect(evt2.payload).toEqual({ scope: "dialoguePanel", tab: "storyletTemplate" })
    })

    it("creates narrative.select event", () => {
      const evt = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })
      expect(evt.type).toBe("narrative.select")
      expect(evt.payload).toEqual({ elementType: "act", elementId: "act_1" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(typeof evt.ts).toBe("number")

      const evt2 = createEvent("narrative.select", { elementType: "chapter", elementId: "chapter_1" })
      expect(evt2.payload).toEqual({ elementType: "chapter", elementId: "chapter_1" })

      const evt3 = createEvent("narrative.select", { elementType: "page", elementId: "page_1" })
      expect(evt3.payload).toEqual({ elementType: "page", elementId: "page_1" })
    })

    it("creates dialogue.openRequested event", () => {
      const evt = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })
      expect(evt.type).toBe("dialogue.openRequested")
      expect(evt.payload).toEqual({ dialogueId: "dialogue_1", reason: "page" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(typeof evt.ts).toBe("number")

      const evt2 = createEvent("dialogue.openRequested", { dialogueId: "dialogue_2", reason: "storyletTemplate" })
      expect(evt2.payload).toEqual({ dialogueId: "dialogue_2", reason: "storyletTemplate" })
    })

    it("creates dialogue.changed event", () => {
      const mockDialogue = { id: "dialogue_1", title: "Test Dialogue", nodes: {} }
      const evt = createEvent("dialogue.changed", { dialogueId: "dialogue_1", dialogue: mockDialogue, reason: "edit" })
      expect(evt.type).toBe("dialogue.changed")
      expect(evt.payload).toEqual({ dialogueId: "dialogue_1", dialogue: mockDialogue, reason: "edit" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(typeof evt.ts).toBe("number")
    })

    it("creates storyletTemplate.openRequested event", () => {
      const evt = createEvent("storyletTemplate.openRequested", { templateId: "template_1", dialogueId: "dialogue_1" })
      expect(evt.type).toBe("storyletTemplate.openRequested")
      expect(evt.payload).toEqual({ templateId: "template_1", dialogueId: "dialogue_1" })
      expect(evt.version).toBe(1)
      expect(typeof evt.id).toBe("string")
      expect(typeof evt.ts).toBe("number")
    })
  })

  describe("event ID uniqueness", () => {
    it("generates unique IDs for multiple events", () => {
      const events: DialogueForgeEvent[] = []
      for (let i = 0; i < 100; i++) {
        events.push(createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" }))
      }

      const ids = events.map(e => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(100)
      expect(ids.length).toBe(100)
    })

    it("generates unique IDs across different event types", () => {
      const evt1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const evt2 = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })
      const evt3 = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })
      const evt4 = createEvent("dialogue.changed", { dialogueId: "dialogue_1", dialogue: {}, reason: "edit" })
      const evt5 = createEvent("storyletTemplate.openRequested", { templateId: "template_1", dialogueId: "dialogue_1" })

      const ids = [evt1.id, evt2.id, evt3.id, evt4.id, evt5.id]
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })
  })

  describe("timestamp ordering", () => {
    it("generates timestamps in chronological order", () => {
      const evt1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const evt2 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const evt3 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })

      expect(evt1.ts).toBeLessThanOrEqual(evt2.ts)
      expect(evt2.ts).toBeLessThanOrEqual(evt3.ts)
    })

    it("generates timestamps close to Date.now()", () => {
      const before = Date.now()
      const evt = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const after = Date.now()

      expect(evt.ts).toBeGreaterThanOrEqual(before)
      expect(evt.ts).toBeLessThanOrEqual(after)
    })

    it("maintains timestamp ordering across different event types", () => {
      const evt1 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      const evt2 = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })
      const evt3 = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })

      expect(evt1.ts).toBeLessThanOrEqual(evt2.ts)
      expect(evt2.ts).toBeLessThanOrEqual(evt3.ts)
    })
  })

  describe("payload type safety", () => {
    it("enforces correct payload types for ui.tabChanged", () => {
      const evt = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "page" })
      expect(evt.payload.scope).toBe("dialoguePanel")
      expect(evt.payload.tab).toBe("page")

      const evt2 = createEvent("ui.tabChanged", { scope: "dialoguePanel", tab: "storyletTemplate" })
      expect(evt2.payload.tab).toBe("storyletTemplate")
    })

    it("enforces correct payload types for narrative.select", () => {
      const evt = createEvent("narrative.select", { elementType: "act", elementId: "act_1" })
      expect(evt.payload.elementType).toBe("act")
      expect(evt.payload.elementId).toBe("act_1")

      const evt2 = createEvent("narrative.select", { elementType: "chapter", elementId: "chapter_1" })
      expect(evt2.payload.elementType).toBe("chapter")

      const evt3 = createEvent("narrative.select", { elementType: "page", elementId: "page_1" })
      expect(evt3.payload.elementType).toBe("page")
    })

    it("enforces correct payload types for dialogue.openRequested", () => {
      const evt = createEvent("dialogue.openRequested", { dialogueId: "dialogue_1", reason: "page" })
      expect(evt.payload.dialogueId).toBe("dialogue_1")
      expect(evt.payload.reason).toBe("page")

      const evt2 = createEvent("dialogue.openRequested", { dialogueId: "dialogue_2", reason: "storyletTemplate" })
      expect(evt2.payload.reason).toBe("storyletTemplate")
    })

    it("enforces correct payload types for dialogue.changed", () => {
      const mockDialogue = { id: "dialogue_1", title: "Test", nodes: {} }
      const evt = createEvent("dialogue.changed", { dialogueId: "dialogue_1", dialogue: mockDialogue, reason: "edit" })
      expect(evt.payload.dialogueId).toBe("dialogue_1")
      expect(evt.payload.dialogue).toEqual(mockDialogue)
      expect(evt.payload.reason).toBe("edit")
    })

    it("enforces correct payload types for storyletTemplate.openRequested", () => {
      const evt = createEvent("storyletTemplate.openRequested", { templateId: "template_1", dialogueId: "dialogue_1" })
      expect(evt.payload.templateId).toBe("template_1")
      expect(evt.payload.dialogueId).toBe("dialogue_1")
    })
  })
})

