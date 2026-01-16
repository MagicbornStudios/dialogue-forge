# 03 - Types Inventory

## Type Definition Hotspots Analysis

### Core Types Directory (`src/types/`)

| File | Content | Primary Domain | Secondary Users | Ownership Recommendation |
|------|---------|----------------|-----------------|-------------------------|
| `constants.ts` | Global constants (VIEW_MODE, FLAG_TYPE, NODE_TYPE, etc.) | Cross-Package | Forge, Writer, CopilotKit | **Cross-Package Shared** |
| `index.ts` | Main type exports | Cross-Package | All | **Cross-Package Shared** |
| `characters.ts` | Character definition types | Forge | GamePlayer | **Forge Domain** |
| `flags.ts` | Flag system types | Cross-Package | Forge, GamePlayer | **Cross-Package Shared** |
| `forge-game-state.ts` | Game state types | Forge | GamePlayer | **Forge Domain** |
| `narrative.ts` | Act/Chapter/Page types | Forge + Writer | Both | **Cross-Package Shared** |
| `ui-constants.ts` | UI styling constants | Forge | GraphEditors | **Forge UI Layer** |
| `forge/forge-graph.ts` | Graph node/edge types | Forge | GraphEditors | **Forge Domain** |

### CopilotKit Integration Types (NEW)

| File | Content | Domain | Importers | Ownership Recommendation |
|------|---------|--------|-----------|-------------------------|
| `src/ai/copilotkit/actions/base-actions.ts` | Base CopilotKit action types | Cross-Package AI | Domains | **Cross-Package Shared** |
| `src/forge/copilotkit/actions/workspace/types.ts` | Forge workspace action types | Forge CopilotKit | Forge actions | **Forge Domain** |
| `src/forge/copilotkit/actions/editor/types.ts` | Forge editor action types | Forge CopilotKit | Forge editor actions | **Forge Domain** |
| `src/writer/copilotkit/actions/workspace/types.ts` | Writer workspace action types | Writer CopilotKit | Writer actions | **Writer Domain** |
| `src/writer/copilotkit/actions/editor/types.ts` | Writer editor action types | Writer CopilotKit | Writer editor actions | **Writer Domain** |
| `src/forge/copilotkit/constants/forge-action-names.ts` | Forge action name constants | Forge CopilotKit | Forge actions | **Forge Domain** |
| `src/writer/copilotkit/constants/writer-action-names.ts` | Writer action name constants | Writer CopilotKit | Writer actions | **Writer Domain** |

### Library Types

| File | Content | Domain | Importers | Ownership Recommendation |
|------|---------|--------|-----------|-------------------------|
| `src/lib/yarn-converter/types.ts` | Yarn conversion types | Forge (shared) | Yarn converter | **Package-Shared** |
| `src/components/GraphEditors/utils/layout/types.ts` | Layout algorithm types | Forge UI | Layout utils | **Feature-Shared** |
| `src/ai/aiadapter/types.ts` | AI adapter core types | Cross-Package AI | AI infrastructure | **Cross-Package Shared** |

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

**Importers**: Forge, Writer, GraphEditors, CopilotKit (40+ files)
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
- CopilotKit: Forge actions, Writer actions

**Usage**: Both domains need these types
**Recommendation**: **Cross-Package Shared** - essential bridge between domains

#### `src/ai/copilotkit/actions/base-actions.ts` (NEW)
**Content**: Base CopilotKit action framework
- Base action creation utilities
- Shared action patterns

**Importers**: Domain CopilotKit integrations
**Usage**: Foundation for CopilotKit actions
**Recommendation**: **Cross-Package Shared** - AI infrastructure

#### `src/ai/aiadapter/types.ts` (NEW)
**Content**: Core AI adapter interfaces
- `AiAdapter`, `AiResponse`, `AiStreamResponse`
- OpenRouter integration types

**Importers**: AI infrastructure, CopilotKit runtime
**Usage**: Core AI abstraction
**Recommendation**: **Cross-Package Shared** - AI foundation

### Forge Domain Types 🔧

#### `src/types/forge/forge-graph.ts`
**Content**: Core Forge graph model
- Node/edge definitions
- Graph structure types
- React Flow integrations

**Importers**: Forge components, GraphEditors, CopilotKit Forge actions (20+ files)
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

#### Forge CopilotKit Types (NEW)
- `src/forge/copilotkit/actions/workspace/types.ts`
- `src/forge/copilotkit/actions/editor/types.ts`
- `src/forge/copilotkit/constants/forge-action-names.ts`

**Importers**: Forge CopilotKit actions
**Usage**: Forge-specific AI interactions
**Recommendation**: **Forge Domain** - AI integration for Forge

### Writer Domain Types ✍️

#### Writer CopilotKit Types (NEW)
- `src/writer/copilotkit/actions/workspace/types.ts`
- `src/writer/copilotkit/actions/editor/types.ts`
- `src/writer/copilotkit/constants/writer-action-names.ts`

**Importers**: Writer CopilotKit actions
**Usage**: Writer-specific AI interactions
**Recommendation**: **Writer Domain** - AI integration for Writer

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

## Type Dependencies Graph (Updated)

```
Cross-Package Shared (src/types/, src/ai/)
├── constants.ts → Forge, Writer, CopilotKit
├── flags.ts → Forge, GamePlayer
├── narrative.ts → Forge GraphEditor, Writer workspace, CopilotKit actions
├── ai/copilotkit/actions/base-actions.ts → Domain CopilotKit actions
└── ai/aiadapter/types.ts → AI infrastructure

Forge Domain (src/forge/, src/types/forge/)
├── forge-graph.ts → Forge components, GraphEditors, CopilotKit Forge actions
├── characters.ts → Forge components, GamePlayer
├── forge-game-state.ts → Forge components, GamePlayer
├── ui-constants.ts → Forge UI, GraphEditors
└── copilotkit/ → Forge CopilotKit integration

Writer Domain (src/writer/)
├── Writer components → Writer workspace
└── copilotkit/ → Writer CopilotKit integration

Host Only (app/)
└── payload-types.ts → Host application only
```

## Import Pattern Analysis

### Heavy Importers (>5 type imports)

**Forge Components**:
- `ForgeWorkspace/ForgeWorkspace.tsx` - 4 type imports
- `ForgeWorkspace/store/forge-workspace-store.tsx` - 6 type imports
- `forge/forge-data-adapter/forge-data-adapter.ts` - 5 type imports

**Writer Components**:
- `WriterWorkspace/WriterWorkspace.tsx` - 3 type imports
- `WriterWorkspace/store/writer-workspace-store.tsx` - 3 type imports

**CopilotKit Components**:
- `forge/copilotkit/actions/workspace/forge-workspace-actions.ts` - 4 type imports
- `writer/copilotkit/actions/workspace/writer-workspace-actions.ts` - 4 type imports
- CopilotKit providers - 3 type imports each

### Cross-Domain Dependencies

**CopilotKit Bridge**:
- CopilotKit actions import domain types (intentional and correct)
- Domain actions import CopilotKit types (proper layering)

**Writer ↔ Forge Bridge**:
- Writer imports `narrative.ts` types (ForgeAct, ForgeChapter, ForgePage)
- This is **intentional and correct** - Writer works with narrative structure

**AI Integration Bridge**:
- AI adapter types used by CopilotKit runtime
- CopilotKit actions use domain workspace types
- Clean architecture with proper boundaries

## Ownership Issues & Recommendations

### Issues Found 🔴

1. **Mixed Domain Types in Single Files**:
   - `src/types/index.ts` exports everything together
   - Makes domain boundaries unclear

2. **Forge Narrative Types Shared with Writer**:
   - Narrative types used by both domains
   - Needs careful coordination for changes

3. **CopilotKit Type Organization**:
   - Domain-specific CopilotKit types are well-separated ✅
   - Base CopilotKit types properly shared ✅

### Recommendations ✅

#### Immediate Actions
1. **Separate Domain Exports**: Create separate index files for each domain
2. **Clear Type Organization**: Group types by domain in exports
3. **Document CopilotKit Types**: Clearly mark AI integration types

#### Target Structure Proposal
```
src/types/
├── shared/           # Cross-package shared
│   ├── constants.ts
│   ├── flags.ts
│   ├── narrative.ts
│   ├── index.ts
│   └── ai/            # AI integration types
│       ├── base-actions.ts
│       └── index.ts
├── forge/            # Forge domain only
│   ├── forge-graph.ts
│   ├── characters.ts
│   ├── forge-game-state.ts
│   ├── ui-constants.ts
│   ├── index.ts
│   └── copilotkit/    # Forge CopilotKit types
│       ├── actions/
│       ├── constants/
│       └── index.ts
├── writer/           # Writer domain
│   ├── index.ts
│   └── copilotkit/    # Writer CopilotKit types
│       ├── actions/
│       ├── constants/
│       └── index.ts
└── index.ts          # Re-exports only shared types
```

#### Migration Strategy
1. **Phase 1**: Reorganize files without breaking imports
2. **Phase 2**: Update imports to use domain-specific exports
3. **Phase 3**: Add CopilotKit type organization
4. **Phase 4**: Enforce boundaries with ESLint rules

## Boundary Enforcement Rules (Updated)

### Recommended ESLint Rules
```javascript
// Writer cannot import Forge CopilotKit types
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/forge/copilotkit/*']
  }],
  // Apply to WriterWorkspace files
}

// Forge cannot import Writer CopilotKit types
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/writer/copilotkit/*']
  }],
  // Apply to ForgeWorkspace files
}

// Both domains can import shared CopilotKit base
{
  'no-restricted-imports': ['error', {
    patterns: [
      '!@/src/ai/copilotkit/actions/base-actions',
      '!@/src/ai/aiadapter/types'
    ]
  }],
  // Apply to both domains
}
```

## Next Steps

### Before Reorganization
1. **Audit Type Usage**: Verify all type locations and importers are identified
2. **Plan CopilotKit Migration**: Map current CopilotKit types to new structure
3. **Test Impact**: Ensure no functionality breaks during reorganization

### During Reorganization  
1. **Maintain Compatibility**: Keep old exports during transition
2. **Update Imports Gradually**: One domain at a time
3. **Organize CopilotKit Types**: Move AI integration types to proper structure

### After Reorganization
1. **Document Type Contracts**: Clear API for shared types
2. **Version Shared Types**: Semver for breaking changes
3. **Monitor CopilotKit Usage**: Watch for unintended cross-domain imports

## Assessment Summary

**Positive Discovery**: CopilotKit integration adds **excellent type organization** with:
- Proper domain separation for CopilotKit types
- Clean shared base types for AI infrastructure
- No cross-domain type violations in CopilotKit code
- Well-structured action type definitions

**Primary Challenge**: Original type organization issues remain, but CopilotKit types serve as a model for proper organization.

**Recommendation**: Maintain CopilotKit type architecture while reorganizing core types into similar domain-separated structure.