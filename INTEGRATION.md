# Game Integration Guide

## Overview

Dialogue Forge integrates with your game by:
1. **Importing** Yarn dialogue files and current game flags
2. **Editing** dialogues visually
3. **Simulating** dialogues with current game state
4. **Exporting** updated flags and dialogue changes

## Basic Integration

```typescript
import { 
  DialogueEditor, 
  DialogueSimulator,
  importFromYarn,
  initializeFlags,
  FlagSchema,
  GameFlagState,
  DialogueResult
} from '@portfolio/dialogue-forge';

// 1. Define your flag schema
const flagSchema: FlagSchema = {
  flags: [
    { id: 'quest_dragon_slayer', type: 'quest', category: 'quests' },
    { id: 'item_ancient_key', type: 'item', category: 'items' },
    // ...
  ]
};

// 2. Load dialogue from Yarn file
const yarnContent = await loadYarnFile('merchant.yarn');
const dialogue = importFromYarn(yarnContent, 'Merchant Dialogue');

// 3. Get current game state
const currentFlags: GameFlagState = {
  quest_dragon_slayer: 'in_progress',
  item_ancient_key: true,
  stat_gold: 500
};

// 4. Edit dialogue
<DialogueEditor
  dialogue={dialogue}
  onChange={(updated) => saveDialogue(updated)}
  flagSchema={flagSchema}
  initialFlags={currentFlags}
/>

// 5. Run dialogue (simulation)
<DialogueSimulator
  dialogue={dialogue}
  initialFlags={currentFlags}
  onComplete={(result: DialogueResult) => {
    // Update game state with new flags
    updateGameFlags(result.updatedFlags);
    // Save dialogue if it changed
    saveDialogue(result.dialogueTree);
  }}
  onFlagUpdate={(flags) => {
    // Real-time flag updates during dialogue
    console.log('Flags updated:', flags);
  }}
/>
```

## Flag Management

### Initialize Flags
```typescript
import { initializeFlags } from '@portfolio/dialogue-forge';

// Create default flag state from schema
const defaultFlags = initializeFlags(flagSchema);
// { quest_dragon_slayer: 'not_started', item_ancient_key: false, ... }
```

### Merge Flag Updates
```typescript
import { mergeFlagUpdates } from '@portfolio/dialogue-forge';

// When dialogue sets flags
const updatedFlags = mergeFlagUpdates(
  currentFlags,
  ['quest_dragon_slayer', 'item_ancient_key'],
  flagSchema
);
```

### Validate Flags
```typescript
import { validateFlags } from '@portfolio/dialogue-forge';

const { valid, errors } = validateFlags(currentFlags, flagSchema);
if (!valid) {
  console.error('Invalid flags:', errors);
}
```

## Workflow Example

### Scenario: Player talks to merchant after completing quest

```typescript
// 1. Load merchant dialogue
const merchantDialogue = importFromYarn(merchantYarn, 'Merchant');

// 2. Get player's current state
const playerFlags: GameFlagState = {
  quest_dragon_slayer: 'complete',  // Quest done
  item_ancient_key: true,           // Has key
  stat_gold: 1000,                  // Has gold
  dialogue_met_merchant: true        // Met before
};

// 3. Run dialogue
<DialogueSimulator
  dialogue={merchantDialogue}
  initialFlags={playerFlags}
  onComplete={(result) => {
    // Merchant dialogue might:
    // - Set quest_merchant_helped = true
    // - Set stat_gold -= 100 (bought something)
    // - Set item_potion = true (received item)
    
    // Update game state
    gameState.flags = {
      ...gameState.flags,
      ...result.updatedFlags
    };
    
    // Now player can't access "first meeting" dialogue
    // because dialogue_met_merchant is true
  }}
/>

// 4. Next time player talks to merchant
// The dialogue will check flags and show different options:
// - If quest_dragon_slayer == 'complete' → Show "You're a hero!" dialogue
// - If item_ancient_key == true → Show "I see you have the key" dialogue
// - If dialogue_met_merchant == true → Skip introduction
```

## Conditional Dialogue Pattern

```yarn
title: merchant_greeting
---
<<if visited("merchant_greeting")>>
    Merchant: "Welcome back!"
<<else>>
    Merchant: "First time here? Let me introduce myself..."
<<endif>>

<<if $quest_dragon_slayer == "complete">>
    Merchant: "I heard you slayed the dragon! Here, take this reward."
    <<set $item_potion = true>>
    <<set $stat_gold += 500>>
<<endif>>

<<if $item_ancient_key>>
    -> "I found this key..."
        Merchant: "That's the ancient key! I'll buy it for 1000 gold."
        -> Sell it
            <<set $stat_gold += 1000>>
            <<set $item_ancient_key = false>>
            <<jump merchant_thanks>>
        -> Keep it
            <<jump merchant_understands>>
<<endif>>
===
```

## API Reference

### DialogueEditor Props
- `dialogue: DialogueTree | null` - The dialogue to edit
- `flagSchema?: FlagSchema` - Available flags for autocomplete
- `initialFlags?: GameFlagState` - Current game flags (for reference)
- `onChange: (dialogue: DialogueTree) => void` - Called when dialogue changes
- `onExportYarn?: (yarn: string) => void` - Called when exporting Yarn
- `onExportJSON?: (json: string) => void` - Called when exporting JSON

### DialogueSimulator Props
- `dialogue: DialogueTree` - Dialogue to run
- `initialFlags: GameFlagState` - Starting flag state
- `startNodeId?: string` - Node to start from (default: dialogue.startNodeId)
- `onComplete: (result: DialogueResult) => void` - Called when dialogue ends
- `onFlagUpdate?: (flags: GameFlagState) => void` - Called when flags change

### DialogueResult
```typescript
{
  updatedFlags: GameFlagState;      // Final flag state
  dialogueTree: DialogueTree;       // Dialogue (may have changed)
  completedNodeIds: string[];        // Nodes that were visited
}
```





