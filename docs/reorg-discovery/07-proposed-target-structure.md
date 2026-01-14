# 07 - Proposed Target Structure

## Executive Summary

This proposal creates a **clean monorepo-style architecture** within the single repo, with explicit package boundaries, clear ownership models, and systematic migration phases. The structure balances maintainability with gradual migration safety.

## Target Directory Structure

```
dialogue-forge/
├── app/                           # Host-only (Next.js + PayloadCMS)
│   ├── (forge-app)/              # Forge demo app
│   ├── (payload)/                # PayloadCMS admin & API
│   ├── api/                      # API routes (AI, Forge, Writer)
│   ├── lib/                      # Host libraries
│   │   ├── ai/                   # AI core (move from src/)
│   │   ├── forge/                # Forge data adapters
│   │   └── writer/               # Writer data adapters
│   └── payload-types.ts          # Generated Payload types (host-only)
│
├── src/                          # Shared library (package-like)
│   ├── shared/                   # Cross-package shared
│   │   ├── types/                # Shared type definitions
│   │   │   ├── constants.ts      # VIEW_MODE, FLAG_TYPE, etc.
│   │   │   ├── flags.ts          # Flag system types
│   │   │   ├── narrative.ts     # Act/Chapter/Page types
│   │   │   └── index.ts
│   │   ├── ui/                   # Shared UI components
│   │   │   ├── button/           # Generic buttons
│   │   │   ├── modal/            # Generic modals
│   │   │   └── index.ts
│   │   ├── utils/                # Shared utilities
│   │   │   ├── array.ts          # Array helpers
│   │   │   ├── object.ts         # Object helpers
│   │   │   └── index.ts
│   │   └── index.ts              # Public shared exports
│   │
│   ├── forge/                    # Forge domain package
│   │   ├── types/                # Forge-specific types
│   │   │   ├── forge-graph.ts    # Graph model
│   │   │   ├── characters.ts    # Character system
│   │   │   ├── forge-game-state.ts
│   │   │   └── index.ts
│   │   ├── ui/                   # Forge UI layer
│   │   │   ├── constants.ts      # UI constants
│   │   │   ├── components/       # Forge-specific UI
│   │   │   └── index.ts
│   │   ├── stores/               # Forge state management
│   │   │   ├── forge-workspace-store/
│   │   │   │   ├── index.ts
│   │   │   │   └── slices/       # graph, gameState, viewState, project
│   │   │   └── index.ts
│   │   ├── components/           # Forge components
│   │   │   ├── ForgeWorkspace/
│   │   │   ├── GraphEditors/     # Move from src/components/
│   │   │   │   ├── shared/       # GraphEditors shared
│   │   │   │   ├── ForgeNarrativeGraphEditor/
│   │   │   │   └── ForgeStoryletGraphEditor/
│   │   │   ├── GamePlayer/       # Dialogue player
│   │   │   └── index.ts
│   │   ├── lib/                  # Forge libraries
│   │   │   ├── yarn-converter/   # Yarn integration
│   │   │   └── index.ts
│   │   ├── events/               # Forge event system
│   │   │   ├── events.ts
│   │   │   └── index.ts
│   │   └── index.ts              # Public Forge exports
│   │
│   ├── writer/                   # Writer domain package
│   │   ├── types/                # Writer-specific types
│   │   │   ├── writer-patches.ts # Patch operations
│   │   │   └── index.ts
│   │   ├── stores/               # Writer state management
│   │   │   ├── writer-workspace-store/
│   │   │   │   ├── index.ts
│   │   │   │   └── slices/       # content, editor, ai, navigation
│   │   │   └── index.ts
│   │   ├── components/           # Writer components
│   │   │   ├── WriterWorkspace/
│   │   │   │   ├── layout/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── editor/
│   │   │   │   └── store/
│   │   │   └── index.ts
│   │   ├── lib/                  # Writer libraries
│   │   │   ├── data-adapter/     # Writer data adapter
│   │   │   └── index.ts
│   │   └── index.ts              # Public Writer exports
│   │
│   ├── ai/                       # Cross-package AI core
│   │   ├── core/                 # AI infrastructure
│   │   │   ├── ai-adapter.ts    # Move from app/lib/ai/
│   │   │   ├── model-router.ts   # Model selection
│   │   │   ├── streaming.ts      # Streaming utilities
│   │   │   └── index.ts
│   │   ├── contracts/            # AI contract types
│   │   │   ├── core-contracts.ts  # Shared interfaces
│   │   │   ├── writer-contracts.ts
│   │   │   └── index.ts
│   │   ├── writer/               # Writer AI layer
│   │   │   ├── patch-system.ts   # Patch operations
│   │   │   └── index.ts
│   │   ├── forge/                # Forge AI layer (future)
│   │   │   └── index.ts
│   │   └── index.ts              # Public AI exports
│   │
│   └── index.ts                  # Main library exports
│
├── components/                    # Demo-only components
│   ├── ProjectSwitcher.tsx       # Keep at root
│   └── ThemeSwitcher.tsx         # Keep at root
│
├── docs/                         # Documentation
│   └── reorg-discovery/          # Discovery phase outputs
│
└── package.json                  # Root dependencies
```

## Key Architectural Principles

### 1. Domain Separation ✅
- **Clear Boundaries**: Each domain has its own types, stores, components
- **No Cross-Imports**: Forge ↔ Writer prohibited
- **Shared Layer**: Only through `src/shared/` or `src/ai/`

### 2. Type Independence Pattern ✅
- **Host Types Stay Host**: `app/payload-types.ts` never imported by src/
- **Domain Types Independent**: Each domain defines its own types
- **Shared Types**: Explicitly separated in `src/shared/types/`

### 3. Layering Hierarchy ✅
```
Host (app/)                          # PayloadCMS + Next.js
    ↓ imports
Shared Library (src/)                # Cross-domain utilities
    ↓ imports
Domain Packages (src/forge/, src/writer/)  # Domain-specific
    ↓ imports  
AI Core (src/ai/core/)              # Shared AI infrastructure
```

## Boundary Enforcement Strategy

### ESLint Rules
```javascript
// Host cannot import from domain packages
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/forge/*', '@/src/writer/*']
  }],
  // Apply to app/ directory
}

// Forge cannot import Writer
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/writer/*']
  }],
  // Apply to src/forge/
}

// Writer cannot import Forge
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/forge/*']
  }],
  // Apply to src/writer/
}

// Domains use shared/ and ai/ only
{
  'no-restricted-imports': ['error', {
    patterns: [
      '!@/src/shared/*',
      '!@/src/ai/*'
    ]
  }],
  // Apply to domain packages
}
```

### Path Aliases
```json
{
  "paths": {
    "@shared/*": ["./src/shared/*"],
    "@forge/*": ["./src/forge/*"],
    "@writer/*": ["./src/writer/*"],
    "@ai/*": ["./src/ai/*"]
  }
}
```

## Migration Phases

### Phase 1: Infrastructure Setup (Week 1-2)
**Goal**: Create target structure without breaking existing code

#### 1.1 Create New Directory Structure
```bash
mkdir -p src/{shared,forge,writer,ai}
mkdir -p src/shared/{types,ui,utils}
mkdir -p src/forge/{types,ui,stores,components,lib,events}
mkdir -p src/writer/{types,stores,components,lib}
mkdir -p src/ai/{core,contracts,writer,forge}
```

#### 1.2 Move AI Core to Shared Layer
- Move `app/lib/ai/ai-adapter.ts` → `src/ai/core/ai-adapter.ts`
- Create AI contract types in `src/ai/contracts/`
- Update API routes to import from new location

#### 1.3 Reorganize Shared Types
- Create `src/shared/types/` with clear separation
- Move appropriate types from `src/types/`
- Update imports gradually (maintain backward compatibility)

**Risk**: Low - no breaking changes yet

### Phase 2: Domain Package Creation (Week 3-4)
**Goal**: Create Forge and Writer packages with clear boundaries

#### 2.1 Forge Package Structure
- Move `src/components/ForgeWorkspace/` → `src/forge/components/ForgeWorkspace/`
- Move `src/components/GraphEditors/` → `src/forge/components/GraphEditors/`
- Move `src/components/GamePlayer/` → `src/forge/components/GamePlayer/`
- Move `src/components/forge/` → `src/forge/components/forge/`
- Move `src/components/ForgeWorkspace/store/` → `src/forge/stores/`

#### 2.2 Writer Package Structure
- Move `src/components/WriterWorkspace/` → `src/writer/components/WriterWorkspace/`
- Move `src/lib/writer/` → `src/writer/lib/`
- Move `src/store/writer/` → `src/writer/stores/`

#### 2.3 Type Organization
- Move domain-specific types to appropriate packages
- Create package-level index.ts files
- Maintain backward compatibility exports

**Risk**: Medium - requires systematic import updates

### Phase 3: Boundary Enforcement (Week 5)
**Goal**: Add enforcement and fix violations

#### 3.1 Implement ESLint Rules
- Add boundary enforcement rules
- Configure path aliases
- Set up automated checking

#### 3.2 Fix Critical Violations
- Fix `ForgeProjectSwitcher.tsx` host import
- Decouple yarn converter from Forge store
- Update all deep relative imports

#### 3.3 Validate Package Independence
- Test that packages build independently
- Verify no cross-domain imports
- Update documentation

**Risk**: Medium - potential breaking changes

### Phase 4: Writer Parity Enhancements (Week 6-7)
**Goal**: Implement missing Forge patterns in Writer

#### 4.1 Add Data Adapter Pattern
- Implement `WriterDataAdapter` interface (already exists)
- Update `WriterWorkspace` to accept data adapter
- Add event system integration

#### 4.2 Refactor Writer Store to Slices
- Create slice architecture matching Forge
- Migrate existing store functionality
- Update component selectors

#### 4.3 Enhance Writer UI
- Add multi-tool sidebar (tree, outline, tools)
- Implement comprehensive error handling
- Add keyboard shortcuts and panel persistence

**Risk**: Low - internal improvements only

### Phase 5: Final Polish & Documentation (Week 8)
**Goal**: Complete migration and document new architecture

#### 5.1 Clean Up Legacy Code
- Remove old directory structure
- Clean up unused imports
- Update build scripts

#### 5.2 Documentation
- Update AGENTS.md with new patterns
- Create migration guide for contributors
- Document public APIs

#### 5.3 Testing & Validation
- Comprehensive testing of all workspaces
- Performance benchmarking
- Accessibility validation

**Risk**: Low - final polish phase

## Immediate Benefits After Migration

### Development Experience
- **Clear Ownership**: Every file has predictable location
- **Type Safety**: Better type isolation and checking
- **IDE Support**: Improved autocomplete and navigation
- **Faster Development**: Less time wondering where things go

### Maintenance
- **Reduced Coupling**: Clear boundaries prevent cross-domain issues
- **Easier Testing**: Packages can be tested independently
- **Better Documentation**: Clear separation makes docs more useful
- **Scalable Structure**: Easy to add new features or domains

### Code Quality
- **Consistent Patterns**: Shared patterns across domains
- **Better Error Handling**: Systematic error boundaries
- **Performance**: Cleaner dependency trees
- **Reusability**: Clear shared vs specific components

## Risk Mitigation

### Technical Risks
1. **Breaking Changes**: Mitigate with backward compatibility during migration
2. **Import Hell**: Use systematic search/replace and validation
3. **Build Failures**: Test each phase independently
4. **Performance Regression**: Benchmark at each phase

### Project Risks
1. **Timeline Overruns**: Each phase is independently valuable
2. **Team Disruption**: Provide clear migration guide and support
3. **Feature Conflicts**: Schedule around feature freezes
4. **Rollback Complexity**: Maintain ability to rollback at each phase

## Success Metrics

### Quantitative
- **Zero Boundary Violations**: All ESLint rules pass
- **Build Time Improvement**: Cleaner dependency trees
- **Test Coverage**: Maintain or improve coverage
- **Bundle Size**: No significant increase

### Qualitative
- **Developer Feedback**: Survey developers on new structure
- **Code Review Quality**: Easier reviews with clear boundaries
- **Onboarding Time**: Faster for new team members
- **Feature Velocity**: Measure development speed post-migration

## Next Steps

### Immediate (This Week)
1. **Get Stakeholder Approval**: Review proposal with team
2. **Create Migration Branch**: Start Phase 1 infrastructure
3. **Set Up Tooling**: Configure ESLint rules and path aliases
4. **Begin AI Core Migration**: First concrete migration step

### Short Term (Next 2 Weeks)
1. **Complete Phase 1-2**: Infrastructure and package creation
2. **Regular Updates**: Weekly progress reports
3. **Early Feedback**: Get team feedback on new structure
4. **Adjust Plan**: Refine based on real-world migration experience

### Long Term (Next 2 Months)
1. **Complete Full Migration**: All phases implemented
2. **Measure Success**: Track success metrics
3. **Document Lessons**: Capture learnings for future projects
4. **Plan Enhancements**: Plan next improvements based on new structure

## Conclusion

This migration creates a **professional, maintainable architecture** that will serve the project well as it grows. The phased approach minimizes risk while delivering incremental benefits. The new structure follows industry best practices while respecting the existing codebase's unique characteristics.

The investment in this reorganization will pay dividends in:
- **Developer productivity** through clear organization
- **Code quality** through enforced boundaries  
- **Scalability** through modular architecture
- **Maintainability** through systematic patterns

With careful execution following the phased approach, this migration can be completed with minimal disruption while immediately improving the development experience.