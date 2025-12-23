# Dialogue Forge

A visual node-based dialogue editor with Yarn Spinner support for game development.

## 🚀 Quick Start

### Run the Demo

```bash
npx @magicborn/dialogue-forge
```

This will download the package and start an interactive demo server at `http://localhost:3000`.

### Install as Library

```bash
npm install @magicborn/dialogue-forge
```

## Quick Start

### 1. Define Your Flags

```typescript
import { FlagSchema, FLAG_TYPE, FLAG_VALUE_TYPE } from '@magicborn/dialogue-forge';

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
import { importFromYarn } from '@magicborn/dialogue-forge';

const yarnContent = await loadFile('merchant.yarn');
const dialogue = importFromYarn(yarnContent, 'Merchant Dialogue');
```

### 3. Edit Dialogue

```tsx
import { DialogueEditor, exportToYarn } from '@magicborn/dialogue-forge';

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
import { DialogueSimulator } from '@magicborn/dialogue-forge';

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
- `DialogueResult` - Result from running dialogue (updated flags, visited nodes)

## Complete Example

```typescript
import {
  DialogueEditor,
  DialogueSimulator,
  importFromYarn,
  exportToYarn,
  FlagSchema,
  GameFlagState
} from '@magicborn/dialogue-forge';

// Define flags
import { FLAG_TYPE } from '@magicborn/dialogue-forge';

const flagSchema: FlagSchema = {
  flags: [
    { id: 'quest_complete', type: FLAG_TYPE.QUEST, category: 'quests' },
    { id: 'item_key', type: FLAG_TYPE.ITEM, category: 'items' },
  ]
};

// Load dialogue
const dialogue = importFromYarn(yarnFile, 'Merchant');

// Get current game state
const gameFlags: GameFlagState = {
  quest_complete: 'complete',
  item_key: true
};

// Edit dialogue
<DialogueEditor
  dialogue={dialogue}
  onChange={(updated) => {
    const yarn = exportToYarn(updated);
    saveFile(yarn);
  }}
  flagSchema={flagSchema}
  initialFlags={gameFlags}
/>

// OR run dialogue
<DialogueSimulator
  dialogue={dialogue}
  initialFlags={gameFlags}
  onComplete={(result) => {
    // Update game with new flags
    gameState.flags = result.updatedFlags;
    // Next dialogue will have different options
    // based on updated flags
  }}
/>
```

## Documentation

- **[GUIDE.md](./GUIDE.md)** - Friendly, educational guide for learning Dialogue Forge
- **[UNREAL_INTEGRATION.md](./UNREAL_INTEGRATION.md)** - Complete guide for integrating with Unreal Engine
- **[DATA_STRUCTURES.md](./DATA_STRUCTURES.md)** - Complete type reference and API documentation
- **[INTEGRATION.md](./INTEGRATION.md)** - General integration patterns
- **[FLAG_SYSTEM.md](./FLAG_SYSTEM.md)** - Detailed flag system documentation

Click the **book icon** in the editor to open the built-in guide.

### Key Concepts

**Flags = Yarn Variables**: Flags you define in Dialogue Forge become `$variable` in Yarn Spinner. These variables are stored in Yarn Spinner's Variable Storage at runtime, not in the .yarn file.

**Bidirectional Flow**: 
- Edit in Dialogue Forge → Export .yarn → Import to Unreal
- Game sets variables → Yarn reads them → Dialogue reacts
- Dialogue sets variables → Yarn stores them → Game reads them

See [UNREAL_INTEGRATION.md](./UNREAL_INTEGRATION.md) for complete details.
