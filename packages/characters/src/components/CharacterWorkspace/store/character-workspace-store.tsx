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
import type { CharacterDoc } from "@magicborn/characters/types"

export type LoadCharactersCallback = (projectId: string) => Promise<CharacterDoc[]>;

export interface CharacterWorkspaceState
  extends ProjectSlice,
    CharactersSlice,
    ViewStateSlice {
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
    setActiveGraphJson: CharactersActions['setActiveGraphJson']

    // View state actions
    setToolMode: ViewStateActions['setToolMode']
    setSidebarSearchQuery: ViewStateActions['setSidebarSearchQuery']
    setShowLabels: ViewStateActions['setShowLabels']
    setSelectedCharacterId: ViewStateActions['setSelectedCharacterId']
    openCreateCharacterModal: ViewStateActions['openCreateCharacterModal']
    closeCreateCharacterModal: ViewStateActions['closeCreateCharacterModal']
    openDebugDrawer: ViewStateActions['openDebugDrawer']
    closeDebugDrawer: ViewStateActions['closeDebugDrawer']
  }
}

export interface CreateCharacterWorkspaceStoreOptions {
  /** Called when activeProjectId changes; host implements via RQ fetch. */
  loadCharacters?: LoadCharactersCallback
}

export function createCharacterWorkspaceStore(
  options: CreateCharacterWorkspaceStoreOptions = {}
): StoreApi<CharacterWorkspaceState> {
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
            setActiveGraphJson: charactersSlice.setActiveGraphJson,

            // View state actions
            setToolMode: viewStateSlice.setToolMode,
            setSidebarSearchQuery: viewStateSlice.setSidebarSearchQuery,
            setShowLabels: viewStateSlice.setShowLabels,
            setSelectedCharacterId: viewStateSlice.setSelectedCharacterId,
            openCreateCharacterModal: viewStateSlice.openCreateCharacterModal,
            closeCreateCharacterModal: viewStateSlice.closeCreateCharacterModal,
            openDebugDrawer: viewStateSlice.openDebugDrawer,
            closeDebugDrawer: viewStateSlice.closeDebugDrawer,
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
  
  return useStore(store, selector)
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
