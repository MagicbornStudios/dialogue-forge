"use client"

import { FORGE_EVENT_TYPE, ForgeEventType, GraphChangeReason, GraphScope } from "../types/constants"
import { ForgeGraphDoc } from "../types"

export type ForgeEventTemplate<Type extends ForgeEventType = ForgeEventType, Payload = unknown> = {
  version: 1
  id: string
  ts: number
  type: Type
  payload: Payload
}

export type ForgeEvent =
  | ForgeEventTemplate<
      typeof FORGE_EVENT_TYPE.GRAPH_CHANGED,
      { graphId: string; graph: ForgeGraphDoc; reason: GraphChangeReason; scope: GraphScope }
    >
  | ForgeEventTemplate<
      typeof FORGE_EVENT_TYPE.GRAPH_OPEN_REQUESTED,
      { graphId: string; reason: GraphChangeReason; scope: GraphScope }
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

export function createEvent<Type extends ForgeEvent["type"]>(
  type: Type,
  payload: Extract<ForgeEvent, { type: Type }>["payload"]
): Extract<ForgeEvent, { type: Type }> {
  return {
    version: 1,
    id: safeRandomId(),
    ts: Date.now(),
    type,
    payload,
  } as Extract<ForgeEvent, { type: Type }>
}

