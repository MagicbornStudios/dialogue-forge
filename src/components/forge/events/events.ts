"use client"

import { DIALOGUE_FORGE_EVENT_TYPE, DIALOGUE_PANEL_TAB, DIALOGUE_OPEN_REASON } from "../../../types/constants"
import { NARRATIVE_ELEMENT } from "../../../types/narrative"

export type DialogueForgeEventV1<Type extends string = string, Payload = unknown> = {
  version: 1
  id: string
  ts: number
  type: Type
  payload: Payload
}

export type DialogueForgeEvent =
  | DialogueForgeEventV1<
      typeof DIALOGUE_FORGE_EVENT_TYPE.UI_TAB_CHANGED,
      { scope: "dialoguePanel"; tab: typeof DIALOGUE_PANEL_TAB.PAGE | typeof DIALOGUE_PANEL_TAB.STORYLET_TEMPLATE }
    >
  | DialogueForgeEventV1<
      typeof DIALOGUE_FORGE_EVENT_TYPE.NARRATIVE_SELECT,
      { elementType: typeof NARRATIVE_ELEMENT.ACT | typeof NARRATIVE_ELEMENT.CHAPTER | typeof NARRATIVE_ELEMENT.PAGE; elementId: string }
    >
  | DialogueForgeEventV1<
      typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_OPEN_REQUESTED,
      { dialogueId: string; reason: typeof DIALOGUE_OPEN_REASON.PAGE | typeof DIALOGUE_OPEN_REASON.STORYLET_TEMPLATE }
    >
  | DialogueForgeEventV1<
      typeof DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_CHANGED,
      { dialogueId: string; dialogue: unknown; reason: "edit" }
    >
  | DialogueForgeEventV1<
      typeof DIALOGUE_FORGE_EVENT_TYPE.STORYLET_TEMPLATE_OPEN_REQUESTED,
      { templateId: string; dialogueId: string }
    >

function safeRandomId(): string {
  // browser + node (Next) compatibility
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    // ignore
  }
  return `evt_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export function createEvent<Type extends DialogueForgeEvent["type"]>(
  type: Type,
  payload: Extract<DialogueForgeEvent, { type: Type }>["payload"]
): Extract<DialogueForgeEvent, { type: Type }> {
  return {
    version: 1,
    id: safeRandomId(),
    ts: Date.now(),
    type,
    payload,
  } as Extract<DialogueForgeEvent, { type: Type }>
}

