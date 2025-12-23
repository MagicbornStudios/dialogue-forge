# Dialogue Forge Architecture

## System Overview

Dialogue Forge is a **bidirectional dialogue editor** that:
1. **Imports** game state (flags) and Yarn dialogue files
2. **Edits** dialogues visually with flag-aware autocomplete
3. **Simulates** dialogues with current game state
4. **Exports** updated flags and dialogue changes

## Core Components

### 1. DialogueEditor
**Purpose**: Visual editor for creating/editing dialogues

**Inputs**:
- `dialogue: DialogueTree` - Dialogue to edit
- `flagSchema: FlagSchema` - Available flags (for autocomplete)
- `initialFlags?: GameFlagState` - Current game flags (for reference)

**Outputs**:
- `onChange(dialogue)` - Updated dialogue
- `onExportYarn(yarn)` - Yarn format export
- `onExportJSON(json)` - JSON format export

### 2. DialogueSimulator
**Purpose**: Run dialogues with game state, return updated flags

**Inputs**:
- `dialogue: DialogueTree` - Dialogue to run
- `initialFlags: GameFlagState` - Starting flag state
- `startNodeId?: string` - Optional start node

**Outputs**:
- `onComplete(result)` - Final state with updated flags
- `onFlagUpdate(flags)` - Real-time flag updates

**Result**:
```typescript
{
  updatedFlags: GameFlagState;      // Flags after dialogue
  dialogueTree: DialogueTree;       // Dialogue (may have changed)
  completedNodeIds: string[];        // Visited nodes
}
```

## Flag System

### Flag Types
- `dialogue` - Temporary, dialogue-scoped
- `quest` - Quest state (`not_started`, `in_progress`, `complete`)
- `achievement` - Unlocked achievements
- `item` - Inventory items
- `stat` - Player statistics (numbers)
- `title` - Earned titles
- `global` - Global game state

### Flag Schema
```typescript
const flagSchema: FlagSchema = {
  categories: ['quests', 'items', 'stats'],
  flags: [
    {
      id: 'quest_dragon_slayer',
      name: 'Dragon Slayer Quest',
      type: 'quest',
      category: 'quests',
      valueType: 'string',
      defaultValue: 'not_started'
    }
  ]
};
```

### Flag State
```typescript
const gameFlags: GameFlagState = {
  quest_dragon_slayer: 'complete',
  item_ancient_key: true,
  stat_gold: 1000
};
```

## Workflow

### Editing Workflow
```
1. Load Yarn file → importFromYarn()
2. Get flag schema → Define your flags
3. Edit in DialogueEditor → Visual editing
4. Export → Save Yarn file
```

### Simulation Workflow
```
1. Load dialogue → importFromYarn()
2. Get current game flags → From game state
3. Run DialogueSimulator → Player makes choices
4. Get updated flags → Update game state
5. Next dialogue → Different options based on new flags
```

## Use Case: Quest Completion

### Scenario
Player completes "Dragon Slayer" quest, then talks to merchant.

### Step 1: Initial State
```typescript
const flags = {
  quest_dragon_slayer: 'complete',
  dialogue_met_merchant: false
};
```

### Step 2: First Meeting
```yarn
title: merchant_first_meet
---
Merchant: "Welcome! First time here?"
<<set $dialogue_met_merchant = true>>
===
```

### Step 3: After Quest Complete
```yarn
title: merchant_quest_complete
---
<<if $quest_dragon_slayer == "complete">>
    Merchant: "You're the hero who slayed the dragon!"
    <<set $achievement_dragon_slayer = true>>
    <<set $stat_reputation += 50>>
<<else>>
    Merchant: "Have you heard about the dragon?"
<<endif>>
===
```

### Step 4: Flag Updates
```typescript
// After dialogue completes
const result = {
  updatedFlags: {
    quest_dragon_slayer: 'complete',
    dialogue_met_merchant: true,
    achievement_dragon_slayer: true,  // NEW
    stat_reputation: 50                // UPDATED
  }
};

// Update game state
gameState.flags = { ...gameState.flags, ...result.updatedFlags };
```

### Step 5: Next Interaction
- `dialogue_met_merchant = true` → Skip introduction
- `quest_dragon_slayer = 'complete'` → Show hero dialogue
- `achievement_dragon_slayer = true` → Unlock achievement UI

## Integration Points

### 1. Import Yarn Files
```typescript
import { importFromYarn } from '@portfolio/dialogue-forge';
const dialogue = importFromYarn(yarnContent, 'Dialogue Name');
```

### 2. Export Yarn Files
```typescript
import { exportToYarn } from '@portfolio/dialogue-forge';
const yarn = exportToYarn(dialogue);
saveFile(yarn);
```

### 3. Flag Management
```typescript
import { initializeFlags, mergeFlagUpdates } from '@portfolio/dialogue-forge';

// Initialize from schema
const defaults = initializeFlags(flagSchema);

// Merge updates
const updated = mergeFlagUpdates(currentFlags, ['flag1', 'flag2'], flagSchema);
```

### 4. Run Dialogue
```typescript
<DialogueSimulator
  dialogue={dialogue}
  initialFlags={gameFlags}
  onComplete={(result) => {
    // Update game
    gameState.flags = result.updatedFlags;
  }}
/>
```

## Data Flow

```
Game State (Flags)
    ↓
DialogueSimulator
    ↓
Player Makes Choices
    ↓
Flags Updated
    ↓
onComplete(result)
    ↓
Update Game State
    ↓
Next Dialogue (Different Options)
```

## Benefits

1. **Bidirectional** - Import game state, export updates
2. **Type-Safe** - Flag schema ensures correctness
3. **Simulation** - Test dialogues with real game state
4. **Standard** - Works with any game engine
5. **Flexible** - Supports all Yarn Spinner features





