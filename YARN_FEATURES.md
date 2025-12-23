# Yarn Spinner Features to Implement

## Currently Supported ✅

- Basic node structure (`title`, `---`, `===`)
- NPC dialogue with speaker names
- Player choices (`->`)
- Variable setting (`<<set $var = true>>`)
- Jump commands (`<<jump node_id>>`)

## Missing Features 🚧

### 1. Conditional Logic
```yarn
<<if $has_key>>
    Guard: The door is unlocked.
<<else>>
    Guard: The door is locked.
<<endif>>
```
**Status**: Not implemented - need to add condition nodes or conditional choices

### 2. Variable Operations
```yarn
<<set $gold += 100>>
<<set $reputation -= 5>>
<<set $health = 50>>
```
**Status**: Only supports boolean flags - need numeric variables

### 3. Visited Tracking
```yarn
<<if visited("MetTheStranger")>>
    Stranger: We meet again.
<<else>>
    Stranger: A new face.
<<endif>>
```
**Status**: Not implemented - need visited node tracking

### 4. Shortcuts
```yarn
title: Start
---
-> Option 1
    <<jump Option1Path>>
-> Option 2
    <<jump Option2Path>>
===
```
**Status**: Partially - we support choices but shortcuts are implicit

### 5. Commands
```yarn
<<wait 2>>
<<shake>>
<<fadeout>>
```
**Status**: Not implemented - these are game-specific commands

### 6. Functions
```yarn
<<if $gold >= 100>>
    Merchant: You can afford this.
<<endif>>

<<if $reputation > 50 and $has_badge>>
    Guard: Welcome, honored guest.
<<endif>>
```
**Status**: Not implemented - need comparison operators and boolean logic

### 7. Random Selection
```yarn
<<shuffle>>
-> Option 1
-> Option 2
-> Option 3
<<endshuffle>>
```
**Status**: Not implemented

### 8. Stop Command
```yarn
<<stop>>
```
**Status**: Not implemented - ends dialogue immediately

## Recommended Implementation Order

1. **Conditional Choices** - Most important for branching
   - Add `conditions` to choices (already in types!)
   - Support `<<if>>` blocks in NPC nodes

2. **Numeric Variables** - Enable stats/currency
   - Extend flag system to support numbers
   - Add variable operations (`+=`, `-=`, `=`)

3. **Visited Tracking** - Track player progress
   - Auto-track visited nodes
   - Add `visited()` function

4. **Comparison Operators** - Enable complex conditions
   - `>=`, `<=`, `>`, `<`, `==`, `!=`
   - Boolean logic (`and`, `or`)

5. **Commands** - Game integration
   - Custom command system
   - Let game handle command execution

## UI Enhancements Needed

- **Condition Editor** - Visual editor for `<<if>>` blocks
- **Variable Panel** - Show all variables and their values
- **Visited Nodes** - Visual indicator of visited nodes
- **Expression Builder** - For complex conditions

