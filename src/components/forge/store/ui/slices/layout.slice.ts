import type { StateCreator } from "zustand"
import type { ForgeUIState } from "../createForgeUIStore"

export interface LayoutSlice {
  layout: {
    // Reserved for future split panes / dock layout
  }
}

export interface LayoutActions {
  // Reserved for future layout actions
}

export function createLayoutSlice(
  set: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[0],
  get: Parameters<StateCreator<ForgeUIState, [], [], ForgeUIState>>[1]
): LayoutSlice & LayoutActions {
  return {
    layout: {},
  }
}
