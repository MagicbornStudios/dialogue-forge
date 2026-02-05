# Dialogue Forge

A comprehensive narrative development platform combining visual dialogue editing, narrative structure management, AI-assisted writing, and runtime simulation. Built as both a **Next.js application** and a **library package** (`@magicborn/dialogue-forge`).

> Monorepo note: The repo now uses pps/host + packages/* (domain packages like @magicborn/forge, @magicborn/writer, @magicborn/video, @magicborn/shared, @magicborn/ai). The umbrella @magicborn/dialogue-forge still re-exports for compatibility. See docs/conventions/repo-structure.md for the current layout.

## 🎯 Project Vision

Dialogue Forge is a **toolkit for narrative teams** that provides:

- **Visual Node-Based Dialogue Editor** - Create branching dialogue with conditions, flags, and storylets
- **Narrative Workspace** - Organize content into acts, chapters, pages, and storylets
- **Writer Workspace** - AI-assisted text-based content creation
- **Yarn Spinner Integration** - Import/export `.yarn` files for game engine integration
- **Flag System** - Game state management with schema-driven validation
- **Runtime Player** - Test dialogues exactly as players will experience them
- **AI Integration** - CopilotKit-powered assistance across all workspaces

## 🏗️ Architecture Analysis & CI/CD Pipeline

### 🔧 **Updated Scripts**

```bash
# Architecture Analysis & Validation
npm run arch:analyze    # Comprehensive codebase analysis
npm run arch:check     # Validate architecture rules
npm run arch:report     # Generate detailed reports
npm run arch:fix        # Auto-fix common issues
npm run arch:ci         # Full CI pipeline with validation

# Development
npm run lint           # ESLint with architecture rules
npm run lint:deps       # Dependency boundary checking
npm run typecheck       # TypeScript compilation
npm run test             # Run test suite

# CI/CD
npm run arch:ci        # Automated architecture validation pipeline
```

### 📊 **Architecture Monitoring**

The project now includes automated architecture analysis that:

1. **Validates domain boundaries** - Prevents forbidden imports
2. **Ensures type safety** - Checks for string literals and any types
3. **Detects circular dependencies** - Prevents architectural debt
4. **Monitors performance** - Identifies large files and deep nesting
5. **Security scanning** - Checks for hardcoded secrets

### 🚀 **CI/CD Integration**

```bash
npm run arch:ci
```

This pipeline:
- Runs comprehensive architecture validation
- Fails build on critical violations
- Generates detailed reports and artifacts
- Provides actionable remediation recommendations
- Maintains architecture quality over time

### 📋 **Usage Examples**

```bash
# Quick analysis
npm run arch:analyze

# Check specific rules
npm run arch:check

# Generate full report
npm run arch:report

# Auto-fix common issues
npm run arch:fix
```

### 🎯 **Benefits**

✅ **Proactive Architecture Enforcement** - Catch issues before they reach production
✅ **Continuous Quality Monitoring** - Automated validation in CI/CD
✅ **Developer-Friendly Tools** - Clear error messages and actionable fixes
✅ **Documentation Generation** - Living architecture documentation
✅ **Team Alignment** - Consistent architecture understanding across team

The application will be available at `http://localhost:3000` with routes:
- `/forge` - Visual dialogue editor
- `/writer` - AI-assisted writing workspace
- `/opencode` - OpenCode AI coding assistant (see [OpenCode Integration](./docs/opencode-integration.md))
- `/admin` - PayloadCMS admin panel

### Install as Library Package

> **Note**: The library package (`@magicborn/dialogue-forge`) is currently in development. The npm package exists but may not be fully functional for standalone use. The primary development focus is on the Next.js application.

```bash
npm install @magicborn/dialogue-forge
```

See [Library Usage](#library-usage) section for API examples.

## 📁 Project Structure

```
dialogue-forge/
├── app/                          # Next.js Host Application
│   ├── (forge)/forge/           # Forge workspace route
│   ├── (writer)/writer/         # Writer workspace route
│   ├── (opencode)/opencode/     # OpenCode integration route
│   ├── (payload)/admin/         # PayloadCMS admin panel
│   ├── api/                     # API routes (AI, CopilotKit)
│   ├── lib/                     # Host-side adapters
│   │   ├── ai/                  # AI data adapter (PayloadCMS)
│   │   ├── forge/               # Forge data adapter
│   │   └── writer/              # Writer data adapter
│   └── payload-collections/     # PayloadCMS collection configs
│
├── src/                          # Library Source (Package Code)
│   ├── shared/                  # Cross-domain shared code
│   │   ├── types/               # Shared types, constants
│   │   ├── ui/                  # Shared UI components
│   │   └── utils/               # Shared utilities
│   ├── forge/                   # Forge Domain
│   │   ├── components/         # Forge UI components
│   │   ├── lib/                 # Forge business logic
│   │   └── types/               # Forge-specific types
│   ├── writer/                  # Writer Domain
│   │   ├── components/          # Writer UI components
│   │   ├── lib/                 # Writer business logic
│   │   └── types/               # Writer-specific types
│   ├── ai/                       # AI Infrastructure
│   │   ├── adapters/            # AI adapters (OpenRouter, etc.)
│   │   └── copilotkit/          # CopilotKit integration
│   └── styles/                   # Global styles and themes
│
├── vendor/                       # Vendor Dependencies (Git Submodules)
│   └── opencode/                 # OpenCode submodule
│
├── public/                       # Static assets
│   └── vendor/                   # Vendor build outputs (gitignored)
│
└── docs/                         # Documentation
    ├── architecture/             # Architecture documentation
    ├── opencode-integration.md   # OpenCode vendor setup
    └── environment-variables.md  # Environment variable reference
```

## 🏗️ Architecture & Layering

### Layer Model

The codebase follows a strict layering model to maintain separation between the host application and the library package:

```
┌─────────────────────────────────────────────────────────┐
│  Host Layer (app/)                                       │
│  - Next.js routes, API endpoints                        │
│  - PayloadCMS integration                                │
│  - Host-specific data adapters                          │
│  - Generated types (payload-types.ts)                   │
└──────────────────┬──────────────────────────────────────┘
                   │ imports
┌──────────────────▼──────────────────────────────────────┐
│  Library Layer (src/)                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Shared (src/shared/)                              │ │
│  │  - Cross-domain types, utilities, UI primitives    │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Domains (src/forge/, src/writer/)                │ │
│  │  - Domain-specific components, logic, types      │ │
│  │  - NO cross-domain imports (Forge ↔ Writer)      │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  AI (src/ai/)                                      │ │
│  │  - AI infrastructure, adapters, contracts        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Import Direction Rules

**Critical**: These rules are non-negotiable and enforced to maintain package independence.

1. **Host (`app/`) may import from `src/`** ✅
   - Host can use library code
   - Example: `import { ForgeWorkspace } from '@magicborn/dialogue-forge'`

2. **Library (`src/`) must NOT import from `app/`** ❌
   - Library must remain independent of host implementation
   - No imports from `app/**` or `app/payload-types.ts`
   - This ensures the library can be used in any host application

3. **Domains may NOT import each other** ❌
   - `src/forge/` cannot import from `src/writer/`
   - `src/writer/` cannot import from `src/forge/`
   - Cross-domain code goes in `src/shared/`

4. **Domains may import from `shared/` and `ai/`** ✅
   - Both Forge and Writer can use shared utilities
   - Both can use AI infrastructure

5. **AI layer is independent** ✅
   - `src/ai/` does not import from domains or host
   - Domains import AI, not the reverse

### North Star Placement Rule

> **Place code in the lowest layer that can own it without depending on higher layers.**

**Decision Tree:**
1. Needs Next.js, PayloadCMS, or host wiring? → **Host (`app/`)**
2. Reused across Forge + Writer? → **Shared (`src/shared/`)**
3. Forge- or Writer-specific? → **Domain (`src/forge/`, `src/writer/`)**
4. AI infrastructure or contracts? → **AI (`src/ai/`)**

**Promotion Pattern**: Start in domain, promote to shared when reused.

### Type Independence Pattern

The library maintains **complete independence** from host types:

- **Library types** (in `src/**`): `ForgeGraphDoc`, `NarrativeAct`, `NarrativeChapter`
- **Host types** (in `app/payload-types.ts`): `ForgeGraph`, `Act`, `Chapter`

**Rules:**
- Library types match PayloadCMS structure for compatibility but are defined independently
- Host provides transformation adapters (`app/lib/forge/data-adapter/`)
- Library code never imports `app/payload-types.ts`

This ensures the library can be used in any host application, not just PayloadCMS.

## 🎨 Conventions & Rules

### Type Constants (CRITICAL)

**NEVER use string literals for types. ALWAYS use exported constants.**

```typescript
// ❌ WRONG
const node: DialogueNode = {
  type: 'npc',  // String literal
};

if (flag.type === 'quest') {  // String literal
  // ...
}

// ✅ CORRECT
import { NODE_TYPE, FLAG_TYPE } from '@magicborn/dialogue-forge';

const node: DialogueNode = {
  type: NODE_TYPE.NPC,  // Constant
};

if (flag.type === FLAG_TYPE.QUEST) {  // Constant
  // ...
}
```

**Available Constants** (from `src/shared/types/constants.ts`):
- `NODE_TYPE`: `NPC`, `PLAYER`, `CONDITIONAL`
- `FLAG_TYPE`: `DIALOGUE`, `QUEST`, `ACHIEVEMENT`, `ITEM`, `STAT`, `TITLE`, `GLOBAL`
- `FLAG_VALUE_TYPE`: `BOOLEAN`, `NUMBER`, `STRING`
- `CONDITION_OPERATOR`: `IS_SET`, `IS_NOT_SET`, `EQUALS`, `NOT_EQUALS`, etc.
- `VIEW_MODE`: `GRAPH`, `YARN`, `PLAY`
- `QUEST_STATE`: `NOT_STARTED`, `STARTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`

**Why This Matters:**
- Type safety at compile time
- Refactoring safety (change constant, all usages update)
- Better IDE autocomplete
- Prevents typos and inconsistencies

### Component Organization

- **Small, focused files**: One component per file, compose higher-level components
- **Feature folders**: Group related components (e.g., `src/forge/components/narrative-editor/`)
- **Single-purpose exports**: Export one component per file unless tightly coupled

### Data Flow

- **UI vs. domain logic**: Keep transformations in `src/shared/utils/` or domain utils
- **Immutable updates**: Always return new arrays/objects when modifying nested structures
- **Explicit props**: Pass state and handlers into subcomponents; avoid hidden imports

### File Naming

- Components: `PascalCase.tsx` (e.g., `ForgeWorkspace.tsx`)
- Utilities: `kebab-case.ts` (e.g., `reactflow-converter.ts`)
- Types: `kebab-case.ts` (e.g., `forge-graph.ts`)
- Constants: `constants.ts` (always in `types/` folder)

## 🎨 Theming

Dialogue Forge supports multiple themes via CSS custom properties:

**Available Themes:**
- `dark-fantasy` (default)
- `light`
- `cyberpunk`
- `darcula`
- `high-contrast`

**Theme System:**
- Themes defined in `src/styles/themes.css`
- Uses CSS custom properties (`--color-df-*`)
- Theme switching via `data-theme` attribute on `<html>`
- Theme switcher component: `components/ThemeSwitcher.tsx`

**Domain-Specific Tokens:**
- `--color-df-info-*` - Information/blue colors
- `--color-df-edge-choice-*-*` - Choice edge colors
- `--color-df-warning-*` - Warning/amber colors
- `--color-df-success-*` - Success/green colors

Themes are applied globally and affect all workspaces (Forge, Writer, etc.).

## 📦 Vendor Dependencies

The `vendor/` folder contains **git submodules** for external dependencies that we vendor (include directly) rather than install via npm.

### Why Vendor?

We vendor dependencies when:
1. **Source access needed** - We need to customize the UI or behavior
2. **Not published** - The dependency isn't available as an npm package
3. **Version control** - We want to track exact commits and maintain customizations
4. **Integration** - We need to embed it in our app (e.g., iframe integration)

### Current Vendors

#### OpenCode (`vendor/opencode/`)

OpenCode is an AI-powered coding assistant. We vendor it to:
- Embed the SolidJS web UI in our Next.js app
- Customize the UI to match our theming
- Receive upstream updates while maintaining customizations

**Setup & Usage:**
See [docs/opencode-integration.md](./docs/opencode-integration.md) for complete documentation.

**Quick Commands:**
```bash
# Install dependencies
npm run vendor:opencode:install

# Development (hot reload)
npm run vendor:opencode:dev

# Production build
npm run vendor:opencode:build
npm run vendor:opencode:sync

# Update to latest upstream
npm run vendor:opencode:update-and-build
```

### Adding a New Vendor

1. **Add as git submodule:**
   ```bash
   git submodule add <repository-url> vendor/<name>
   git submodule update --init --recursive
   ```

2. **Add build scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "vendor:<name>:install": "cd vendor/<name> && npm install",
       "vendor:<name>:build": "cd vendor/<name> && npm run build",
       "vendor:<name>:sync": "node scripts/sync-<name>.js"
     }
   }
   ```

3. **Create sync script** (`scripts/sync-<name>.js`):
   - Copy build output to `public/vendor/<name>/`
   - Handle path normalization

4. **Update `.gitignore`**:
   - Exclude `public/vendor/<name>/` (build artifacts)
   - Keep `vendor/<name>/` tracked (it's a submodule)

5. **Document integration** in `docs/<name>-integration.md`

### Vendor Update Workflow

```bash
# Automated update (recommended)
npm run vendor:<name>:update-and-build

# Manual update
cd vendor/<name>
git fetch origin
git merge origin/main
cd ../..
npm run vendor:<name>:build
npm run vendor:<name>:sync
```

## 📚 Library Usage

> **Status**: The library package is in development. While it can be installed via npm, it may not be fully functional for standalone use. The primary development focus is on the Next.js application.

### Installation

```bash
npm install @magicborn/dialogue-forge
```

### Basic Usage

```typescript
import {
  DialogueGraphEditor,
  GamePlayer,
  importFromYarn,
  exportToYarn,
  FLAG_TYPE,
  NODE_TYPE,
  type DialogueTree,
  type FlagSchema
} from '@magicborn/dialogue-forge';
```

### Define Flags

```typescript
const flagSchema: FlagSchema = {
  categories: ['quests', 'items'],
  flags: [
    {
      id: 'quest_main',
      name: 'Main Quest',
      type: FLAG_TYPE.QUEST,
      category: 'quests',
      valueType: FLAG_VALUE_TYPE.STRING
    }
  ]
};
```

### Edit Dialogue

```tsx
<DialogueGraphEditor
  dialogue={dialogue}
  onChange={(updated) => {
    const yarn = exportToYarn(updated);
    saveFile('dialogue.yarn', yarn);
  }}
  flagSchema={flagSchema}
/>
```

### Run Dialogue

```tsx
<GamePlayer
  dialogue={dialogue}
  gameStateFlags={gameFlags}
  onComplete={(result) => {
    // Update game state with new flags
    gameState.flags = result.updatedFlags;
  }}
/>
```

See the [API Reference](#api-reference) section for complete documentation.

## 🔧 Environment Variables

All environment variables are documented in `.env.example` with inline comments.

**Required:**
- `OPENROUTER_API_KEY` - For AI features (CopilotKit, Writer, Forge AI assistance)
- `PAYLOAD_SECRET` - For PayloadCMS encryption (change from default in production!)

**Optional:**
- `NEXT_PUBLIC_OPENCODE_UI_DEV_URL` - OpenCode dev server URL (for hot reload)
- `AI_TEMPERATURE`, `AI_MAX_OUTPUT_TOKENS` - AI runtime configuration
- `PAYLOAD_PUBLIC_SERVER_URL` - PayloadCMS server URL

See [docs/environment-variables.md](./docs/environment-variables.md) for complete reference.

**Quick Setup:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

## 🛣️ Roadmap

### Current State (v0.1.8)

- ✅ Next.js application with Forge, Writer, and OpenCode workspaces
- ✅ PayloadCMS integration for data persistence
- ✅ AI assistance via CopilotKit and OpenRouter
- ✅ Yarn Spinner import/export
- ✅ Flag system with schema validation
- ✅ Multiple themes
- ✅ Vendor dependency system (OpenCode)

### Short Term

- 🔄 **Library Package Stability** - Fix npm package for standalone use
- 🔄 **Type Safety Audit** - Replace remaining string literals with constants
- 🔄 **Storylet Export** - Define Yarn export strategy for storylets/randomizers
- 🔄 **Documentation** - Complete API documentation and integration guides

### Medium Term

- 📋 **Testing** - Unit tests for core logic, integration tests for workspaces
- 📋 **Performance** - Optimize large graph rendering, virtual scrolling
- 📋 **Accessibility** - Keyboard navigation, screen reader support
- 📋 **Export Formats** - Additional export formats (JSON, XML, etc.)

### Long Term

- 🎯 **Plugin System** - Extensible plugin architecture for custom node types
- 🎯 **Collaboration** - Real-time collaborative editing
- 🎯 **Version Control** - Built-in versioning and branching for dialogue trees
- 🎯 **Game Engine SDKs** - Native integrations for Unity, Unreal, Godot

## 📖 Documentation

### Architecture

- **[docs/architecture/BOUNDARIES.md](./docs/architecture/BOUNDARIES.md)** - Layer boundaries and import rules
- **[docs/architecture/FILE-PLACEMENT.md](./docs/architecture/FILE-PLACEMENT.md)** - File placement decision tree
- **[docs/architecture/GLOSSARY.md](./docs/architecture/GLOSSARY.md)** - Architecture glossary
- **[docs/architecture/PATTERNS.md](./docs/architecture/PATTERNS.md)** - Architecture patterns and recommended practices
- **[ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md)** - Architecture review and cleanup priorities

### Integration

- **[docs/opencode-integration.md](./docs/opencode-integration.md)** - OpenCode vendor integration
- **[docs/environment-variables.md](./docs/environment-variables.md)** - Environment variable reference
- **[docs/copilotkit-setup.md](./docs/copilotkit-setup.md)** - CopilotKit AI setup

### Development

- **[AGENTS.md](./AGENTS.md)** - AI agent guide (coding preferences, conventions)
- **[docs/nodes-and-editors.md](./docs/nodes-and-editors.md)** - Node types and editor architecture

### Domain Docs

- **[docs/forge.md](./docs/forge.md)** - Forge domain overview
- **[docs/writer.md](./docs/writer.md)** - Writer domain overview
- **[docs/shared.md](./docs/shared.md)** - Shared domain overview
- **[docs/ai.md](./docs/ai.md)** - AI domain overview
- **[docs/runtime.md](./docs/runtime.md)** - Runtime systems overview

## 🧪 Development

### Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:watch        # Watch library TypeScript compilation

# Building
npm run build            # Build Next.js app
npm run build:lib        # Build library package
npm run build:types      # Generate PayloadCMS types

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:ui          # Test UI

# Vendors
npm run vendor:opencode:install    # Install OpenCode dependencies
npm run vendor:opencode:dev        # Run OpenCode dev server
npm run vendor:opencode:build      # Build OpenCode UI
npm run vendor:opencode:sync       # Sync build to public/
npm run vendor:opencode:update-and-build  # Update and rebuild
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint (configured in `.eslintrc.cjs`)
- **Formatting**: Prettier (configured in `package.json`)
- **Type Safety**: No `any` types, use constants instead of string literals

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the architecture documentation and follow the conventions outlined in this README and `AGENTS.md`.

**Key Guidelines:**
- Follow the layer boundaries (no `src/` imports from `app/`)
- Use constants, not string literals
- Place code in the lowest appropriate layer
- Document new features and integrations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/MagicbornStudios/dialogue-forge/issues)
- **Documentation**: See `docs/` folder
- **Agent Guide**: See `AGENTS.md` for AI agent assistance

---

**Dialogue Forge** - Built for narrative teams, powered by modern web technologies.



