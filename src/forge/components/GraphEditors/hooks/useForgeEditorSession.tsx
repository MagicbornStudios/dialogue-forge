// src/components/GraphEditors/hooks/useForgeEditorSession.tsx
import React, { createContext, useContext } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { LayoutDirection } from '@/forge/components/GraphEditors/utils/forge-flow-helpers';

export type EdgeDropMenuState = {
  screenX: number; // Screen pixel coordinates for menu positioning
  screenY: number;
  flowX: number; // Flow/graph coordinates for node positioning
  flowY: number;
  fromNodeId: string;
  sourceHandle?: string;
  fromChoiceIdx?: number;
  fromBlockIdx?: number;
  edgeId?: string; // For insertNodeOnEdge operations
} | null;

export interface ForgeEditorSessionState {
  selectedNodeId: string | null;
  paneContextMenu: { screenX: number; screenY: number; flowX: number; flowY: number } | null;
  edgeDropMenu: EdgeDropMenuState;
  layoutDirection: LayoutDirection;
  autoOrganize: boolean;
  showPathHighlight: boolean;
  showBackEdges: boolean;
  showMiniMap: boolean;
}

export function createForgeEditorSessionStore(initialState?: Partial<ForgeEditorSessionState>) {
  return createStore<ForgeEditorSessionState>()((set) => ({
    selectedNodeId: null,
    paneContextMenu: null,
    edgeDropMenu: null,
    layoutDirection: 'TB',
    autoOrganize: false,
    showPathHighlight: true,
    showBackEdges: true,
    showMiniMap: true,
    ...initialState,
  }));
}

export type ForgeEditorSessionStore = ReturnType<typeof createForgeEditorSessionStore>;

const ForgeEditorSessionContext = createContext<ForgeEditorSessionStore | null>(null);

export function ForgeEditorSessionProvider({
  store,
  children,
}: {
  store: ForgeEditorSessionStore;
  children: React.ReactNode;
}) {
  return (
    <ForgeEditorSessionContext.Provider value={store}>
      {children}
    </ForgeEditorSessionContext.Provider>
  );
}

export function useForgeEditorSession<T>(
  selector: (state: ForgeEditorSessionState) => T
): T {
  const store = useContext(ForgeEditorSessionContext);
  if (!store) {
    throw new Error('useForgeEditorSession must be used within ForgeEditorSessionProvider');
  }
  return useStore(store, selector);
}

export function useForgeEditorSessionStore(): ForgeEditorSessionStore {
  const store = useContext(ForgeEditorSessionContext);
  if (!store) {
    throw new Error('useForgeEditorSessionStore must be used within ForgeEditorSessionProvider');
  }
  return store;
}
