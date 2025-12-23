# Dialogue Forge

A visual node-based dialogue editor with Yarn Spinner support for game development.

[![npm version](https://img.shields.io/npm/v/@portfolio/dialogue-forge)](https://www.npmjs.com/package/@portfolio/dialogue-forge)
[![GitHub](https://img.shields.io/github/license/MagicbornStudios/dialogue-forge)](https://github.com/MagicbornStudios/dialogue-forge)

## 🚀 Quick Start

### Run the Demo

```bash
npx @portfolio/dialogue-forge
```

This will download the package and start an interactive demo server at `http://localhost:3000`.

### Install as Library

```bash
npm install @portfolio/dialogue-forge
```

## Quick Start

### 1. Define Your Flags

```typescript
import { FlagSchema, FLAG_TYPE, FLAG_VALUE_TYPE } from '@portfolio/dialogue-forge';

const flagSchema: FlagSchema = {
  categories: ['quests', 'items', 'stats'],
  flags: [
    {
      id: 'quest_dragon_slayer',
      name: 'Dragon Slayer Quest',
      type: FLAG_TYPE.QUEST,  // ✅ Use constant, not 'quest'
      category: 'quests',
      valueType: FLAG_VALUE_TYPE.STRING
    },
    {
      id: 'item_ancient_key',
      name: 'Ancient Key',
      type: FLAG_TYPE.ITEM,  // ✅ Use constant
      category: 'items'
    },
    {
      id: 'stat_gold',
      name: 'Gold',
      type: FLAG_TYPE.STAT,  // ✅ Use constant
      category: 'stats',
      valueType: FLAG_VALUE_TYPE.NUMBER,
      defaultValue: 0
    }
  ]
};
```

### 2. Load Dialogue from Yarn

```typescript
import { importFromYarn } from '@portfolio/dialogue-forge';

const yarnContent = await loadFile('merchant.yarn');
const dialogue = importFromYarn(yarnContent, 'Merchant Dialogue');
```

### 3. Edit Dialogue

```tsx
import { DialogueEditor, exportToYarn } from '@portfolio/dialogue-forge';

<DialogueEditor
  dialogue={dialogue}
  onChange={(updated) => {
    const yarn = exportToYarn(updated);
    saveFile('merchant.yarn', yarn);
  }}
  flagSchema={flagSchema}
/>
```

### 4. Run Dialogue with Game State

```tsx
import { DialogueSimulator } from '@portfolio/dialogue-forge';

// Get current game flags
const gameFlags = {
  quest_dragon_slayer: 'complete',
  item_ancient_key: true,
  stat_gold: 1000
};

<DialogueSimulator
  dialogue={dialogue}
  initialFlags={gameFlags}
  onComplete={(result) => {
    // Update game state with new flags
    gameState.flags = {
      ...gameState.flags,
      ...result.updatedFlags
    };
  }}
/>
```

## Features

- **Visual Node Editor** - Drag nodes, connect edges, right-click menus
- **Yarn Spinner Import/Export** - Work with `.yarn` files
- **Flag System** - Reference game flags with autocomplete dropdown
- **Simulation Mode** - Test dialogues with current game state
- **Built-in Guide** - Click book icon for complete documentation

## Flag System

Flags represent game state (quests, items, achievements, etc.). The editor:
- Shows available flags in dropdowns when setting flags
- Validates flag references
- Exports flags to Yarn format
- Returns updated flags after dialogue completes

**Flag Types** (use `FLAG_TYPE` constant):
- `FLAG_TYPE.QUEST` - Quest state and completion
- `FLAG_TYPE.ACHIEVEMENT` - Unlocked achievements
- `FLAG_TYPE.ITEM` - Inventory items
- `FLAG_TYPE.STAT` - Player statistics
- `FLAG_TYPE.TITLE` - Earned titles
- `FLAG_TYPE.DIALOGUE` - Temporary, dialogue-scoped
- `FLAG_TYPE.GLOBAL` - Global game state

**Important:** Always use the exported constants (`FLAG_TYPE`, `NODE_TYPE`, etc.) instead of string literals for type safety.

See [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) for complete type documentation and [FLAG_SYSTEM.md](./FLAG_SYSTEM.md) for flag system details.

## API Reference

### Components

- `DialogueEditor` - Visual editor for creating/editing dialogues
- `DialogueSimulator` - Run dialogues with game state, returns updated flags
- `GuidePanel` - Built-in documentation panel
- `FlagSelector` - Flag autocomplete component

### Utilities

- `importFromYarn(yarnContent, title)` - Parse Yarn file to DialogueTree
- `exportToYarn(dialogue)` - Convert DialogueTree to Yarn format
- `initializeFlags(schema)` - Create default flag state from schema
- `mergeFlagUpdates(current, updates, schema)` - Merge flag updates
- `validateFlags(flags, schema)` - Validate flags against schema

### Types

- `DialogueTree` - Dialogue structure
- `DialogueNode` - Individual dialogue node (NPC or Player)
- `FlagSchema` - Flag definitions
- `GameFlagState` - Current flag values `{ [flagId]: value }`

## Documentation

- [GUIDE.md](./GUIDE.md) - Complete usage guide
- [USAGE.md](./USAGE.md) - API usage examples
- [INTEGRATION.md](./INTEGRATION.md) - Game integration guide
- [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - Type definitions
- [FLAG_SYSTEM.md](./FLAG_SYSTEM.md) - Flag system details
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture

## Contributing

This package is part of a monorepo. See [PUBLISHING.md](./PUBLISHING.md) for development workflow.

## License

MIT

## Links

- **GitHub**: https://github.com/MagicbornStudios/dialogue-forge
- **NPM**: https://www.npmjs.com/package/@portfolio/dialogue-forge
- **Issues**: https://github.com/MagicbornStudios/dialogue-forge/issues

