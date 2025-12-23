# Flag System Architecture

## Overview

The flag system enables dialogues to interact with game state. Flags represent achievements, quests, items, stats, titles, and more.

## Flag Types & Use Cases

### Dialogue Flags (`dialogue`)
**Temporary, dialogue-scoped**
- Track choices within a single dialogue
- Example: `dialogue_met_stranger`, `dialogue_chose_treasure`
- Reset when dialogue ends (unless saved to persistent flags)

### Quest Flags (`quest`)
**Persistent, game-wide**
- Track quest state: `not_started`, `in_progress`, `complete`, `failed`
- Example: `quest_dragon_slayer`, `quest_dragon_slayer_complete`
- Used for quest progression and conditional dialogue

### Achievement Flags (`achievement`)
**Persistent, game-wide**
- Unlock achievements
- Example: `achievement_first_quest`, `achievement_dragon_slayer`
- Boolean: unlocked/not unlocked

### Item Flags (`item`)
**Persistent, game-wide**
- Track inventory items
- Example: `item_ancient_key`, `item_map`
- Boolean (has/doesn't have) or Number (quantity)

### Stat Flags (`stat`)
**Persistent, game-wide**
- Player statistics
- Example: `stat_reputation`, `stat_gold`, `stat_charisma`
- Number (can increase/decrease)

### Title Flags (`title`)
**Persistent, game-wide**
- Earned player titles
- Example: `title_hero`, `title_merchant`
- Boolean (earned/not earned)

### Global Flags (`global`)
**Persistent, game-wide**
- Game-wide state
- Example: `global_game_started`, `global_day_count`
- Any type

## Game Data Structure

```typescript
interface GameState {
  flags: {
    [flagId: string]: boolean | number | string;
  };
  // ... other game state
}

// Example state
const gameState: GameState = {
  flags: {
    quest_dragon_slayer: "in_progress",
    quest_dragon_slayer_complete: false,
    achievement_first_quest: true,
    item_ancient_key: true,
    stat_gold: 500,
    stat_reputation: 50,
    title_hero: true,
    dialogue_met_stranger: true, // Temporary, cleared after dialogue
  }
};
```

## Editor Integration

The editor accepts a `FlagSchema` that defines available flags:

```typescript
const flagSchema: FlagSchema = {
  categories: ['quests', 'achievements', 'items', 'stats'],
  flags: [
    {
      id: 'quest_dragon_slayer',
      name: 'Dragon Slayer Quest',
      type: 'quest',
      category: 'quests',
      valueType: 'string',
      defaultValue: 'not_started'
    },
    // ... more flags
  ]
};
```

When setting flags in the editor:
1. Type to see matching flags
2. Click a flag from the dropdown to add it
3. Flags are organized by category
4. Flag type is shown with color coding

## Yarn Spinner Export

Flags export to Yarn syntax:

```yarn
<<set $quest_dragon_slayer = "in_progress">>
<<set $item_ancient_key = true>>
<<set $stat_gold += 100>>

<<if $item_ancient_key>>
    You have the key!
<<endif>>

<<if $stat_gold >= 100>>
    You can afford this.
<<endif>>
```

## Implementation in Game

Your game engine should:
1. Load flag schema
2. Initialize game state with default flag values
3. Update flags when dialogue sets them
4. Check flags when evaluating conditions
5. Persist flags to save files

The dialogue editor only references flags - it doesn't manage game state directly.





