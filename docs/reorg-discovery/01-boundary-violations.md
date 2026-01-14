# 01 - Boundary Violations

## Critical Boundary Violations Found

### 1. Host Imports by Non-Host Code

**🚨 HIGH PRIORITY - Blocker for Package Boundaries**

#### ForgeWorkspace Importing Host Modules
- **File**: `src/components/ForgeWorkspace/components/ForgeProjectSwitcher.tsx`
- **Violation**: `import { useProjects, useCreateProject, type ProjectDocument } from '@/app/lib/forge/queries';`
- **Impact**: Forge workspace directly imports host-side query utilities
- **Recommendation**: Move queries to shared library or create abstraction layer

### 2. Library Components Importing UI/Store

**🔶 MEDIUM PRIORITY - Architecture Concern**

#### Yarn Converter Importing Store Types
- **Files**: 
  - `src/lib/yarn-converter/types.ts`
  - `src/lib/yarn-converter/workspace-context.ts`
- **Violations**: 
  ```typescript
  import type { ForgeWorkspaceStore } from '@/src/components/ForgeWorkspace/store/forge-workspace-store';
  ```
- **Impact**: Core library (yarn-converter) depends on specific workspace store implementation
- **Recommendation**: Extract shared interfaces to prevent tight coupling

### 3. Cross-Deep Relative Imports

**🔶 MEDIUM PRIORITY - Maintainability Issue**

#### Excessive Relative Depth in Components
Multiple files using deep relative imports (`../../../types/`, `../../../../../`):

**ForgeWorkspace Components**:
- `src/components/ForgeWorkspace/components/FlagManagerModal.tsx`
- `src/components/ForgeWorkspace/components/PlayModal.tsx`
- Multiple other ForgeWorkspace components

**Pattern**: `import { X } from "../../../types/constants"`
- **Impact**: Fragile imports that break with file moves
- **Recommendation**: Use absolute imports (`@/src/types/constants`)

### 4. @/src Import Patterns

**🔶 LOW PRIORITY - Style Consistency**

#### Inconsistent Import Patterns
Multiple files mixing absolute and relative imports:

**Examples**:
- `src/components/forge/forge-data-adapter/forge-data-adapter.ts`
- `src/components/ForgeWorkspace/components/ForgeSidebar.tsx`
- Many UI component imports

**Pattern**: `import { X } from '@/src/components/ui/button';`
- **Impact**: Inconsistent style, potential confusion
- **Recommendation**: Standardize on either relative or absolute imports

### 5. Good News - No Direct Forge ↔ Writer Imports

**✅ POSITIVE FINDING**

No cross-imports found between Forge and Writer workspaces:
- Writer components don't import ForgeWorkspace
- Forge components don't import WriterWorkspace
- This confirms clean separation between the two domains

## Boundary Categories Analysis

### Clear Boundaries (✅)
- **Writer ↔ Forge**: No cross-imports
- **Domain Logic**: Each workspace stays within its domain
- **Store Separation**: Writer and Forge stores are independent

### Violated Boundaries (❌)
- **Host → Library**: ForgeWorkspace importing from `@/app/lib/forge/queries`
- **Library → Store**: Yarn converter importing ForgeWorkspace store types

### Style Inconsistencies (⚠️)
- **Import Patterns**: Mixed relative/absolute imports
- **Path Depth**: Deep relative imports throughout codebase

## Blocking Issues for Package Separation

### Critical Blockers
1. **ForgeProjectSwitcher.tsx** - Must resolve host dependency before Forge can be packaged
2. **Yarn converter** - Must decouple from ForgeWorkspace store to become truly shared

### Migration Safety Concerns
1. **Deep relative imports** - Will break when files are moved to new structure
2. **Inconsistent import paths** - Will cause confusion during reorganization

## Immediate Actions Required

### Before Any File Moves
1. **Fix Host Import**: Resolve ForgeProjectSwitcher's dependency on `@/app/lib/forge/queries`
2. **Extract Interfaces**: Decouple yarn converter from ForgeWorkspace store
3. **Standardize Imports**: Choose relative vs absolute import strategy

### During Reorganization
1. **Update Import Paths**: Fix all deep relative imports
2. **Validate Dependencies**: Ensure no new boundary violations are introduced
3. **Test Package Boundaries**: Verify packages can build independently

## Enforcement Recommendations

### ESLint Rules to Add
```javascript
// Disallow host imports in src/
{
  'no-restricted-imports': ['error', {
    patterns: ['@/app/*']
  }]
}

// Disallow deep relative imports
{
  'import/no-cycle': 'error'
}
```

### Path Aliases to Consider
- `@forge-ui/` - Forge-specific UI components
- `@writer-ui/` - Writer-specific UI components  
- `@shared/` - Cross-domain shared components
- `@types/` - Type definitions (domain-separated)

## Next Steps
1. Resolve critical blocking violations
2. Implement import standardization
3. Add ESLint boundary rules
4. Proceed with safe file reorganization