# 03 - Types Inventory

## Type Definition Hotspots Analysis

### Core Types Directory (`src/types/`)

| File | Content | Primary Domain | Secondary Users | Ownership Recommendation |
|------|---------|----------------|-----------------|-------------------------|
| `constants.ts` | Global constants (VIEW_MODE, FLAG_TYPE, NODE_TYPE, etc.) | Cross-Package | Forge, Writer | **Cross-Package Shared** |
| `index.ts` | Main type exports | Cross-Package | All | **Cross-Package Shared** |
| `characters.ts` | Character definition types | Forge | GamePlayer | **Forge Domain** |
| `flags.ts` | Flag system types | Cross-Package | Forge, GamePlayer | **Cross-Package Shared** |
| `forge-game-state.ts` | Game state types | Forge | GamePlayer | **Forge Domain** |
| `narrative.ts` | Act/Chapter/Page types | Forge + Writer | Both | **Cross-Package Shared** |
| `ui-constants.ts` | UI styling constants | Forge | GraphEditors | **Forge UI Layer** |
| `forge/forge-graph.ts` | Graph node/edge types | Forge | GraphEditors | **Forge Domain** |

### Library Types

| File | Content | Domain | Importers | Ownership Recommendation |
|------|---------|--------|-----------|-------------------------|
| `src/lib/yarn-converter/types.ts` | Yarn conversion types | Forge (shared) | Yarn converter | **Package-Shared** |
| `src/components/GraphEditors/utils/layout/types.ts` | Layout algorithm types | Forge UI | Layout utils | **Feature-Shared** |

### Host-Only Types

| File | Content | Domain | Ownership |
|------|---------|--------|------------|
| `app/payload-types.ts` | PayloadCMS generated types | Host Only | **Host-Only** |

## Detailed Type Classification

### Cross-Package Shared Types ✅

#### `src/types/constants.ts`
**Content**: Global enums and constants
- `VIEW_MODE`: Graph/Yarn/Play modes
- `FLAG_TYPE`: Quest/Item/Stat/etc. 
- `FLAG_VALUE_TYPE`: Boolean/Number/String
- `CONDITION_OPERATOR`: IS_SET/EQUALS/GREATER_THAN etc.
- `NODE_TYPE`: Node type constants (legacy)
- `QUEST_STATE`: Quest progress states

**Importers**: Forge, Writer, GraphEditors (40+ files)
**Usage**: Heavy cross-domain usage
**Recommendation**: Keep as **Cross-Package Shared** - core foundation

#### `src/types/flags.ts`  
**Content**: Flag system definitions
- `FlagDefinition`, `FlagSchema`
- Flag-specific interfaces

**Importers**: Forge, GamePlayer, GraphEditors (10+ files)
**Usage**: Game state management
**Recommendation**: Keep as **Cross-Package Shared** - may be needed by Writer

#### `src/types/narrative.ts`
**Content**: Act/Chapter/Page definitions
- `ForgeAct`, `ForgeChapter`, `ForgePage`
- **Current Usage**: Forge Narrative GraphEditor + Writer workspace

**Importers**: 
- Forge: NarrativeGraphEditor, forge-data-adapter
- Writer: WriterWorkspace, writer-adapter

**Usage**: Both domains need these types
**Recommendation**: **Cross-Package Shared** - essential bridge between domains

### Forge Domain Types 🔧

#### `src/types/forge/forge-graph.ts`
**Content**: Core Forge graph model
- Node/edge definitions
- Graph structure types
- React Flow integrations

**Importers**: Forge components, GraphEditors (20+ files)
**Usage**: Central to Forge functionality
**Recommendation**: **Forge Domain** - core Forge model

#### `src/types/characters.ts`
**Content**: Character definitions
- `ForgeCharacter`, character-related types

**Importers**: Forge components, GamePlayer
**Usage**: Character management in Forge
**Recommendation**: **Forge Domain** - Forge-specific character system

#### `src/types/forge-game-state.ts`
**Content**: Game state management
- `ForgeGameState`, state-related types

**Importers**: Forge, GamePlayer
**Usage**: Game simulation
**Recommendation**: **Forge Domain** - Forge's game engine

### Forge UI Layer Types 🎨

#### `src/types/ui-constants.ts`
**Content**: UI styling and constants
- CSS classes, colors, borders
- Node type styling

**Importers**: GraphEditors, Forge UI
**Usage**: Visual presentation
**Recommendation**: **Forge UI Layer** - presentation concerns

### Package-Shared Types 📦

#### `src/lib/yarn-converter/types.ts`
**Content**: Yarn conversion interfaces
- Conversion context types
- Domain integration contracts

**Importers**: Yarn converter only
**Usage**: Forge subsystem
**Recommendation**: **Package-Shared** - Forge internal sharing

#### `src/components/GraphEditors/utils/layout/types.ts`
**Content**: Layout algorithm types
- Layout strategy interfaces

**Importers**: Layout utilities
**Usage**: GraphEditors feature
**Recommendation**: **Feature-Shared** - GraphEditors only

## Import Pattern Analysis

### Heavy Importers (>5 type imports)

**Forge Components**:
- `ForgeWorkspace/ForgeWorkspace.tsx` - 4 type imports
- `ForgeWorkspace/store/forge-workspace-store.tsx` - 6 type imports
- `forge/forge-data-adapter/forge-data-adapter.ts` - 5 type imports

**GraphEditors**:
- Multiple node components import narrative types
- Shared components import flag types
- Layout utilities stay within their domain

**Writer Components**:
- `WriterWorkspace/WriterWorkspace.tsx` - 3 type imports
- `WriterWorkspace/store/writer-workspace-store.tsx` - 3 type imports

### Cross-Domain Dependencies

**Writer ↔ Forge Bridge**:
- Writer imports `narrative.ts` types (ForgeAct, ForgeChapter, ForgePage)
- This is **intentional and correct** - Writer works with narrative structure

**No Reverse Dependencies**:
- Forge components don't import Writer-specific types ✅

## Ownership Issues & Recommendations

### Issues Found 🔴

1. **Mixed Domain Types in Single Files**:
   - `src/types/index.ts` exports everything together
   - Makes domain boundaries unclear

2. **Forge Narrative Types Shared with Writer**:
   - Narrative types used by both domains
   - Needs careful coordination for changes

3. **Constants vs UI Constants**:
   - `constants.ts` (shared) vs `ui-constants.ts` (Forge-only)
   - Names could be clearer

### Recommendations ✅

#### Immediate Actions
1. **Separate Domain Exports**: Create separate index files for each domain
2. **Clear Type Organization**: Group types by domain in exports
3. **Document Cross-Domain Types**: Clearly mark which types are shared

#### Target Structure Proposal
```
src/types/
├── shared/           # Cross-package shared
│   ├── constants.ts
│   ├── flags.ts
│   ├── narrative.ts
│   └── index.ts
├── forge/            # Forge domain only
│   ├── forge-graph.ts
│   ├── characters.ts
│   ├── forge-game-state.ts
│   └── index.ts
├── forge-ui/         # Forge UI layer
│   ├── ui-constants.ts
│   └── index.ts
└── index.ts          # Re-exports only shared types
```

#### Migration Strategy
1. **Phase 1**: Reorganize files without breaking imports
2. **Phase 2**: Update imports to use domain-specific exports
3. **Phase 3**: Enforce boundaries with ESLint rules

## Boundary Enforcement Rules

### Recommended ESLint Rules
```javascript
// Writer cannot import Forge domain types
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/types/forge/*']
  }],
  // Apply only to WriterWorkspace files
}

// Forge cannot import UI types from shared
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/types/forge-ui/*']
  }],
  // Apply to core Forge libraries
}
```

## Next Steps

### Before Reorganization
1. **Audit type usage**: Verify domain assignments are correct
2. **Plan migration**: Map current imports to new structure
3. **Test impact**: Ensure no functionality breaks

### During Reorganization
1. **Maintain compatibility**: Keep old exports during transition
2. **Update imports gradually**: One domain at a time
3. **Add validation**: ESLint rules to catch violations

### After Reorganization
1. **Document contracts**: Clear API for shared types
2. **Version shared types**: Semver for breaking changes
3. **Monitor usage**: Watch for unintended cross-domain imports