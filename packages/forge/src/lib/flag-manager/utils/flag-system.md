# Flag System Design

## Overview

The flag system manages game state that dialogues can read and modify. Flags enable conditional dialogue, quest progression, achievements, and more.

## Flag Types

### 1. Dialogue Flags (`dialogue`)
**Scope**: Temporary, dialogue-scoped  
**Use Case**: Track choices within a single dialogue session  
**Example**: `dialogue_met_stranger`, `dialogue_chose_treasure`  
**Lifetime**: Reset when dialogue ends (unless explicitly saved)

### 2. Quest Flags (`quest`)
**Scope**: Persistent, game-wide  
**Use Case**: Track quest state and completion  
**Example**: `quest_dragon_slayer`, `quest_dragon_slayer_complete`  
**States**: `not_started`, `in_progress`, `complete`, `failed`

### 3. Achievement Flags (`achievement`)
**Scope**: Persistent, game-wide  
**Use Case**: Unlock achievements  
**Example**: `achievement_first_quest`, `achievement_dragon_slayer`  
**Value**: Boolean (unlocked/not unlocked)

### 4. Item Flags (`item`)
**Scope**: Persistent, game-wide  
**Use Case**: Track inventory items  
**Example**: `item_ancient_key`, `item_map`  
**Value**: Boolean (has/doesn't have) or Number (quantity)

### 5. Stat Flags (`stat`)
**Scope**: Persistent, game-wide  
**Use Case**: Player statistics  
**Example**: `stat_reputation`, `stat_gold`, `stat_charisma`  
**Value**: Number (can increase/decrease)

### 6. Title Flags (`title`)
**Scope**: Persistent, game-wide  
**Use Case**: Earned player titles  
**Example**: `title_hero`, `title_merchant`  
**Value**: Boolean (earned/not earned)

### 7. Global Flags (`global`)
**Scope**: Persistent, game-wide  
**Use Case**: Game-wide state  
**Example**: `global_game_started`, `global_day_count`  
**Value**: Any type

## Flag Operations

### Setting Flags
```yarn
<<set $quest_dragon_slayer = "in_progress">>
<<set $item_ancient_key = true>>
<<set $stat_gold += 100>>
<<set $stat_reputation = 50>>
```

### Checking Flags
```yarn
<<if $item_ancient_key>>
    You have the key!
<<endif>>

<<if $stat_gold >= 100>>
    You can afford this.
<<endif>>

<<if $quest_dragon_slayer == "complete">>
    The dragon is slain!
<<endif>>
```

## Flag Naming Conventions

Use prefixes to organize flags:
- `quest_*` - Quest-related
- `achievement_*` - Achievements
- `item_*` - Items
- `stat_*` - Statistics
- `title_*` - Titles
- `dialogue_*` - Dialogue-scoped (temporary)
- `global_*` - Global state

## Flag Categories

Group flags by game system:
- `quests` - All quest flags
- `achievements` - All achievement flags
- `items` - All item flags
- `stats` - All stat flags
- `titles` - All title flags
- `dialogue` - Dialogue-scoped flags

## Use Cases

### 1. Conditional Dialogue
```yarn
<<if $quest_dragon_slayer_complete>>
    NPC: "You're the one who slayed the dragon!"
<<else>>
    NPC: "Have you heard about the dragon?"
<<endif>>
```

### 2. Quest Progression
```yarn
NPC: "Find the ancient key."
-> I'll help you
    <<set $quest_find_key = "in_progress">>
    <<jump quest_started>>
```

### 3. Achievement Unlocking
```yarn
NPC: "You completed your first quest!"
<<set $achievement_first_quest = true>>
```

### 4. Item Requirements
```yarn
<<if $item_ancient_key>>
    -> Use the ancient key
        <<jump unlock_door>>
<<endif>>
```

### 5. Stat Checks
```yarn
<<if $stat_reputation >= 50>>
    -> The guards recognize you as a hero
        <<jump hero_path>>
<<endif>>
```

### 6. Title Display
```yarn
<<if $title_hero>>
    NPC: "Hero, we need your help!"
<<endif>>
```

## Implementation in Editor

The editor will:
1. Accept a `FlagSchema` prop with flag definitions
2. Show available flags in dropdowns when setting/checking flags
3. Validate flag references
4. Export proper Yarn syntax based on flag types
5. Show flag categories for organization

## Game Data Structure

```typescript
interface GameState {
  flags: {
    [flagId: string]: boolean | number | string;
  };
  // ... other game state
}
```

The dialogue editor doesn't manage game state directly - it only references flags. Your game engine handles the actual state management.






