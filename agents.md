# Dialogue Forge - Agent Guide

This document provides comprehensive information for AI agents working on the Dialogue Forge project. It covers project structure, coding preferences, and best practices.

## Project Overview

Dialogue Forge is a visual node-based dialogue editor with Yarn Spinner support for game development. It's built as an npm package (`@magicborn/dialogue-forge`) that can be used as a library or run as a standalone demo application.

### Key Features
- Visual node-based dialogue editor (React Flow)
- Yarn Spinner import/export
- Flag system for game state management
- Multiple view modes (graph, yarn, play)
- Built-in guide and documentation

## Project Structure

```
dialogue-forge/
├── src/                    # Library source code
│   ├── forge/              # Forge domain (graph editor, forge types, forge UI)
│   ├── writer/             # Writer domain (writer workflows, writer UI)
│   ├── shared/             # Cross-domain types, utilities, UI primitives
│   ├── ai/                 # AI infrastructure + domain AI adapters
│   └── styles/             # CSS files
├── app/                    # Next.js demo application (root level)
│   ├── (forge-app)/        # Demo app directory
│   │   ├── layout.tsx      # Root layout (NO shared dependencies)
│   │   └── page.tsx        # Demo page
│   └── components/         # Demo-specific components
├── dist/                   # Built output (generated)
├── bin/                    # CLI scripts
└── package.json            # Main package config
```

## Critical Coding Preferences

### ⚠️ NEVER Use String Literals for Types

**ALWAYS use exported constants instead of string literals.** This is a strict requirement.

#### ❌ WRONG - String Literals
```typescript
// BAD - Don't do this
const node: DialogueNode = {
  type: 'npc',  // ❌ String literal
  // ...
};

if (flag.type === 'quest') {  // ❌ String literal
  // ...
}

const viewMode: ViewMode = 'graph';  // ❌ String literal
```

#### ✅ CORRECT - Use Constants
```typescript
import { NODE_TYPE, FLAG_TYPE, VIEW_MODE } from '@magicborn/dialogue-forge';

// GOOD - Use constants
const node: DialogueNode = {
  type: NODE_TYPE.NPC,  // ✅ Constant
  // ...
};

if (flag.type === FLAG_TYPE.QUEST) {  // ✅ Constant
  // ...
}

const viewMode: ViewMode = VIEW_MODE.GRAPH;  // ✅ Constant
```

### Available Constants

All constants are exported from `src/shared/types/constants.ts`:

- **`NODE_TYPE`**: `NPC`, `PLAYER`, `CONDITIONAL`
- **`FLAG_TYPE`**: `DIALOGUE`, `QUEST`, `ACHIEVEMENT`, `ITEM`, `STAT`, `TITLE`, `GLOBAL`
- **`FLAG_VALUE_TYPE`**: `BOOLEAN`, `NUMBER`, `STRING`
- **`CONDITION_OPERATOR`**: `IS_SET`, `IS_NOT_SET`, `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `GREATER_EQUAL`, `LESS_EQUAL`
- **`VIEW_MODE`**: `GRAPH`, `YARN`, `PLAY`
- **`QUEST_STATE`**: `NOT_STARTED`, `STARTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`

### Why This Matters

1. **Type Safety**: TypeScript can catch errors at compile time
2. **Refactoring**: Changing a constant updates all usages automatically
3. **IDE Support**: Autocomplete and IntelliSense work better
4. **Consistency**: Prevents typos and inconsistencies

## Maintainability Guidelines

### Component Organization
- **Small, focused files**: Keep reusable UI elements in their own files (e.g., `ListPanel.tsx`, `StoryletPanel.tsx`) and compose higher-level components from them.
- **Feature folders are OK**: For larger UIs, group related components under a folder (e.g., `src/forge/components/narrative-editor/`) with a local `index.ts`.
- **Prefer single-purpose exports**: Export one component per file unless helpers are tightly coupled and only used together.

### Utilities & Data Flow
- **UI vs. domain logic**: Keep data transformations in `src/shared/utils/` or the domain's local utils and keep components focused on rendering + wiring handlers.
- **Explicit props over implicit coupling**: Pass state and handlers into subcomponents; avoid hidden imports or global state.
- **Use immutable updates**: Always return new arrays/objects when modifying nested structures to keep React updates predictable.
- **Deduplicate helpers**: If a helper is reused across components (e.g., ID generation or list parsing), promote it to `src/shared/utils/` instead of re-implementing it.

### Stability & Bug Prevention
- **Guard optional data**: Fail fast when required selections are missing, and provide clear empty states.
- **Keep side-effects localized**: Use `useEffect` sparingly and keep its dependencies explicit.
- **Be conservative with edits**: Prefer small, reviewable changes over sweeping rewrites.

### Documentation Style
- **Structure matters**: Use headings and short lists; avoid large paragraphs.
- **Include intent**: Document the “why” in addition to the “what” for non-obvious decisions.

## Architecture Boundaries (North Star Rules)

### North Star Placement Rule

> **Place code in the lowest layer that can own it without depending on higher layers.**

If later reused across domains, **promote it upward** from domain → shared.

### Import Direction Rule (Non-Negotiable)

- **`src/**` must not import `app/**` or `app/payload-types.ts`.**

## Key Concepts

### Dialogue Tree Structure

A `DialogueTree` contains:
- `id`: Unique identifier
- `title`: Display name
- `startNodeId`: Entry point node ID
- `nodes`: Record of `DialogueNode` objects

### Node Types

1. **NPC Nodes** (`NODE_TYPE.NPC`): Character dialogue lines
   - Has `content` (text)
   - Has `nextNodeId` (linear flow)
   - Can have `characterId` reference

2. **Player Nodes** (`NODE_TYPE.PLAYER`): Player choice points
   - Has `choices` array
   - Each choice has `text`, `nextNodeId`, optional `conditions`

3. **Conditional Nodes** (`NODE_TYPE.CONDITIONAL`): Logic branching
   - Has `blocks` array with conditions and outcomes
   - Evaluates flags to determine flow

### Flag System

Flags represent game state (quests, items, stats, etc.):

```typescript
import { FLAG_TYPE, FLAG_VALUE_TYPE, FlagSchema } from '@magicborn/dialogue-forge';

const flagSchema: FlagSchema = {
  categories: ['quests', 'items'],
  flags: [
    {
      id: 'quest_main',
      name: 'Main Quest',
      type: FLAG_TYPE.QUEST,  // ✅ Use constant
      category: 'quests',
      valueType: FLAG_VALUE_TYPE.STRING
    }
  ]
};
```

### View Modes

`DialogueGraphEditor` supports three view modes:
- `VIEW_MODE.GRAPH`: Visual node editor
- `VIEW_MODE.YARN`: Text-based Yarn format view
- `VIEW_MODE.PLAY`: Interactive dialogue player

### Type Independence Pattern

**CRITICAL**: The library maintains complete independence from host app types.

#### Library Types vs Host App Types

The library defines internal types that are designed to match PayloadCMS structures for compatibility, but are completely independent:

- **Library types** (in domain/shared folders): `ForgeGraphDoc`, `NarrativeAct`, `NarrativeChapter`, `NarrativePage`
- **Host app types** (in `app/payload-types.ts`): `ForgeGraph`, `Act`, `Chapter`, `Page`

#### Rules

1. **NEVER import host app types in library code**: Library files in `src/` must NEVER import from `@/app/payload-types` or any host app paths
2. **Match structure, not types**: Library types should match PayloadCMS structure for compatibility, but be defined independently
3. **Transformation in host app**: Host apps should provide transformation utilities to convert PayloadCMS documents to library types
4. **Examples**:
   - ✅ `ForgeGraphDoc` in `src/forge/types/forge-graph.ts` - matches `ForgeGraph` structure but is independent
   - ✅ `NarrativeAct` in `src/writer/types/narrative.ts` - matches `Act` structure but is independent
   - ❌ Importing `Act` from `@/app/payload-types` in library code

#### Why This Matters

- **Portability**: Library can be used in any host app, not just PayloadCMS
- **Independence**: Library doesn't break when host app types change
- **Clear boundaries**: Separation of concerns between library and host app

## Working with the Codebase

### Demo Application

The Next.js demo application runs from the **root directory**:
- Next.js app files are in `app/`, `components/`, `public/`, `styles/` at root
- Uses `@magicborn/dialogue-forge/src/...` imports which resolve via webpack alias
- All dependencies are in root `package.json`
- Build command: `npm run build:next` or `next build`
- Dev command: `npm run dev` or `next dev`

**Important**: 
- The demo imports source files directly: `@magicborn/dialogue-forge/src/forge/...` or `@magicborn/dialogue-forge/src/shared/...`
- Webpack is configured in `next.config.mjs` to resolve `@magicborn/dialogue-forge` to root
- Path mapping in `tsconfig.json` ensures TypeScript resolves imports correctly

### Building

```bash
# Build the library
npm run build

# Run demo locally
npm run dev

# Run tests
npm test
```

### Adding Dependencies

1. **Library dependencies**: Add to root `package.json` `dependencies`
2. **Demo dependencies**: Add to root `package.json` `dependencies`
3. **Dev dependencies**: Add to respective `devDependencies`

### Type Exports

All public types are exported from `src/index.ts`. When adding new types:
1. Define in the appropriate domain/shared folder (e.g., `src/forge/types/`, `src/writer/types/`, `src/shared/types/`)
2. Export from the local domain/shared index
3. Re-export from `src/index.ts`

## Common Tasks

### Adding a New Node Type

1. Define constant in `src/shared/types/constants.ts`:
   ```typescript
   export const NODE_TYPE = {
     // ... existing
     NEW_TYPE: 'new_type',
   } as const;
   ```

2. Update `NodeType` type
3. Create component in `src/forge/components/NewTypeNodeV2.tsx`
4. Register in `DialogueGraphEditor.tsx` `nodeTypes` object
5. Update the Forge graph converter to handle conversion

### Adding a New Flag Type

1. Add constant to `FLAG_TYPE` in `src/shared/types/constants.ts`
2. Update `FlagType` type
3. Update flag validation in the Forge domain lib (e.g., `src/forge/lib/flag-manager.ts`)
4. Update UI components if needed (FlagSelector, FlagManager)

### Modifying the Demo

1. Edit files in the root demo application (`app/`, `components/`, etc.)
2. Ensure all imports use `@magicborn/dialogue-forge` package
3. Never reference paths outside the repo
4. Test that `npm run build` works in demo folder

### Exporting to Yarn Format

The Yarn converter is in the Forge domain (e.g., `src/forge/lib/yarn-converter/`):
- `exportToYarn(dialogue)`: Converts DialogueTree to Yarn string
- `importFromYarn(yarnContent, title)`: Parses Yarn to DialogueTree

## File Organization

### Components

- **V2 Components**: Modern React components (DialogueGraphEditor, NPCNodeV2, etc.)
- **Legacy Components**: Older components (may exist for compatibility)
- **Utility Components**: Reusable UI (FlagSelector, CharacterSelector, etc.)

### Types

- `src/shared/types/constants.ts`: **All constants** (most important file)
- `src/shared/types/index.ts`: Main shared type exports
- `src/shared/types/flags.ts`: Flag system types
- `src/shared/types/characters.ts`: Character types
- `src/shared/types/conditionals.ts`: Conditional logic types

### Utilities

- `src/forge/utils/reactflow-converter.ts`: Converts between DialogueTree and React Flow format
- `src/forge/utils/layout/`: Graph layout algorithms (dagre, etc.)
- `src/forge/utils/node-helpers.ts`: Node manipulation utilities

## Testing

Tests use Vitest. Key test files:
- `src/**/*.test.ts`: Unit tests
- Test utilities in `src/shared/utils/` if needed

### Build Requirement

Always run `npm run build` after making changes to ensure the app builds cleanly. If the build fails, fix the issue before finalizing your work.

## Deployment

### Publishing the Package

1. Update version in `package.json`
2. Run `npm run build`
3. Run `npm publish`

### Deploying to Vercel

The Next.js app runs from the root directory. Configure Vercel as follows:

1. **Root Directory**: Leave empty (use repo root)
2. **Build Command**: `npm install && npm run build:next`
3. **Output Directory**: `.next`
4. **Install Command**: `npm install` (default)

**Note**: The demo imports source files directly (`@magicborn/dialogue-forge/src/...`). Webpack in `next.config.mjs` resolves these imports to the local source files.

## Important Notes

1. **String Literals**: Never use string literals for types - always use constants
2. **Demo Independence**: Demo must work without shared packages
3. **Type Safety**: Leverage TypeScript types and constants
4. **Constants First**: Check `src/shared/types/constants.ts` before adding new string values
5. **Component Naming**: V2 components use `V2` suffix (e.g., `NPCNodeV2`)

## Quick Reference

### Import Patterns

```typescript
// Types and constants
import { NODE_TYPE, FLAG_TYPE, VIEW_MODE, type DialogueTree } from '@magicborn/dialogue-forge';

// Components
import { DialogueGraphEditor } from '@magicborn/dialogue-forge';

// Utilities
import { exportToYarn, importFromYarn } from '@magicborn/dialogue-forge';
```

### Common Patterns

```typescript
// Creating a node
const node: DialogueNode = {
  id: 'node_1',
  type: NODE_TYPE.NPC,  // ✅ Constant
  content: 'Hello!',
  x: 0,
  y: 0,
};

// Checking node type
if (node.type === NODE_TYPE.PLAYER) {  // ✅ Constant
  // Handle player node
}

// Setting view mode
const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.GRAPH);  // ✅ Constant
```

## Video Domain

### Overview

The video domain provides a **Canva-like visual template editor** for creating video compositions with Remotion integration. Templates consist of scenes containing layers with visual and style properties.

**Location**: `src/video/`

**Key Components**:
- Template system (`src/video/templates/`)
- Video workspace UI (`src/video/workspace/`)
- Remotion integration (`src/video/player/`, `app/lib/video/`)

### Video Architecture

**Template Hierarchy**:
```
VideoTemplate
  ├── scenes: VideoScene[]
  │   └── layers: VideoLayer[]
  │       ├── kind: VideoLayerKind
  │       ├── visual: { x, y, width, height, rotation, scale, anchor }
  │       ├── style: { colors, fonts, borders }
  │       └── inputs: { content, imageUrl, etc. }
```

**Workspace Store** (4 slices):
1. **Template Slice** - Template cache and history
2. **Draft Slice** - Draft/commit workflow (shared pattern)
3. **View State Slice** - UI state (modals, panels, selection, canvas, timeline)
4. **Project Slice** - Project selection sync

### Video Constants

All video constants are in `src/video/templates/types/video-layer.ts`:

**Layer Kinds** (`VIDEO_LAYER_KIND`):
```typescript
VIDEO_LAYER_KIND.TEXT          // Text layer
VIDEO_LAYER_KIND.RECTANGLE     // Colored rectangle
VIDEO_LAYER_KIND.CIRCLE        // Colored circle
VIDEO_LAYER_KIND.IMAGE         // Image layer
VIDEO_LAYER_KIND.VIDEO         // Video clip
VIDEO_LAYER_KIND.BACKGROUND    // Full-canvas background
VIDEO_LAYER_KIND.DIALOGUE_CARD // Dialogue bubble (for Forge)
VIDEO_LAYER_KIND.PORTRAIT      // Character portrait
VIDEO_LAYER_KIND.LOWER_THIRD   // Name plate overlay
```

**Always use constants**, never string literals!

### Common Video Patterns

**Creating a layer**:
```typescript
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';

const newLayer: Partial<VideoLayer> = {
  id: `layer_${Date.now()}`,
  name: 'My Text Layer',
  kind: VIDEO_LAYER_KIND.TEXT,  // ✅ Constant
  startMs: 0,
  durationMs: 5000,
  opacity: 1,
  visual: {
    x: 960,        // Center of 1920px canvas
    y: 540,        // Center of 1080px canvas
    width: 400,
    height: 100,
    rotation: 0,
    scale: 1,
    anchorX: 0.5,  // 0.5 = center, 0 = left, 1 = right
    anchorY: 0.5,  // 0.5 = middle, 0 = top, 1 = bottom
  },
  style: {
    fontFamily: 'system-ui',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  inputs: {
    content: 'Hello World',
  },
};

// Add to draft
store.actions.addLayer(newLayer);
```

**Updating a layer**:
```typescript
// Update position
store.actions.moveLayer('layer_123', 500, 300);

// Update size
store.actions.resizeLayer('layer_123', 600, 150);

// Update properties
store.actions.updateLayer('layer_123', {
  opacity: 0.8,
  style: { color: '#ff0000' },
});
```

### Video Workspace Guidelines

1. **Always use draft system** - Never mutate templates directly
2. **Layer operations through store actions** - Use addLayer, updateLayer, moveLayer, resizeLayer
3. **Anchor-based positioning** - Position (x,y) is the anchor point, not top-left
4. **Timeline is source of truth** - All layers must have startMs and durationMs
5. **Canvas is visual editor** - Shows current frame layers
6. **Remotion is the renderer** - Compile template → Remotion composition → video export

### Current State (Jan 2026)

**✅ Working**:
- Template editing with visual canvas
- Drag-and-drop layer creation
- Property inspector (position, size, rotation, opacity, text, colors)
- Timeline with playback and scrubbing
- Project switching and template persistence to PayloadCMS
- Draft system integration with auto-save

**🚧 In Progress**:
- Default/Override tab system for runtime data injection
- Remotion layer rendering components (TEXT/RECTANGLE/CIRCLE/IMAGE/VIDEO)
- Export modal with progress tracking

**❌ Planned**:
- Animation keyframes
- Audio tracks
- Export from Forge workspace (dialogue → video)
- Template marketplace

### Critical Issues (Always Check Before Working)

**Known Bugs** (see `src/video/VIDEO_ISSUES.md`):
1. **P0**: Pointer events bug - layers can't be moved immediately after drop (fix ready)
2. **P0**: Missing z-index - layers render behind overlays (fix ready)

**Architecture Changes**:
- Video workspace was rebuilt from scratch in Jan 2026
- Draft system integrated across all workspaces
- Template loading now uses `resetDraft()` instead of template cache
- Always read from `draftGraph`, never from template cache directly

### Video Development History

**Important Context for Agents**:
- Video workspace store was **removed** at some point, then **brought back** with improved architecture
- We've transitioned from template cache pattern to draft system pattern
- Legacy components exist but should not be used (see VIDEO_ISSUES.md cleanup section)
- Always check git history (`git log src/video`) when working on video features to understand evolution

## Development Tracking

### Always Review Before Working

When working on any domain, **ALWAYS** review these documents first:

1. **[ROADMAP.md](./ROADMAP.md)** - Current priorities and feature status
2. **[CHANGELOG.md](./CHANGELOG.md)** - Recent changes and history
3. **Domain-specific issues**:
   - `src/video/VIDEO_ISSUES.md` - Video bugs and TODOs
   - (Future: `src/forge/FORGE_ISSUES.md`, `src/writer/WRITER_ISSUES.md`)

### Updating Documentation

**After completing any task**:

1. **Update ROADMAP.md** - Mark features complete, update percentages
2. **Update CHANGELOG.md** - Add entry under "Unreleased" section
3. **Update domain issues** - Close fixed bugs, add new issues found
4. **Update this file (AGENTS.md)** - Add new patterns, update "Current State"

### Example Workflow

```
Before coding:
1. Read ROADMAP.md → Understand priorities
2. Read CHANGELOG.md → See recent changes
3. Read VIDEO_ISSUES.md → Check known bugs
4. Review relevant components

While coding:
1. Follow coding preferences (constants, type independence)
2. Check architecture boundaries
3. Add console logs for debugging
4. Test incrementally

After coding:
1. Update ROADMAP.md → Mark tasks complete
2. Update CHANGELOG.md → Document changes
3. Update VIDEO_ISSUES.md → Close fixed bugs
4. Update AGENTS.md → Add new patterns learned
```

### Critical: Compound Knowledge

**When updating documentation, COMPOUND, don't replace**:
- Add to existing sections, don't delete history
- Preserve context from previous work
- Link related sections
- Keep changelog chronological
- Keep roadmap priorities current

## Questions?

When in doubt:
1. Check `src/shared/types/constants.ts` for available constants
2. Check **[ROADMAP.md](./ROADMAP.md)** for current priorities
3. Check domain-specific issue files for known bugs
4. Look at existing component implementations
5. Follow the patterns in workspace components
6. Review git history for context: `git log --oneline src/[domain]`
7. Ensure demo works independently
