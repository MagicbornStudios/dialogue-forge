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
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── DialogueEditorV2.tsx    # Main editor component
│   │   ├── NPCNodeV2.tsx            # NPC node component
│   │   ├── PlayerNodeV2.tsx          # Player choice node component
│   │   ├── ConditionalNodeV2.tsx   # Conditional logic node
│   │   ├── NodeEditor.tsx            # Node editing panel
│   │   ├── FlagManager.tsx           # Flag management UI
│   │   ├── FlagSelector.tsx          # Flag autocomplete
│   │   ├── GuidePanel.tsx            # Built-in documentation
│   │   └── ...
│   ├── types/              # TypeScript types and constants
│   │   ├── constants.ts    # ⚠️ CRITICAL: All type constants
│   │   ├── flags.ts         # Flag system types
│   │   ├── characters.ts   # Character types
│   │   └── index.ts        # Main type exports
│   ├── lib/                # Core libraries
│   │   ├── yarn-converter/ # Yarn Spinner conversion
│   │   ├── yarn-runner/    # Yarn execution engine
│   │   └── flag-manager.ts # Flag state management
│   ├── utils/              # Utility functions
│   │   ├── layout/         # Graph layout algorithms
│   │   ├── reactflow-converter.ts  # React Flow conversion
│   │   └── ...
│   ├── examples/           # Example dialogues and schemas
│   └── styles/             # CSS files
├── demo/                   # Next.js demo application
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx      # Root layout (NO shared dependencies)
│   │   └── page.tsx        # Demo page
│   ├── components/         # Demo-specific components
│   └── package.json        # Demo dependencies
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

All constants are exported from `src/types/constants.ts`:

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
- **Feature folders are OK**: For larger UIs, group related components under a folder (e.g., `src/components/narrative-editor/`) with a local `index.ts`.
- **Prefer single-purpose exports**: Export one component per file unless helpers are tightly coupled and only used together.

### Utilities & Data Flow
- **UI vs. domain logic**: Keep data transformations in `src/utils/` and keep components focused on rendering + wiring handlers.
- **Explicit props over implicit coupling**: Pass state and handlers into subcomponents; avoid hidden imports or global state.
- **Use immutable updates**: Always return new arrays/objects when modifying nested structures to keep React updates predictable.
- **Prefer client helpers for navigation**: When nested data access gets verbose, add a small “client” helper (e.g., `createNarrativeThreadClient`) that encapsulates lookups and updates.
- **Deduplicate helpers**: If a helper is reused across components (e.g., ID generation or list parsing), promote it to `src/utils/` instead of re-implementing it.

### Stability & Bug Prevention
- **Guard optional data**: Fail fast when required selections are missing, and provide clear empty states.
- **Keep side-effects localized**: Use `useEffect` sparingly and keep its dependencies explicit.
- **Be conservative with edits**: Prefer small, reviewable changes over sweeping rewrites.

### Documentation Style
- **Structure matters**: Use headings and short lists; avoid large paragraphs.
- **Include intent**: Document the “why” in addition to the “what” for non-obvious decisions.

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

`DialogueEditorV2` supports three view modes:
- `VIEW_MODE.GRAPH`: Visual node editor
- `VIEW_MODE.YARN`: Text-based Yarn format view
- `VIEW_MODE.PLAY`: Interactive dialogue player

## Working with the Codebase

### Demo Application

The Next.js demo application runs from the **root directory**:
- Next.js app files are in `app/`, `components/`, `public/`, `styles/` at root
- Uses `@magicborn/dialogue-forge/src/...` imports which resolve via webpack alias
- All dependencies are in root `package.json`
- Build command: `npm run build:next` or `next build`
- Dev command: `npm run dev` or `next dev`

**Important**: 
- The demo imports source files directly: `@magicborn/dialogue-forge/src/components/...`
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
2. **Demo dependencies**: Add to `demo/package.json` `dependencies`
3. **Dev dependencies**: Add to respective `devDependencies`

### Type Exports

All public types are exported from `src/index.ts`. When adding new types:
1. Define in appropriate `src/types/` file
2. Export from `src/types/index.ts`
3. Re-export from `src/index.ts`

## Common Tasks

### Adding a New Node Type

1. Define constant in `src/types/constants.ts`:
   ```typescript
   export const NODE_TYPE = {
     // ... existing
     NEW_TYPE: 'new_type',
   } as const;
   ```

2. Update `NodeType` type
3. Create component in `src/components/NewTypeNodeV2.tsx`
4. Register in `DialogueEditorV2.tsx` `nodeTypes` object
5. Update `reactflow-converter.ts` to handle conversion

### Adding a New Flag Type

1. Add constant to `FLAG_TYPE` in `src/types/constants.ts`
2. Update `FlagType` type
3. Update flag validation in `src/lib/flag-manager.ts`
4. Update UI components if needed (FlagSelector, FlagManager)

### Modifying the Demo

1. Edit files in `demo/` directory
2. Ensure all imports use `@magicborn/dialogue-forge` package
3. Never reference paths outside the repo
4. Test that `npm run build` works in demo folder

### Exporting to Yarn Format

The Yarn converter is in `src/lib/yarn-converter/`:
- `exportToYarn(dialogue)`: Converts DialogueTree to Yarn string
- `importFromYarn(yarnContent, title)`: Parses Yarn to DialogueTree

## File Organization

### Components

- **V2 Components**: Modern React components (DialogueEditorV2, NPCNodeV2, etc.)
- **Legacy Components**: Older components (may exist for compatibility)
- **Utility Components**: Reusable UI (FlagSelector, CharacterSelector, etc.)

### Types

- `src/types/constants.ts`: **All constants** (most important file)
- `src/types/index.ts`: Main type exports
- `src/types/flags.ts`: Flag system types
- `src/types/characters.ts`: Character types
- `src/types/conditionals.ts`: Conditional logic types

### Utilities

- `src/utils/reactflow-converter.ts`: Converts between DialogueTree and React Flow format
- `src/utils/layout/`: Graph layout algorithms (dagre, etc.)
- `src/utils/node-helpers.ts`: Node manipulation utilities

## Testing

Tests use Vitest. Key test files:
- `src/**/*.test.ts`: Unit tests
- Test utilities in `src/utils/` if needed

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
4. **Constants First**: Check `src/types/constants.ts` before adding new string values
5. **Component Naming**: V2 components use `V2` suffix (e.g., `DialogueEditorV2`)

## Quick Reference

### Import Patterns

```typescript
// Types and constants
import { NODE_TYPE, FLAG_TYPE, VIEW_MODE, type DialogueTree } from '@magicborn/dialogue-forge';

// Components
import { DialogueEditorV2 } from '@magicborn/dialogue-forge';

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

## Questions?

When in doubt:
1. Check `src/types/constants.ts` for available constants
2. Look at existing component implementations
3. Follow the patterns in `DialogueEditorV2.tsx`
4. Ensure demo works independently
