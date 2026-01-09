import { describe, it, expect } from "vitest"
import { createForgeUIStore } from "./forge-ui-store"
import { VIEW_MODE } from "@/src/types/constants"

describe("forge-ui-store", () => {
  it("initializes with provided narrative selection and defaults", () => {
    const store = createForgeUIStore({ actId: "a1", chapterId: "c1", pageId: "p1", storyletKey: undefined })
    const state = store.getState()
    expect(state.narrativeGraph.selection.pageId).toBe("p1")
    expect(state.narrativeGraph.viewMode).toBe(VIEW_MODE.GRAPH)
    expect(state.dialogueGraph.activeTab).toBe("page")
  })

  it("updates dialogue panel tab + IDs", () => {
    const store = createForgeUIStore({})
    store.getState().actions.setPageDialogueId("d_page")
    store.getState().actions.setStoryletDialogueId("d_storylet")
    store.getState().actions.setDialogueTab("storyletTemplate")
    const state = store.getState()
    expect(state.dialogueGraph.pageDialogueId).toBe("d_page")
    expect(state.dialogueGraph.storyletDialogueId).toBe("d_storylet")
    expect(state.dialogueGraph.activeTab).toBe("storyletTemplate")
  })
})

