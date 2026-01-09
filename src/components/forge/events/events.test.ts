import { describe, it, expect } from "vitest"
import { createEvent } from "./events"

describe("createEvent", () => {
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

