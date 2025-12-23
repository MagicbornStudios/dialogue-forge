# Dialogue Forge Usage Guide

## Quick Start

```tsx
import { DialogueEditor, DialogueTree, FlagSchema } from '@portfolio/dialogue-forge';
import { exampleFlagSchema } from '@portfolio/dialogue-forge';
import { useState } from 'react';

function App() {
  const [dialogue, setDialogue] = useState<DialogueTree | null>(null);

  return (
    <DialogueEditor
      dialogue={dialogue}
      onChange={setDialogue}
      flagSchema={exampleFlagSchema}
      onExportYarn={(yarn) => console.log(yarn)}
    />
  );
}
```

## Data Structures

Dialogue Forge uses strongly-typed data structures. **Always use the exported types and constants** for type safety.

See [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) for complete documentation of all types and structures.

### Quick Reference

```typescript
import {
  // Core Types
  DialogueTree,
  DialogueNode,
  Choice,
  Condition,
  
  // Flag Types
  FlagSchema,
  FlagDefinition,
  GameFlagState,
  
  // Constants (use these instead of string literals!)
  NODE_TYPE,
  FLAG_TYPE,
  CONDITION_OPERATOR,
  FLAG_VALUE_TYPE,
} from '@portfolio/dialogue-forge';
```

## Flag Schema

Define your game's flags using the provided types and constants:

```typescript
import { FlagSchema, FlagDefinition } from '@portfolio/dialogue-forge';
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '@portfolio/dialogue-forge';

const myFlagSchema: FlagSchema = {
  categories: ['quests', 'achievements', 'items'],
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
    // ... more flags
  ]
};
```

**Important:** Always use the exported constants (`FLAG_TYPE`, `NODE_TYPE`, etc.) instead of string literals for better type safety and IDE support.

## Features

- **Visual Node Editor** - Drag nodes, connect edges
- **Flag System** - Reference game flags with autocomplete
- **Yarn Export** - Export to Yarn Spinner format
- **Built-in Guide** - Click the book icon for documentation
- **Play Test** - Test dialogues in real-time

## Flag Types

- `dialogue` - Temporary, dialogue-scoped
- `quest` - Quest state and completion
- `achievement` - Unlocked achievements
- `item` - Inventory items
- `stat` - Player statistics
- `title` - Earned titles
- `global` - Global game state

See [FLAG_SYSTEM.md](./FLAG_SYSTEM.md) for detailed flag system documentation.

