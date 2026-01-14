# 04 - Store/State Inventory

## State Management Architecture Overview

The codebase uses **Zustand** as the primary state management solution with a well-structured slice-based architecture. Each workspace maintains its own store with domain-specific slices.

## Store Architecture Summary

| Store | Domain | Slice Architecture | Primary Technologies | Key Importers |
|-------|--------|-------------------|----------------------|--------------|
| `ForgeWorkspaceStore` | Forge | 4 slices (graph, gameState, viewState, project) | Zustand + Immer + Persist | Forge components (15+) |
| `WriterWorkspaceStore` | Writer | Monolithic (AI + content) | Zustand | Writer components (6+) |
| `ForgeEditorSessionStore` | GraphEditors | Session state only | Zustand | GraphEditors hooks |
| Writer Patches | Writer | Patch operations system | Pure functions | Writer workspace |

## Detailed Store Analysis

### 1. ForgeWorkspaceStore (Primary Forge State)

**Location**: `src/components/ForgeWorkspace/store/forge-workspace-store.tsx`

#### Structure
```typescript
interface ForgeWorkspaceState {
  // Graph slice
  graphs: Record<string, ForgeGraphDoc>
  activeNarrativeGraphId: string | null
  activeStoryletGraphId: string | null
  
  // Game state slice  
  activeFlagSchema: FlagSchema | null
  activeGameState: ForgeGameState | null
  
  // View state slice
  graphScope: 'narrative' | 'storylet'
  panelLayout: PanelLayout
  
  // Project slice
  selectedProjectId: number | null
}
```

#### Slices Breakdown
| Slice | File | Purpose | Domain |
|-------|------|---------|--------|
| `graph.slice.ts` | Graph documents, active graphs, breadcrumbs | Forge Domain |
| `gameState.slice.ts` | Flag schema, game state simulation | Forge Domain |
| `viewState.slice.ts` | UI state, focus, layout | Forge UI Layer |
| `project.slice.ts` | Project selection and loading | Forge Domain |

#### Importers (15+ files)
**High Usage Components**:
- `ForgeWorkspace.tsx` - Main workspace container
- `ForgeSidebar.tsx` - Navigation and controls
- `NodePalette.tsx` - Node creation UI
- `StoryletList.tsx` - Graph management
- `FlagManagerModal.tsx` - Flag editing

**Hooks & Utilities**:
- `useForgeWorkspaceActions.tsx` - Store actions
- `useNodeDrag.tsx` - Drag operations
- `subscriptions.ts` - External data sync

#### Ownership Classification
**Recommendation**: **Forge Domain** - Core Forge workspace state

### 2. WriterWorkspaceStore (Writer State)

**Location**: `src/components/WriterWorkspace/store/writer-workspace-store.tsx`

#### Structure
```typescript
interface WriterWorkspaceState {
  // Content state
  acts: ForgeAct[]
  chapters: ForgeChapter[]
  pages: ForgePage[]
  activePageId: number | null
  drafts: Record<number, WriterDraftState>
  
  // AI state
  aiPreview: WriterPatchOp[] | null
  aiProposalStatus: 'idle' | 'proposing' | 'ready' | 'applying'
  aiError: string | null
  aiSelection: WriterSelectionRange | null
}
```

#### Key Features
- **Content Management**: Acts/Chapters/Pages hierarchy
- **AI Integration**: Patch-based editing system
- **Draft System**: Auto-save and version management
- **Cross-Domain Types**: Uses Forge narrative types (intentional)

#### Importers (6 files)
- `WriterWorkspace.tsx` - Main workspace
- `WriterEditorPane.tsx` - Lexical editor integration
- `AutosavePlugin.tsx` - Draft persistence
- `ToolbarPlugin.tsx` - AI interaction
- `WriterTree.tsx` - Navigation tree

#### Ownership Classification
**Recommendation**: **Writer Domain** - Writer-specific state

### 3. ForgeEditorSessionStore (GraphEditors State)

**Location**: `src/components/GraphEditors/hooks/useForgeEditorSession.tsx`

#### Structure
```typescript
interface ForgeEditorSessionState {
  selectedNodeId: string | null
  paneContextMenu: CoordinateMenu | null
  edgeDropMenu: EdgeDropMenuState | null
  layoutDirection: LayoutDirection
  autoOrganize: boolean
  showPathHighlight: boolean
  showMiniMap: boolean
}
```

#### Purpose
- **Editor Session**: Temporary UI state per editor instance
- **GraphEditors Only**: Shared by Narrative and Storylet editors
- **No Persistence**: Not persisted, session-only

#### Importers
- `useForgeEditorSession.tsx` - Hook definition
- GraphEditor components (via context)

#### Ownership Classification
**Recommendation**: **Feature-Shared** - GraphEditors infrastructure

### 4. Writer Patches (Cross-Domain Types)

**Location**: `src/store/writer/writer-patches.ts`

#### Structure
```typescript
type WriterPatchOp = 
  | { type: 'replace_content'; content: string | null }
  | { type: 'splice_content'; start: number; end: number; text: string }
  | { type: 'replace_blocks'; blocks: unknown[] | null }
```

#### Purpose
- **Patch Operations**: AI edit descriptions
- **Immutable Updates**: Functional patch application
- **AI Integration**: Contract for AI suggestions

#### Importers
- `WriterWorkspaceStore` - AI preview system
- `WriterEditorPane` - Patch application

#### Ownership Classification
**Recommendation**: **Writer Domain** - Writer's patch system

## State Management Patterns Analysis

### Excellent Patterns ✅

1. **Slice Architecture**: Forge workspace well-separated into logical slices
2. **Context Integration**: Stores provided via React context for clean access
3. **Type Safety**: Full TypeScript integration with proper interfaces
4. **Middleware Usage**: Zustand devtools, immer, persist used appropriately
5. **Domain Separation**: Clear separation between Forge and Writer stores

### Architecture Concerns ⚠️

1. **Inconsistent Architecture**: 
   - Forge: Sliced architecture (good)
   - Writer: Monolithic (could benefit from slices)

2. **Cross-Domain Type Dependencies**:
   - Writer store imports Forge narrative types (intentional but needs coordination)

3. **State Location Inconsistencies**:
   - Some state in workspace stores
   - Some state in component-local stores (EditorSession)

### Boundary Violations 🚨

1. **Yarn Converter Store Dependency** (from Task 2):
   ```typescript
   // src/lib/yarn-converter/workspace-context.ts
   import type { ForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
   ```
   - Library importing store types breaks package boundaries

## Store Dependencies Graph

```
Host (app/)
├── ForgeWorkspaceStore ← ForgeWorkspace components
│   ├── graph.slice → GraphEditors
│   ├── gameState.slice → GamePlayer
│   ├── viewState.slice → Forge UI
│   └── project.slice → Forge adapters
├── WriterWorkspaceStore ← WriterWorkspace components  
│   ├── narrative.ts (shared types)
│   └── writer-patches.ts
└── ForgeEditorSessionStore ← GraphEditors
    └── Used by both Narrative and Storylet editors
```

## Recommendations

### Immediate Actions

1. **Fix Yarn Converter Coupling**:
   ```typescript
   // Create interface in shared layer
   interface ForgeWorkspaceProvider {
     getGraph(id: string): ForgeGraphDoc | null
     getGameState(): ForgeGameState | null
   }
   ```

2. **Standardize Writer Store Architecture**:
   - Split WriterWorkspaceStore into slices:
     - `content.slice.ts` - acts/chapters/pages
     - `ai.slice.ts` - AI state and operations
     - `drafts.slice.ts` - auto-save system

### Medium Term Enhancements

3. **Extract Shared State Patterns**:
   - Common store creation utilities
   - Shared middleware configuration
   - Standardized slice patterns

4. **Create State Management Utilities**:
   ```typescript
   // src/lib/store-utils/
   - createWorkspaceStore()
   - createSlice()
   - createPersistedSlice()
   ```

### Long Term Architecture

5. **Cross-Domain State Coordination**:
   - Event system for workspace communication
   - Shared state contracts for Writer ↔ Forge integration
   - Conflict resolution for concurrent editing

## Migration Safety Analysis

### Low Risk ✅
- Forge and Writer stores are already well-separated
- Clear domain boundaries established
- Minimal cross-contamination

### Medium Risk ⚠️
- Writer store architecture needs refactoring for consistency
- Yarn converter coupling needs interface extraction
- Session state scattered across different patterns

### Migration Strategy

1. **Phase 1**: Fix boundary violations (yarn converter)
2. **Phase 2**: Refactor Writer store to slice architecture  
3. **Phase 3**: Extract shared store utilities
4. **Phase 4**: Standardize session state management

## Enforcement Rules

### Recommended ESLint Rules
```javascript
// Prevent stores from importing other domain stores
{
  'no-restricted-imports': ['error', {
    patterns: [
      '@/src/components/WriterWorkspace/store/*',
      '@/src/components/ForgeWorkspace/store/*'
    ]
  }]
}

// Apply to appropriate workspace directories
```

## Next Steps

### Before Reorganization
1. **Audit store usage patterns** - Verify all importers are identified
2. **Design Writer slice architecture** - Plan the refactoring
3. **Create interface contracts** - Define cross-domain boundaries

### During Reorganization  
1. **Extract interfaces first** - Decouple yarn converter
2. **Refactor Writer store** - Implement slice architecture
3. **Standardize patterns** - Apply consistent patterns across stores

### After Reorganization
1. **Add store utilities** - Extract common patterns
2. **Document state contracts** - Clear API boundaries
3. **Monitor performance** - Ensure no regressions