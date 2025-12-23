# Unreal Engine Integration Guide

This guide explains how Dialogue Forge works with Yarn Spinner in Unreal Engine.

## How Flags Work with Yarn Spinner

### The Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│ Dialogue Forge  │         │   Yarn Spinner   │         │  Your Game   │
│                 │         │                  │         │              │
│ Flag Schema     │───┐     │  Variable Storage│◄────────┤  Blueprints  │
│ (Definitions)   │   │     │  (Runtime State)│         │     / C++    │
│                 │   │     │                  │         │              │
│ Dialogue Tree   │   │     │   .yarn Files    │         │              │
│ (Visual Nodes)  │   │     │  (Dialogue Text) │         │              │
└─────────────────┘   │     └──────────────────┘         └──────────────┘
                      │
                      │ Export
                      ▼
              ┌───────────────┐
              │  .yarn File   │
              │               │
              │ <<set $var>>  │
              │ <<if $var>>   │
              └───────────────┘
```

### Key Points

1. **Flags = Yarn Variables**: Every flag you define becomes a `$variable` in Yarn
2. **Variables are NOT in .yarn files**: They're stored in Yarn Spinner's Variable Storage at runtime
3. **.yarn files contain commands**: `<<set $flag = value>>` tells Yarn Spinner to update Variable Storage
4. **Bidirectional**: Your game can read/write variables, and dialogues react to them

## Step-by-Step Integration

### 1. Define Flags in Dialogue Forge

Create a Flag Schema that matches your game's state:

```typescript
const flagSchema: FlagSchema = {
  flags: [
    {
      id: 'quest_dragon_slayer',  // This becomes $quest_dragon_slayer in Yarn
      name: 'Dragon Slayer Quest',
      type: FLAG_TYPE.QUEST,
      valueType: FLAG_VALUE_TYPE.STRING
    },
    {
      id: 'item_key',  // This becomes $item_key in Yarn
      type: FLAG_TYPE.ITEM
    },
    {
      id: 'stat_gold',  // This becomes $stat_gold in Yarn
      type: FLAG_TYPE.STAT,
      valueType: FLAG_VALUE_TYPE.NUMBER,
      defaultValue: 0
    }
  ]
};
```

### 2. Create Dialogue in Dialogue Forge

- Build your dialogue visually
- Set flags on nodes/choices
- Add conditions to choices

### 3. Export to Yarn

Click "Export Yarn" → You get a `.yarn` file like:

```yarn
title: merchant_greeting
---
Merchant: "Welcome to my shop!"
<<set $dialogue_met_merchant = true>>

<<if $quest_dragon_slayer == "complete">>
    Merchant: "I heard you slayed the dragon! Here's a reward."
    <<set $stat_gold += 500>>
<<endif>>

-> "I want to buy something"
    <<jump shop_menu>>
-> "I want to sell something"
    <<jump sell_menu>>
===
```

### 4. Import into Unreal

1. Add the `.yarn` file to your Yarn Spinner project in Unreal
2. Yarn Spinner automatically:
   - Parses the dialogue structure
   - Recognizes `$variable` references
   - Sets up Variable Storage entries

### 5. Access Variables in Unreal

#### In Blueprints

```
Get Yarn Spinner Variable Storage
  └─> Get Value (Name: "quest_dragon_slayer")
      └─> Returns: "complete" (or current value)
```

#### In C++

```cpp
// Get variable storage
auto* VariableStorage = GetWorld()->GetSubsystem<UYarnVariableStorage>();

// Read variable
FString QuestState;
VariableStorage->GetValue("quest_dragon_slayer", QuestState);

// Set variable
VariableStorage->SetValue("quest_dragon_slayer", "complete");
```

### 6. Sync Game State with Yarn

**When dialogue starts:**
```cpp
// Set Yarn variables from your game state
VariableStorage->SetValue("quest_dragon_slayer", GameState->QuestState);
VariableStorage->SetValue("stat_gold", GameState->Gold);
VariableStorage->SetValue("item_key", GameState->HasKey);
```

**When dialogue ends:**
```cpp
// Read Yarn variables back to game state
FString QuestState;
VariableStorage->GetValue("quest_dragon_slayer", QuestState);
GameState->QuestState = QuestState;

int32 Gold;
VariableStorage->GetValue("stat_gold", Gold);
GameState->Gold = Gold;
```

## Variable Storage Lifecycle

### At Runtime

1. **Dialogue Starts**: Yarn Spinner loads `.yarn` file
2. **Variables Initialized**: Variable Storage is created (empty or from save)
3. **Game Sets Variables**: Your code sets initial state
4. **Dialogue Runs**: Yarn evaluates conditions, sets variables
5. **Game Reads Variables**: Your code reads updated state
6. **Variables Persist**: Until explicitly cleared or game restarts

### Persistence

Yarn Spinner's Variable Storage can:
- **Persist across sessions**: Save/load variable state
- **Be reset**: Clear all variables
- **Be queried**: Check if variable exists, get all variables

## Example: Complete Quest Flow

### In Dialogue Forge

1. **Define Flag**: `quest_dragon_slayer` (type: quest, valueType: string)
2. **Create Dialogue**:
   - NPC: "Will you help slay the dragon?"
   - Choice: "Yes!" → Sets `quest_dragon_slayer = "started"`
   - Choice: "Not now" → No flag set
3. **Export**: Get `dragon_quest.yarn`

### In Unreal

```cpp
// When player talks to NPC
void AQuestGiver::StartDialogue()
{
    // Set initial state
    auto* Storage = GetVariableStorage();
    Storage->SetValue("quest_dragon_slayer", "not_started");
    
    // Run dialogue
    YarnRunner->StartDialogue("dragon_quest");
}

// When dialogue completes
void AQuestGiver::OnDialogueComplete()
{
    // Check what happened
    FString QuestState;
    GetVariableStorage()->GetValue("quest_dragon_slayer", QuestState);
    
    if (QuestState == "started")
    {
        // Player accepted quest
        StartQuest();
    }
}
```

### The .yarn File (What Unreal Sees)

```yarn
title: quest_offer
---
QuestGiver: "Will you help slay the dragon?"
-> "Yes, I'll help!"
    <<set $quest_dragon_slayer = "started">>
    <<jump quest_accepted>>
-> "Not right now"
    <<jump quest_declined>>
===
```

**Note**: The variable `$quest_dragon_slayer` is NOT stored in this file. It's stored in Variable Storage when `<<set>>` runs.

## Importing Existing Yarn Files

If you have existing `.yarn` files:

1. **Import into Dialogue Forge**: Click Import → Select `.yarn` file
2. **Edit Visually**: Modify nodes, add flags, change flow
3. **Re-export**: Get updated `.yarn` file
4. **Replace in Unreal**: Update the file in your project

Variables in the imported file are detected and can be added to your Flag Schema.

## Flag Schema Sync

### Export Flag Schema

1. Click "Export Flags" → Get `flag-schema.json`
2. This contains all your flag definitions

### Import Flag Schema

1. Click "Import Flags" → Select `flag-schema.json`
2. All flags are loaded with their types and defaults

### Why This Matters

Your Flag Schema helps Dialogue Forge:
- Show available flags in dropdowns
- Validate flag references
- Export correct Yarn syntax
- Provide autocomplete

But the **actual variable values** are managed by Yarn Spinner's Variable Storage at runtime.

## Best Practices

### 1. Consistent Naming

Use the same flag IDs in Dialogue Forge and Unreal:

```typescript
// Dialogue Forge
{ id: 'quest_dragon_slayer', ... }
```

```cpp
// Unreal
Storage->SetValue("quest_dragon_slayer", "complete");
```

### 2. Type Consistency

Match value types:

```typescript
// Dialogue Forge
{ id: 'stat_gold', valueType: FLAG_VALUE_TYPE.NUMBER }
```

```cpp
// Unreal - use correct type
int32 Gold = 100;
Storage->SetValue("stat_gold", Gold);  // Not a string!
```

### 3. Export Flag Schema

Keep your Flag Schema in version control and share it with your team. It documents what variables your dialogues use.

### 4. Test in Dialogue Forge

Use the Play View and Debug Flags panel to test dialogues before exporting. This catches issues early.

## Troubleshooting

**Problem**: Variables not persisting in Unreal  
**Solution**: Check that Variable Storage is configured to persist. Some setups clear variables on level change.

**Problem**: Conditions not working  
**Solution**: Verify variable names match exactly (case-sensitive). Check variable types match (string vs number).

**Problem**: Can't see variables in Blueprints  
**Solution**: Variables are stored in Yarn Spinner's Variable Storage subsystem, not as Blueprint variables. Access them through the Variable Storage node.

## Summary

- **Flags in Dialogue Forge** → **Variables in Yarn Spinner** (`$variable`)
- **Variables stored in** → **Yarn Spinner Variable Storage** (runtime, not in .yarn file)
- **.yarn file contains** → **Commands** (`<<set $var>>`, `<<if $var>>`)
- **Your game** → **Reads/writes variables** from Variable Storage
- **Dialogue reacts** → **To variable values** set by your game

This creates a seamless loop: Game sets variables → Dialogue reacts → Dialogue sets variables → Game reacts.





