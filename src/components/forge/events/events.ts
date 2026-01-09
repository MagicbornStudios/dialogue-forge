"use client"

export type DialogueForgeEventV1<Type extends string = string, Payload = unknown> = {
  version: 1
  id: string
  ts: number
  type: Type
  payload: Payload
}

export type DialogueForgeEvent =
  | DialogueForgeEventV1<
      "ui.tabChanged",
      { scope: "dialoguePanel"; tab: "page" | "storyletTemplate" }
    >
  | DialogueForgeEventV1<
      "narrative.select",
      { elementType: "act" | "chapter" | "page"; elementId: string }
    >
  | DialogueForgeEventV1<
      "dialogue.openRequested",
      { dialogueId: string; reason: "page" | "storyletTemplate" }
    >
  | DialogueForgeEventV1<
      "dialogue.changed",
      { dialogueId: string; dialogue: unknown; reason: "edit" }
    >
  | DialogueForgeEventV1<
      "storyletTemplate.openRequested",
      { templateId: string; dialogueId: string }
    >

function safeRandomId(): string {
  // browser + node (Next) compatibility
  try {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-expect-error: TS lib mismatch depending on runtime
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

