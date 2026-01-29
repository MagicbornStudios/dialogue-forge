"use client"

import * as React from "react"
import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import type { StoreApi } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { createProjectSlice, type ProjectSlice, type ProjectActions } from "./slices/project.slice"
import { createCharactersSlice, type CharactersSlice, type CharactersActions } from "./slices/characters.slice"
import { createViewStateSlice, type ViewStateSlice, type ViewStateActions } from "./slices/viewState.slice"
import type { CharacterWorkspaceAdapter } from "@/characters/types"

export interface CharacterWorkspaceState
  extends ProjectSlice,
    CharactersSlice,
    ViewStateSlice {
  // Data adapter
  dataAdapter?: CharacterWorkspaceAdapter

  actions: {
    // Project actions
    setActiveProjectId: ProjectActions['setActiveProjectId']
    setProjects: ProjectActions['setProjects']
    
    // Character actions
    setCharacters: CharactersActions['setCharacters']
    setActiveCharacterId: CharactersActions['setActiveCharacterId']
    upsertCharacter: CharactersActions['upsertCharacter']
    removeCharacter: CharactersActions['removeCharacter']
    updateCharacterField: CharactersActions['updateCharacterField']
    
    // Graph mutation actions
    addNodeToActiveGraph: CharactersActions['addNodeToActiveGraph']
    moveNodeInActiveGraph: CharactersActions['moveNodeInActiveGraph']
    removeNodeFromActiveGraph: CharactersActions['removeNodeFromActiveGraph']
    addEdgeToActiveGraph: CharactersActions['addEdgeToActiveGraph']
    updateEdgeLabelInActiveGraph: CharactersActions['updateEdgeLabelInActiveGraph']
    removeEdgeFromActiveGraph: CharactersActions['removeEdgeFromActiveGraph']
    setActiveGraphFlow: CharactersActions['setActiveGraphFlow']
    
    // View state actions
    setToolMode: ViewStateActions['setToolMode']
    setSidebarSearchQuery: ViewStateActions['setSidebarSearchQuery']
    setShowLabels: ViewStateActions['setShowLabels']
    setSelectedCharacterId: ViewStateActions['setSelectedCharacterId']
  }
}

export interface CreateCharacterWorkspaceStoreOptions {
  dataAdapter?: CharacterWorkspaceAdapter
}

export function createCharacterWorkspaceStore(
  options: CreateCharacterWorkspaceStoreOptions = {}
): StoreApi<CharacterWorkspaceState> {
  const { dataAdapter } = options

  return createStore<CharacterWorkspaceState>()(
    devtools(
      immer((set, get) => {
        const projectSlice = createProjectSlice(set, get)
        const charactersSlice = createCharactersSlice(set, get)
        const viewStateSlice = createViewStateSlice(set, get)

        return {
          ...projectSlice,
          ...charactersSlice,
          ...viewStateSlice,
          dataAdapter,
          actions: {
            // Project actions
            setActiveProjectId: projectSlice.setActiveProjectId,
            setProjects: projectSlice.setProjects,
            
            // Character actions
            setCharacters: charactersSlice.setCharacters,
            setActiveCharacterId: charactersSlice.setActiveCharacterId,
            upsertCharacter: charactersSlice.upsertCharacter,
            removeCharacter: charactersSlice.removeCharacter,
            updateCharacterField: charactersSlice.updateCharacterField,
            
            // Graph mutation actions
            addNodeToActiveGraph: charactersSlice.addNodeToActiveGraph,
            moveNodeInActiveGraph: charactersSlice.moveNodeInActiveGraph,
            removeNodeFromActiveGraph: charactersSlice.removeNodeFromActiveGraph,
            addEdgeToActiveGraph: charactersSlice.addEdgeToActiveGraph,
            updateEdgeLabelInActiveGraph: charactersSlice.updateEdgeLabelInActiveGraph,
            removeEdgeFromActiveGraph: charactersSlice.removeEdgeFromActiveGraph,
            setActiveGraphFlow: charactersSlice.setActiveGraphFlow,
            
            // View state actions
            setToolMode: viewStateSlice.setToolMode,
            setSidebarSearchQuery: viewStateSlice.setSidebarSearchQuery,
            setShowLabels: viewStateSlice.setShowLabels,
            setSelectedCharacterId: viewStateSlice.setSelectedCharacterId,
          },
        }
      }),
      { name: "CharacterWorkspaceStore" }
    )
  )
}

export type CharacterWorkspaceStore = ReturnType<typeof createCharacterWorkspaceStore>

const CharacterWorkspaceStoreContext = createContext<CharacterWorkspaceStore | null>(null)

export function CharacterWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: CharacterWorkspaceStore }>) {
  return (
    <CharacterWorkspaceStoreContext.Provider value={store}>
      {children}
    </CharacterWorkspaceStoreContext.Provider>
  )
}

export function useCharacterWorkspaceStore<T>(
  selector: (state: CharacterWorkspaceState) => T
): T {
  const store = useContext(CharacterWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useCharacterWorkspaceStore must be used within CharacterWorkspaceStoreProvider"
    )
  }
  
  // Cache the server snapshot value to avoid infinite loops in React 19
  // This is only used during SSR, but React 19 requires it to be stable
  // We cache it once and never update it, ensuring getServerSnapshot always returns the same value
  const serverSnapshotRef = React.useRef<{ value: T } | null>(null)
  if (serverSnapshotRef.current === null) {
    const initialValue = selector(store.getState())
    serverSnapshotRef.current = { value: initialValue }
  }
  
  const getServerSnapshot = React.useCallback(() => {
    // Always return the cached initial value - this is stable and prevents infinite loops
    return serverSnapshotRef.current!.value
  }, [])
  
  return useStore(store, selector, getServerSnapshot)
}

export function useCharacterWorkspaceStoreInstance(): CharacterWorkspaceStore {
  const store = useContext(CharacterWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useCharacterWorkspaceStoreInstance must be used within CharacterWorkspaceStoreProvider"
    )
  }
  return store
}
