# Data Structures Reference

This document describes all data structures expected by Dialogue Forge. Use these types in your TypeScript/JavaScript code for full type safety and IDE support.

## Installation & Imports

```typescript
import {
  // Types
  DialogueTree,
  DialogueNode,
  Choice,
  Condition,
  FlagSchema,
  FlagDefinition,
  GameFlagState,
  DialogueResult,
  
  // Constants
  NODE_TYPE,
  FLAG_TYPE,
  CONDITION_OPERATOR,
  FLAG_VALUE_TYPE,
  QUEST_STATE,
  
  // Type aliases
  NodeType,
  FlagType,
  ConditionOperator,
  FlagValueType,
  QuestState,
} from '@portfolio/dialogue-forge';
```

## Core Types

### `DialogueTree`

The root structure representing an entire dialogue tree.

```typescript
interface DialogueTree {
  id: string;                    // Unique identifier for this dialogue
  title: string;                  // Display title
  startNodeId: string;            // ID of the starting node
  nodes: Record<string, DialogueNode>;  // All nodes keyed by their ID
}
```

**Example:**
```typescript
const dialogue: DialogueTree = {
  id: 'intro_dialogue',
  title: 'Introduction',
  startNodeId: 'start',
  nodes: {
    start: { /* DialogueNode */ },
    greeting: { /* DialogueNode */ }
  }
};
```

### `DialogueNode`

A single node in the dialogue tree. Can be either an NPC node (speaker) or a Player node (choices).

```typescript
import { NODE_TYPE, NodeType } from '@portfolio/dialogue-forge';

interface DialogueNode {
  id: string;                     // Unique node identifier
  type: NodeType;                 // NODE_TYPE.NPC or NODE_TYPE.PLAYER
  speaker?: string;               // Speaker name (required for NPC nodes)
  content: string;                 // Dialogue text
  choices?: Choice[];             // Available choices (required for PLAYER nodes)
  nextNodeId?: string;            // Next node ID (for NPC nodes)
  setFlags?: string[];            // Flag IDs to set when this node is reached
  x: number;                      // X position in graph editor
  y: number;                      // Y position in graph editor
}
```

**Node Types:**
- `NODE_TYPE.NPC` (`'npc'`) - NPC speaks, player listens
- `NODE_TYPE.PLAYER` (`'player'`) - Player makes a choice

**Example:**
```typescript
import { NODE_TYPE } from '@portfolio/dialogue-forge';

// NPC Node
const npcNode: DialogueNode = {
  id: 'greeting',
  type: NODE_TYPE.NPC,
  speaker: 'Merchant',
  content: 'Welcome to my shop!',
  nextNodeId: 'player_choice',
  setFlags: ['dialogue_met_merchant'],
  x: 100,
  y: 100
};

// Player Node
const playerNode: DialogueNode = {
  id: 'player_choice',
  type: NODE_TYPE.PLAYER,
  content: '',  // Empty for player nodes
  choices: [
    {
      id: 'buy',
      text: 'I want to buy something',
      nextNodeId: 'shop_menu',
      setFlags: ['quest_shopping']
    }
  ],
  x: 300,
  y: 100
};
```

### `Choice`

A player choice option within a PLAYER node.

```typescript
import { CONDITION_OPERATOR, ConditionOperator } from '@portfolio/dialogue-forge';

interface Choice {
  id: string;                     // Unique choice identifier
  text: string;                    // Display text for the choice
  nextNodeId: string;             // Node to go to when chosen
  conditions?: Condition[];       // Conditions that must be met for this choice to appear
  setFlags?: string[];            // Flag IDs to set when this choice is selected
}
```

**Example:**
```typescript
import { CONDITION_OPERATOR } from '@portfolio/dialogue-forge';

const choice: Choice = {
  id: 'accept_quest',
  text: 'I accept your quest!',
  nextNodeId: 'quest_started',
  conditions: [
    {
      flag: 'quest_previous_complete',
      operator: CONDITION_OPERATOR.IS_SET
    }
  ],
  setFlags: ['quest_new_quest', 'achievement_quest_accepted']
};
```

### `Condition`

A condition that controls whether a choice is available.

```typescript
import { CONDITION_OPERATOR, ConditionOperator } from '@portfolio/dialogue-forge';

interface Condition {
  flag: string;                   // Flag ID to check
  operator: ConditionOperator;    // CONDITION_OPERATOR.IS_SET or CONDITION_OPERATOR.IS_NOT_SET
}
```

**Operators:**
- `CONDITION_OPERATOR.IS_SET` - Choice appears if flag is set/true
- `CONDITION_OPERATOR.IS_NOT_SET` - Choice appears if flag is not set/false

**Example:**
```typescript
import { CONDITION_OPERATOR } from '@portfolio/dialogue-forge';

const condition: Condition = {
  flag: 'item_ancient_key',
  operator: CONDITION_OPERATOR.IS_SET
};
```

## Flag System

### `FlagSchema`

Defines all available flags in your game.

```typescript
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '@portfolio/dialogue-forge';

interface FlagSchema {
  flags: FlagDefinition[];         // All flag definitions
  categories?: string[];          // Optional category list for organization
}
```

**Example:**
```typescript
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '@portfolio/dialogue-forge';

const flagSchema: FlagSchema = {
  categories: ['quests', 'items', 'stats'],
  flags: [
    {
      id: 'quest_main',
      name: 'Main Quest',
      type: FLAG_TYPE.QUEST,
      category: 'quests',
      valueType: FLAG_VALUE_TYPE.STRING
    },
    {
      id: 'item_sword',
      name: 'Sword',
      type: FLAG_TYPE.ITEM,
      category: 'items'
    }
  ]
};
```

### `FlagDefinition`

Defines a single flag.

```typescript
import { FLAG_TYPE, FLAG_VALUE_TYPE, FlagType, FlagValueType } from '@portfolio/dialogue-forge';

interface FlagDefinition {
  id: string;                     // Unique flag identifier (used in setFlags arrays)
  name: string;                    // Human-readable name
  description?: string;            // Optional description
  type: FlagType;                  // Flag type (see FLAG_TYPE constants)
  category?: string;               // Optional category for organization
  defaultValue?: boolean | number | string;  // Default value when flag is set
  valueType?: FlagValueType;       // Type of value (see FLAG_VALUE_TYPE constants)
}
```

**Flag Types:**
- `FLAG_TYPE.DIALOGUE` - Temporary, dialogue-scoped flags (reset after dialogue)
- `FLAG_TYPE.QUEST` - Quest state and completion
- `FLAG_TYPE.ACHIEVEMENT` - Unlocked achievements
- `FLAG_TYPE.ITEM` - Inventory items
- `FLAG_TYPE.STAT` - Player statistics (reputation, gold, etc.)
- `FLAG_TYPE.TITLE` - Earned titles
- `FLAG_TYPE.GLOBAL` - Global game state

**Value Types:**
- `FLAG_VALUE_TYPE.BOOLEAN` - true/false
- `FLAG_VALUE_TYPE.NUMBER` - Numeric value
- `FLAG_VALUE_TYPE.STRING` - String value

**Example:**
```typescript
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '@portfolio/dialogue-forge';

const questFlag: FlagDefinition = {
  id: 'quest_dragon_slayer',
  name: 'Dragon Slayer Quest',
  description: 'The main quest to slay the dragon',
  type: FLAG_TYPE.QUEST,
  category: 'quests',
  valueType: FLAG_VALUE_TYPE.STRING
  // When set, will default to 'started' for quest flags
};

const statFlag: FlagDefinition = {
  id: 'stat_gold',
  name: 'Gold',
  type: FLAG_TYPE.STAT,
  category: 'stats',
  valueType: FLAG_VALUE_TYPE.NUMBER,
  defaultValue: 0
};
```

### `GameFlagState`

Represents the current state of all game flags.

```typescript
interface GameFlagState {
  [flagId: string]: boolean | number | string;
}
```

**Example:**
```typescript
const gameState: GameFlagState = {
  quest_dragon_slayer: 'started',
  item_ancient_key: true,
  stat_gold: 150,
  achievement_first_quest: true
};
```

### `DialogueResult`

Returned after a dialogue simulation completes.

```typescript
interface DialogueResult {
  updatedFlags: GameFlagState;    // Final flag state after dialogue
  dialogueTree: DialogueTree;     // The dialogue tree that was run
  completedNodeIds: string[];    // IDs of all nodes visited
}
```

## Constants Reference

### Node Types
```typescript
NODE_TYPE.NPC      // 'npc'
NODE_TYPE.PLAYER   // 'player'
```

### Flag Types
```typescript
FLAG_TYPE.DIALOGUE     // 'dialogue'
FLAG_TYPE.QUEST        // 'quest'
FLAG_TYPE.ACHIEVEMENT  // 'achievement'
FLAG_TYPE.ITEM         // 'item'
FLAG_TYPE.STAT         // 'stat'
FLAG_TYPE.TITLE        // 'title'
FLAG_TYPE.GLOBAL       // 'global'
```

### Condition Operators
```typescript
CONDITION_OPERATOR.IS_SET      // 'is_set'
CONDITION_OPERATOR.IS_NOT_SET  // 'is_not_set'
```

### Flag Value Types
```typescript
FLAG_VALUE_TYPE.BOOLEAN  // 'boolean'
FLAG_VALUE_TYPE.NUMBER   // 'number'
FLAG_VALUE_TYPE.STRING   // 'string'
```

### Quest States (Common Values)
```typescript
QUEST_STATE.NOT_STARTED   // 'not_started'
QUEST_STATE.STARTED       // 'started'
QUEST_STATE.IN_PROGRESS   // 'in_progress'
QUEST_STATE.COMPLETED     // 'completed'
QUEST_STATE.FAILED        // 'failed'
```

## Type Safety Best Practices

1. **Always use constants instead of string literals:**
   ```typescript
   // ❌ Bad
   type: 'quest'
   
   // ✅ Good
   type: FLAG_TYPE.QUEST
   ```

2. **Import types for function parameters:**
   ```typescript
   import { DialogueTree, FlagSchema } from '@portfolio/dialogue-forge';
   
   function processDialogue(dialogue: DialogueTree, flags: FlagSchema) {
     // ...
   }
   ```

3. **Use type guards when checking node types:**
   ```typescript
   import { NODE_TYPE } from '@portfolio/dialogue-forge';
   
   if (node.type === NODE_TYPE.NPC) {
     // TypeScript knows node.speaker exists here
     console.log(node.speaker);
   }
   ```

4. **Leverage TypeScript's type inference:**
   ```typescript
   import { exampleFlagSchema } from '@portfolio/dialogue-forge';
   
   // TypeScript knows the exact structure
   const mySchema = exampleFlagSchema;
   ```

## Validation

Use the provided validation functions:

```typescript
import { validateFlags } from '@portfolio/dialogue-forge';

const result = validateFlags(gameState, flagSchema);
if (!result.valid) {
  console.error('Flag validation errors:', result.errors);
}
```

## See Also

- [USAGE.md](./USAGE.md) - How to use Dialogue Forge
- [FLAG_SYSTEM.md](./FLAG_SYSTEM.md) - Detailed flag system documentation
- [INTEGRATION.md](./INTEGRATION.md) - Integration guide





