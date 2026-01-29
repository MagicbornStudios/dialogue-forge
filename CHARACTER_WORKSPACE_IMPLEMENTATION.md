# Character Workspace Implementation Summary

## What We Built

A **Character Relationship POV Editor** workspace that allows users to create and manage character relationship graphs from each character's point of view (POV). This implementation follows the architecture boundaries and patterns established in the Dialogue Forge project.

## Key Features

### 1. Option A POV Rule (Enforced at 3 Layers)
- **All edges must originate from the active (perspective) character**
- Enforced in:
  1. **Payload validation** (database layer - see `characters.ts` collection)
  2. **Domain store** (application layer - see `characters.slice.ts`)
  3. **UI/JointJS bridge** (to be implemented - see next steps)

### 2. Data Storage on Character Documents
- Each character owns their own `relationshipFlow` graph
- No separate `ForgeGraphs` documents needed
- Simpler data model: `Character.relationshipFlow = { nodes, edges }`

### 3. Architecture Compliance
- **Domain layer** (`src/characters/`) - Independent from host/Payload
- **Types are host-agnostic** - Can work with any backend
- **Adapter pattern** - Host provides `CharacterWorkspaceAdapter` implementation
- **No cross-domain imports** - Characters domain is independent

## File Structure

```
src/characters/
├── types/
│   ├── character.ts          # CharacterDoc, RelationshipFlow, Position types
│   ├── contracts.ts           # CharacterWorkspaceAdapter interface
│   └── index.ts
├── components/
│   ├── CharacterWorkspace/
│   │   └── store/
│   │       ├── slices/
│   │       │   ├── project.slice.ts       # Active project management
│   │       │   ├── characters.slice.ts    # Character CRUD + graph mutations
│   │       │   └── viewState.slice.ts     # UI state (tool mode, etc.)
│   │       └── character-workspace-store.tsx  # Main store
│   └── RelationshipGraph/
│       └── hooks/
│           └── relationship-commands.ts   # Typed commands for OpenCode/UI
├── tsconfig.json
└── index.ts                   # Public API exports
```

## Payload Changes

### `app/payload-collections/collection-configs/characters.ts`

Added fields:
- `description` (textarea) - Character description
- `imageUrl` (text) - URL to character portrait
- `relationshipFlow` (json) - POV relationship graph

Added validation:
- **Option A enforcement**: All edges must have `source = characterId`
- **Self-node requirement**: Graph must include the perspective character as a node
- **No self-edges**: Edges cannot have `target = characterId`

## Store Architecture

### Slices Pattern (Follows Forge Workspace Pattern)

1. **Project Slice** (`project.slice.ts`)
   - Manages active project selection
   - Stores list of available projects

2. **Characters Slice** (`characters.slice.ts`)
   - Manages `charactersById` record
   - Tracks `activeCharacterId` (the perspective character)
   - Provides graph mutation actions:
     - `addNodeToActiveGraph`
     - `moveNodeInActiveGraph`
     - `removeNodeFromActiveGraph`
     - `addEdgeToActiveGraph`
     - `updateEdgeLabelInActiveGraph`
     - `removeEdgeFromActiveGraph`

3. **View State Slice** (`viewState.slice.ts`)
   - Manages UI state: tool mode, sidebar search, show labels
   - Separate from persistent domain state

### Main Store (`character-workspace-store.tsx`)

- Combines all slices using Zustand + Immer middleware
- Provides React context for consuming components
- Exposes `actions` object with all mutations
- Follows Forge workspace store pattern exactly

## Commands Pattern (OpenCode-Friendly)

### `relationship-commands.ts`

Provides typed, high-level commands:
- `selectPerspective(characterId)`
- `addCharacterNode(targetCharacterId, position?)`
- `moveNode(characterId, position)`
- `removeNode(characterId)` - Cannot remove perspective node
- `setRelationship(targetId, label?)`
- `removeRelationship(targetId)`
- `renameCharacter(id, name)`
- `setCharacterImageUrl(id, url)`
- `setCharacterDescription(id, text)`

**Why this matters for OpenCode:**
- OpenCode can call `commands.setRelationship('char_123', 'Trusts')` instead of manipulating JointJS directly
- All mutations are deterministic and testable
- Commands enforce business rules (no self-edges, no removing perspective node)

## Canonical Graph Format

```typescript
interface RelationshipFlow {
  nodes: Array<{
    id: string              // characterId
    type: 'character'
    position: { x: number, y: number }
    data?: { characterId: string }
  }>
  edges: Array<{
    id: string              // `${source}->${target}`
    source: string          // activeCharacterId (always, Option A)
    target: string          // otherCharacterId
    type: 'relationship'
    data?: { label?: string }
  }>
}
```

**Why this format:**
- Compatible with ReactFlow/graph JSON conventions
- Easy for OpenCode to reason about
- JointJS can render it (bridge layer translates)
- Validated at database level

## TypeScript Configuration

### Added to `tsconfig.base.json`

```json
"@/characters/*": ["./src/characters/*"]
```

### Added to `tsconfig.json`

```json
{
  "path": "./src/characters/tsconfig.json"
}
```

### Created `src/characters/tsconfig.json`

Following the same pattern as other domains (forge, writer, etc.)

## Installed Dependencies

- `@joint/core` - JointJS library (modern package, replaces deprecated `jointjs`)

## Next Steps (Not Yet Implemented)

### 1. JointJS Bridge Hook (`useJointRelationshipShell`)

**Purpose:** Translate between domain `RelationshipFlow` and JointJS cells

**Responsibilities:**
- Create and own JointJS `graph`, `paper`, `scroller` instances
- Reconcile `activeCharacter.relationshipFlow` → JointJS cells
- Subscribe to JointJS events and translate to commands:
  - Node dragged → `commands.moveNode(id, position)`
  - Link created → `commands.setRelationship(targetId)`
  - Link label edited → Update via commands
- **Enforce Option A in real-time**: Prevent link creation from non-perspective nodes

**Example pattern:**
```typescript
useEffect(() => {
  const paper = new joint.dia.Paper({...})
  
  // Option A enforcement
  paper.on('link:connect', (linkView) => {
    const source = linkView.model.get('source').id
    if (source !== activeCharacterId) {
      linkView.model.remove()  // Cancel invalid link
      toast.error('Links must start from the active character')
    }
  })
  
  return () => paper.remove()
}, [activeCharacterId])
```

### 2. Character Workspace UI Components

**Components needed:**
- `CharacterWorkspace.tsx` - Main container
- `CharacterSidebar.tsx` - Left sidebar with character list + search
- `CharacterForm.tsx` - Inline editor for name/description/imageUrl
- `RelationshipGraphEditor.tsx` - JointJS canvas wrapper
- `ToolBar.tsx` - Select/Pan/Link mode toggle

**Layout:**
```
┌─────────────────────────────────────────┐
│ CharacterWorkspace                      │
├───────────┬─────────────────────────────┤
│ Character │ RelationshipGraphEditor     │
│ Sidebar   │ (JointJS canvas)            │
│           │                             │
│ [Search]  │   ┌───┐                     │
│           │   │ M │──"Trusts"──→┌───┐  │
│ • Morgana │   └───┘             │ A │  │
│ • Arthur  │                     └───┘  │
│ • Merlin  │                             │
│ • Mordred │                             │
│           │                             │
└───────────┴─────────────────────────────┘
```

### 3. Host Adapter Implementation

**File:** `app/lib/characters/payload-character-adapter.ts`

Implement `CharacterWorkspaceAdapter`:
```typescript
export class PayloadCharacterAdapter implements CharacterWorkspaceAdapter {
  async listProjects(): Promise<ProjectInfo[]> {
    // Fetch from Payload REST or local API
  }
  
  async listCharacters(projectId: string): Promise<CharacterDoc[]> {
    // Fetch characters with relationshipFlow
  }
  
  async createCharacter(projectId: string, data): Promise<CharacterDoc> {
    // POST to Payload
  }
  
  async updateCharacter(characterId: string, patch): Promise<CharacterDoc> {
    // PATCH to Payload (including relationshipFlow updates)
  }
}
```

### 4. OpenCode API (`src/characters/opencode/characterWorkspaceApi.ts`)

**Purpose:** Single API surface for OpenCode to interact with the workspace

```typescript
export function createCharacterWorkspaceApi(store: CharacterWorkspaceStore) {
  const commands = createRelationshipCommands(store)
  
  return {
    getSnapshot() {
      const state = store.getState()
      return {
        activeProject: state.activeProjectId,
        activeCharacter: state.activeCharacterId,
        characters: Object.values(state.charactersById),
        activeGraph: state.activeCharacterId 
          ? state.charactersById[state.activeCharacterId]?.relationshipFlow
          : null,
      }
    },
    
    commands,  // All typed commands
  }
}
```

**Usage by OpenCode:**
```typescript
// Get current state
const snapshot = api.getSnapshot()

// Execute command
api.commands.setRelationship('char_456', 'Distrusts')
api.commands.addCharacterNode('char_789', { x: 500, y: 400 })
```

### 5. Auto-Layout Algorithm

**Optional enhancement:** Radial layout around the perspective character

```typescript
commands.autoLayout = () => {
  const state = store.getState()
  const activeId = state.activeCharacterId
  if (!activeId) return
  
  const activeChar = state.charactersById[activeId]
  if (!activeChar?.relationshipFlow) return
  
  // Place perspective character in center
  const centerX = 400
  const centerY = 300
  const radius = 200
  
  const otherNodes = activeChar.relationshipFlow.nodes.filter(n => n.id !== activeId)
  const angleStep = (2 * Math.PI) / otherNodes.length
  
  otherNodes.forEach((node, i) => {
    const angle = i * angleStep
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    commands.moveNode(node.id, { x, y })
  })
}
```

## Testing the Implementation

### 1. Build Check

```bash
npm run build
```

Should compile without errors (path mapping for `@/characters/*` is now configured).

### 2. Type Check

```bash
npm run typecheck:domains
```

Should pass for the characters domain.

### 3. Manual Testing (Once UI is implemented)

- Create characters via Payload admin UI
- Open character workspace
- Select a character as perspective
- Add other characters to the graph (drag from sidebar or use commands)
- Create relationships (links) from the perspective character
- Try to create invalid links (should be blocked)
- Save and verify `relationshipFlow` is persisted correctly

## Important Design Decisions

### Why store on Character instead of ForgeGraphs?

**Pro:**
- POV is intrinsically a property of the character
- Simpler queries: list characters = get all graphs
- No "find-or-create graph doc" lifecycle
- Impossible to have orphaned graphs

**Con:**
- If you load 500 characters, you load 500 graphs
  - **Mitigation**: Graphs will be small (POV style)
  - **Future**: Add lazy-load endpoint if needed

### Why enforce Option A at multiple layers?

**Defense in depth:**
- **Database validation**: Ultimate backstop, prevents bad data even if UI bypassed
- **Domain store**: Ensures all mutations through the store are valid
- **UI/JointJS**: Best UX - instant feedback, prevents user confusion

### Why use commands pattern?

**OpenCode integration:**
- OpenCode should never touch JointJS directly (brittle, changes with library version)
- Commands are stable API that won't break when we refactor rendering
- Commands can be logged, replayed, tested in isolation

### Why separate session store from workspace store?

**Not implemented yet, but recommended:**
- Session store holds ephemeral UI state (selection, hover, grid on/off)
- Workspace store holds persistent domain data (characters, graphs)
- Matches Forge workspace pattern exactly

## Integration with Existing Project

### No conflicts with Forge/Writer domains

- Characters domain is completely independent
- Uses same architectural patterns (slices, adapters, commands)
- Can coexist with Forge/Writer workspaces

### Payload schema extension

- Characters collection already existed
- We only **added** fields, didn't break existing fields
- Backward compatible (existing characters will have `relationshipFlow = null`)

### TypeScript configuration

- Added `@/characters/*` path mapping
- Added `src/characters/tsconfig.json` reference
- Follows same pattern as other domains

## Conclusion

We've built the **foundational architecture** for the Character Workspace:

✅ Domain-independent types  
✅ Payload schema with Option A validation  
✅ Zustand store with slices pattern  
✅ Typed commands for OpenCode  
✅ TypeScript configuration  
✅ Installed JointJS  

**Still needed:**
- JointJS bridge hook
- UI components
- Host adapter implementation
- OpenCode API wrapper

The hard architectural decisions are done. The remaining work is mostly UI rendering and wiring up the existing patterns.
