# 00 - Ownership Map

## Baseline Repo Topology

### Major Areas Identification

#### Host (app/)
- **Purpose**: Next.js application entry point, PayloadCMS integration, API routes
- **Structure**:
  ```
  app/
  ├── (forge-app)/           # Forge demo app pages
  ├── (payload)/              # PayloadCMS admin and API
  │   ├── admin/             # Payload admin UI
  │   └── api/               # Payload API endpoints
  ├── api/                   # Custom API routes
  │   └── ai/                # AI-related endpoints (writer-focused)
  │       ├── chat/
  │       └── writer/        # Writer workspace AI APIs
  ├── data/                  # Payload data/migrations
  └── lib/                   # Host-side libraries
      ├── ai/
      ├── forge/             # Forge data adapter (host side)
      └── writer/            # Writer data adapter (host side)
  ```

#### Forge Workspace
- **Purpose**: Visual node-based dialogue editing, narrative/storylet graph editors
- **Entry Points**:
  - `src/components/ForgeWorkspace/` - Main Forge workspace component
  - `src/components/GraphEditors/ForgeNarrativeGraphEditor/` - Narrative editor
  - `src/components/GraphEditors/ForgeStoryletGraphEditor/` - Storylet editor

#### Writer Workspace
- **Purpose**: Text-based content creation with AI assistance
- **Entry Points**:
  - `src/components/WriterWorkspace/` - Main Writer workspace component

### Ownership Classification

## Host
**Files that should remain host-only:**
- `app/` - All Next.js app files
- `app/payload-types.ts` - Payload generated types
- PayloadCMS configurations and collections
- `app/lib/ai/` - Host-side AI API integration
- `app/lib/forge/data-adapter/` - Forge-specific Payload adapters
- `app/lib/writer/` - Writer-specific Payload adapters
- `components/` - Root-level demo components (ProjectSwitcher, ThemeSwitcher)

## Forge
**Core Forge domain:**
- `src/components/ForgeWorkspace/` - Main workspace
- `src/components/GraphEditors/ForgeNarrativeGraphEditor/` - Narrative editing
- `src/components/GraphEditors/ForgeStoryletGraphEditor/` - Storylet editing
- `src/components/GraphEditors/shared/` - Shared Forge UI components
- `src/components/GamePlayer/` - Dialogue playback engine
- `src/lib/forge/` - Forge core libraries (yarn-converter, etc.)
- `src/store/forge/` - Forge-specific state

## Writer
**Core Writer domain:**
- `src/components/WriterWorkspace/` - Main workspace
- `src/lib/writer/` - Writer core libraries
- `src/store/writer/` - Writer-specific state

## Shared Candidate Subsystems
**Potential cross-package shared modules:**

### Feature-Shared (GraphEditors only)
- `src/components/GraphEditors/hooks/` - Shared React hooks
- `src/components/GraphEditors/utils/` - Layout algorithms, utilities

### Package-Shared (Forge UI layer)
- `src/components/GraphEditors/shared/` - Nodes, edges, node editor
- `src/components/forge/` - Forge-specific UI components

### Cross-Package Shared
- `src/types/` - Domain model types (need cleanup for Forge/Writer split)
- `src/lib/ai/` - AI foundation (OpenRouter, CopilotKit integration)
- `src/utils/` - Utility functions (review for domain specificity)

## Workspace Entry Points Analysis

### ForgeWorkspace
- **Location**: `src/components/ForgeWorkspace/ForgeWorkspace.tsx`
- **Data Loading**: Uses `app/lib/forge/data-adapter/` via host
- **Structure**: components/, hooks/, store/slices/, utils/

### WriterWorkspace  
- **Location**: `src/components/WriterWorkspace/WriterWorkspace.tsx`
- **Data Loading**: Uses `app/lib/writer/` via host
- **Structure**: editor/, layout/, sidebar/, store/

## Current Boundary Concerns

1. **Mixed types in `src/types/`**: Both Forge and Writer types mixed together
2. **Store organization**: `src/store/` contains both forge and writer, unclear ownership
3. **AI integration**: AI code scattered between `src/lib/ai/`, `app/lib/ai/`, and workspace-specific implementations
4. **GraphEditors sharing**: Clear separation between shared and editor-specific components, but needs formalization

## Next Steps for Discovery
- Import boundary analysis to verify current violations
- Detailed component reuse analysis in GraphEditors
- Type ownership classification
- State management inventory
- AI architecture layering analysis