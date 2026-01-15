---
name: Workspace Architecture Parity and AI Workspace
overview: Establish architectural parity between WriterWorkspace and ForgeWorkspace, clarify the editor shell pattern, standardize context usage, implement slice architecture for Writer, add event system, integrate data adapters, and create an AI Workspace for testing OpenRouter integration.
todos:
  - id: writer-slices
    content: Create WriterWorkspace store slices (content, editor, ai, navigation)
    status: pending
  - id: writer-store-refactor
    content: Refactor WriterWorkspace store to use slices (breaking changes acceptable)
    status: pending
    dependencies:
      - writer-slices
  - id: writer-events
    content: Add event system to WriterWorkspace (events, EventSink, emission)
    status: pending
  - id: writer-adapter-integration
    content: Integrate WriterDataAdapter into WriterWorkspace store and component
    status: pending
    dependencies:
      - writer-store-refactor
  - id: writer-subscriptions
    content: Create subscriptions for WriterWorkspace data adapter
    status: pending
    dependencies:
      - writer-adapter-integration
  - id: writer-editor-session
    content: Create WriterEditorSession store for UI state (optional - only if needed beyond Lexical's built-in state)
    status: pending
  - id: ai-adapter-interface
    content: Create AiDataAdapter interface in src/ai/adapters/
    status: pending
  - id: ai-workspace-store
    content: Create AiWorkspace store with slices (config, requests, responses)
    status: pending
    dependencies:
      - ai-adapter-interface
  - id: ai-workspace-component
    content: Create AiWorkspace component with UI (config, request, response, history)
    status: pending
    dependencies:
      - ai-workspace-store
  - id: ai-host-adapter
    content: Create PayloadCMS AI adapter implementation in app/lib/ai/
    status: pending
    dependencies:
      - ai-adapter-interface
  - id: ai-workspace-page
    content: Create AI workspace page at app/(ai)/ai/page.tsx
    status: pending
    dependencies:
      - ai-workspace-component
      - ai-host-adapter
  - id: architecture-docs
    content: Create architecture documentation for workspace patterns
    status: pending
---

# Workspace Architecture Parity and AI Workspace

## Architecture Overview

### Current State Analysis

**ForgeWorkspace (Reference Implementation):**

- ✅ Slice-based Zustand store (graph, gameState, viewState, project)
- ✅ Event system (EventSink pattern)
- ✅ Data adapter pattern
- ✅ Editor session store (separate Zustand store for UI state)
- ✅ Editor shell hook (useForgeFlowEditorShell)
- ✅ Editor actions context (command dispatch pattern)
- ✅ Multiple contexts: WorkspaceStore, NodeDrag, EditorSession, EditorActions

**WriterWorkspace (Needs Parity):**

- ❌ Monolithic store (no slices)
- ❌ No event system
- ❌ Data adapter interface exists but not used
- ⚠️ No editor session store (Lexical handles UI state internally - may not be needed)
- ✅ Editor shell pattern (Lexical's built-in patterns serve this purpose conceptually)
- ⚠️ No editor actions context (Lexical's command system serves this purpose)
- ❌ Single context: WorkspaceStore only

### Key Concepts

**1. Workspace Store (Domain State)**

- Zustand vanilla store with slices
- Contains domain data (graphs/pages, game state, etc.)
- Contains domain actions (CRUD operations)
- Can be persisted (localStorage)
- Emits events via EventSink

**2. Editor Session Store (UI State)**

- Separate Zustand vanilla store
- Ephemeral UI state (selected items, menus, layout preferences)
- NOT persisted
- Scoped to a single editor instance

**3. Editor Shell (Bridge Pattern)**

- Hook that bridges editor library (React Flow/Lexical) with domain logic
- Manages editor library state (nodes/edges or blocks)
- Handles editor library callbacks
- Provides command dispatch pattern
- Uses editor session store for UI state (or editor library's built-in state)
- Calls workspace store actions for domain mutations

**Note:** For React Flow, we create a custom `useForgeFlowEditorShell` hook. For Lexical, Lexical's built-in editor state, commands, and listeners serve the same conceptual purpose - no custom hook needed.

**4. Editor Actions (Command Pattern)**

- Context providing typed actions
- Wraps editor shell dispatch
- Makes actions available to child components

**5. Data Adapters (Host Integration)**

- Interface defined in `src/domain/adapters/`
- Host app implements in `app/lib/domain/data-adapter/`
- Injected into workspace store
- Enables data fetching and persistence

## Implementation Plan

### Phase 1: WriterWorkspace Store Refactoring

#### 1.1 Create Slice Architecture

**Files to create:**

- `src/writer/components/store/slices/content.slice.ts` - Acts, chapters, pages
- `src/writer/components/store/slices/editor.slice.ts` - Editor state, drafts
- `src/writer/components/store/slices/ai.slice.ts` - AI preview, selection, snapshots
- `src/writer/components/store/slices/navigation.slice.ts` - Active page, expanded nodes

**Slice structure:**

```typescript
// content.slice.ts
export interface ContentSlice {
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
  contentError: string | null;
}

export interface ContentActions {
  setActs: (acts: ForgeAct[]) => void;
  setChapters: (chapters: ForgeChapter[]) => void;
  setPages: (pages: ForgePage[]) => void;
  updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
}

// Similar pattern for other slices
```

#### 1.2 Refactor Store to Use Slices

**File:** `src/writer/components/store/writer-workspace-store.tsx`

- Import slice creators
- Compose slices in store creation
- Add immer middleware (like Forge)
- **Note:** Breaking changes are acceptable - no need to maintain backward compatibility

#### 1.3 Add Event System

**Files to create:**

- `src/writer/events/writer-events.ts` - Event types and constants
- `src/writer/events/events.ts` - Event creation helpers

**Event types:**

```typescript
export const WRITER_EVENT_TYPE = {
  CONTENT_CHANGE: 'contentChange',
  AI_EDIT: 'aiEdit',
  NAVIGATION: 'navigation',
  SAVE: 'save',
} as const;

export type WriterEvent = {
  type: WriterEventType;
  payload: unknown;
  reason: string;
};
```

**Update store:**

- Add EventSink interface
- Add event emission to actions
- Wrap actions to emit events

### Phase 2: WriterWorkspace Component Parity

#### 2.1 Add Data Adapter Support

**File:** `src/writer/components/WriterWorkspace/WriterWorkspace.tsx`

- Add `dataAdapter?: WriterDataAdapter` prop
- Pass to store creation
- Add `onEvent?: (event: WriterEvent) => void` prop
- Create EventSink ref (like Forge)
- Add `projectId?: number | null` and `onProjectChange` props

#### 2.2 Update Store Interface

**File:** `src/writer/components/store/writer-workspace-store.tsx`

- Add `dataAdapter?: WriterDataAdapter` to state
- Add `CreateWriterWorkspaceStoreOptions` with dataAdapter
- Update store creation to accept EventSink
- Add subscriptions setup (like Forge)

#### 2.3 Create Subscriptions

**File:** `src/writer/components/store/slices/subscriptions.ts`

- Setup subscriptions for data adapter
- Handle data fetching on project change
- Similar to Forge's subscription pattern

### Phase 3: Editor Architecture (Keep Lexical As-Is)

**Decision:** Keep Lexical direct usage. Lexical follows its own editor shell patterns internally, which conceptually align with our editor shell pattern. No need to create a custom `useWriterEditorShell` hook.

**Note:** Lexical's built-in patterns (editor state, commands, listeners) serve the same purpose as our editor shell pattern - bridging the editor library with domain logic. The conceptual alignment is sufficient.

**Optional: Editor Session Store (Only if needed for additional UI state)**

If we need to track UI state beyond what Lexical provides (e.g., custom menus, panels, etc.), we can add:

**File:** `src/writer/components/editor/hooks/useWriterEditorSession.tsx` (optional)

```typescript
export interface WriterEditorSessionState {
  // Only if Lexical doesn't cover these:
  customMenuState?: unknown;
  panelVisibility?: Record<string, boolean>;
  // Other custom UI state
}
```

**For now:** Skip editor session store unless specific UI state needs arise that Lexical doesn't handle.

### Phase 4: AI Workspace

#### 4.1 Create AI Data Adapter Interface

**File:** `src/ai/adapters/ai-data-adapter.ts`

```typescript
export interface AiDataAdapter {
  // Configuration
  getApiKey(): Promise<string | null>;
  setApiKey(key: string): Promise<void>;
  
  // Test requests
  testConnection(): Promise<boolean>;
  
  // History/logs (optional)
  saveRequestLog?(request: unknown, response: unknown): Promise<void>;
  getRequestLogs?(): Promise<AiRequestLog[]>;
}
```

#### 4.2 Create AI Workspace Store

**File:** `src/ai/components/AiWorkspace/store/ai-workspace-store.tsx`

**Slices:**

- `config.slice.ts` - API key, model selection
- `requests.slice.ts` - Request history, current request
- `responses.slice.ts` - Response history, streaming state

**Store structure:**

```typescript
export interface AiWorkspaceState {
  // Config slice
  apiKey: string | null;
  selectedModel: string;
  
  // Requests slice
  currentRequest: AiRequest | null;
  requestHistory: AiRequest[];
  
  // Responses slice
  currentResponse: AiResponse | null;
  isStreaming: boolean;
  responseHistory: AiResponse[];
  
  // Data adapter
  dataAdapter?: AiDataAdapter;
  
  actions: {
    setApiKey: (key: string) => Promise<void>;
    sendTestRequest: (payload: unknown) => Promise<void>;
    // ...
  };
}
```

#### 4.3 Create AI Workspace Component

**File:** `src/ai/components/AiWorkspace/AiWorkspace.tsx`

**Structure:**

```typescript
interface AiWorkspaceProps {
  dataAdapter?: AiDataAdapter;
  className?: string;
}

export function AiWorkspace({ dataAdapter, className }: AiWorkspaceProps) {
  // Similar pattern to ForgeWorkspace
  // Store creation with EventSink
  // Context providers
}
```

**UI Components:**

- `AiWorkspaceConfig` - API key input, model selector
- `AiWorkspaceRequest` - Request input, send button
- `AiWorkspaceResponse` - Response display, streaming indicator
- `AiWorkspaceHistory` - Request/response history

#### 4.4 Create Host App Implementation

**File:** `app/lib/ai/data-adapter/payload-ai-adapter.ts`

```typescript
export function makePayloadAiAdapter(): AiDataAdapter {
  return {
    async getApiKey() {
      // Get from PayloadCMS config or env
    },
    async setApiKey(key: string) {
      // Save to PayloadCMS config
    },
    async testConnection() {
      // Test OpenRouter connection
    },
  };
}
```

#### 4.5 Create AI Workspace Page

**File:** `app/(ai)/ai/page.tsx`

```typescript
export default function AiWorkspacePage() {
  return (
    <AiWorkspace
      className="h-screen"
      dataAdapter={makePayloadAiAdapter()}
    />
  );
}
```

### Phase 5: Documentation and Consistency

#### 5.1 Create Architecture Documentation

**File:** `docs/architecture/workspace-patterns.md`

Document:

- Workspace store pattern
- Editor session store pattern (when needed vs. editor library's built-in state)
- Editor shell pattern (custom hook for React Flow, Lexical's built-in patterns for Lexical)
- Data adapter pattern
- Event system pattern
- Context organization

#### 5.2 Standardize Context Usage

**Context Hierarchy:**

```
WorkspaceStoreProvider (domain state)
  └─ EditorSessionProvider (UI state, per editor)
      └─ EditorActionsProvider (command dispatch)
          └─ Other feature providers (NodeDrag, etc.)
```

**Rules:**

- Workspace store: Domain data, persisted
- Editor session: UI state, ephemeral, per editor
- Editor actions: Command dispatch, derived from shell
- Feature providers: Specific features (drag, etc.)

## File Structure

```
src/
├── writer/
│   ├── components/
│   │   ├── store/
│   │   │   ├── writer-workspace-store.tsx (refactored)
│   │   │   └── slices/
│   │   │       ├── content.slice.ts
│   │   │       ├── editor.slice.ts
│   │   │       ├── ai.slice.ts
│   │   │       ├── navigation.slice.ts
│   │   │       └── subscriptions.ts
│   │   ├── WriterWorkspace/
│   │   │   └── WriterWorkspace.tsx (updated)
│   │   └── editor/
│   │       └── hooks/
│   │           └── useWriterEditorSession.tsx (optional - only if needed)
│   ├── events/
│   │   ├── writer-events.ts
│   │   └── events.ts
│   └── adapters/
│       └── writer-data-adapter.ts (already exists)
│
├── ai/
│   ├── components/
│   │   └── AiWorkspace/
│   │       ├── AiWorkspace.tsx
│   │       ├── components/
│   │       │   ├── AiWorkspaceConfig.tsx
│   │       │   ├── AiWorkspaceRequest.tsx
│   │       │   ├── AiWorkspaceResponse.tsx
│   │       │   └── AiWorkspaceHistory.tsx
│   │       └── store/
│   │           ├── ai-workspace-store.tsx
│   │           └── slices/
│   │               ├── config.slice.ts
│   │               ├── requests.slice.ts
│   │               └── responses.slice.ts
│   └── adapters/
│       └── ai-data-adapter.ts
│
app/
├── lib/
│   └── ai/
│       └── data-adapter/
│           └── payload-ai-adapter.ts
└── (ai)/
    └── ai/
        └── page.tsx
```

## Migration Strategy

### Step 1: Writer Store Slices

1. Create slice files
2. Refactor store to use slices
3. Update all consumers to use new interface
4. Test refactored store

### Step 2: Add Features (Non-Breaking)

1. Add event system
2. Add data adapter support
3. Add editor session store
4. All additions, no removals

### Step 3: AI Workspace (New)

1. Create from scratch
2. Follow ForgeWorkspace patterns
3. Simple initial implementation

### Step 4: Documentation

1. Document patterns
2. Update existing docs
3. Create examples

## Benefits

1. **Consistency**: All workspaces follow same patterns
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new workspaces
4. **Testability**: Isolated slices and stores
5. **Host Integration**: Clear adapter pattern
6. **Developer Experience**: Predictable architecture