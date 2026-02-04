# Yarn Spinner Scripting Fundamentals

This document provides a complete reference for Yarn Spinner scripting syntax, based on the official Yarn Spinner documentation.

## Overview

Yarn Spinner is a tool for writing interactive dialogue in games. It uses a simple, text-based format that's easy to read and write. This document covers all syntax elements supported by Dialogue Forge.

## Node Structure

A Yarn file consists of one or more **nodes**. Each node has:

1. **Title**: `title: NodeName`
2. **Separator**: `---`
3. **Content**: Dialogue, commands, options
4. **End Marker**: `===`

```yarn
title: StartNode
---
NPC: Hello, adventurer!
===
```

## Dialogue Lines

### Simple Text
```
Hello, world!
```

### With Speaker
```
NPC: Hello, world!
Player: Hi there!
```

### Multiline Content
```
NPC: This is line one.
NPC: This is line two.
NPC: This is line three.
```

## Variables

Variables store game state and are prefixed with `$`:

- **Boolean**: `$quest_completed`, `$has_key`
- **Number**: `$player_gold`, `$player_level`
- **String**: `$player_name`, `$location`

### Variable Interpolation

Variables can be interpolated into dialogue using `{$variable}`:

```yarn
NPC: Welcome, {$player_name}! You have {$player_gold} gold.
```

## Set Command

The `<<set>>` command sets or modifies variables:

### Assignment
```yarn
<<set $flag = true>>
<<set $count = 5>>
<<set $name = "Alice">>
```

### Operations
```yarn
<<set $gold += 100>>    # Add
<<set $gold -= 50>>     # Subtract
<<set $gold *= 2>>      # Multiply
<<set $gold /= 2>>      # Divide
<<set $gold %= 10>>     # Modulo
```

## Conditional Blocks

Conditional blocks control flow based on variable values:

### If/Else
```yarn
<<if $has_key>>
    Guard: The door is unlocked.
<<else>>
    Guard: The door is locked.
<<endif>>
```

### If/Elseif/Else
```yarn
<<if $gold >= 100>>
    Merchant: You can afford the sword!
<<elseif $gold >= 50>>
    Merchant: You can afford the potion!
<<else>>
    Merchant: You don't have enough gold.
<<endif>>
```

### Condition Operators

- **IS_SET**: `$flag` (true if variable exists and is truthy)
- **IS_NOT_SET**: `not $flag`
- **EQUALS**: `$count == 5`
- **NOT_EQUALS**: `$count != 5`
- **GREATER_THAN**: `$gold > 100`
- **LESS_THAN**: `$gold < 50`
- **GREATER_EQUAL**: `$level >= 5`
- **LESS_EQUAL**: `$health <= 0`

### Multiple Conditions

Use `and` to combine conditions:

```yarn
<<if $quest_started and $player_level >= 5>>
    NPC: You're ready for the quest!
<<endif>>
```

## Options (Player Choices)

Options are presented to the player and start with `->`:

### Simple Choices
```yarn
-> Yes, I'll help you
    <<jump yes_node>>
-> No, I'm busy
    <<jump no_node>>
```

### Conditional Choices
```yarn
<<if $has_key>>
    -> Use key
        <<jump unlock_node>>
<<endif>>
-> Try to force
    <<jump force_node>>
```

### Choices with Set Commands
```yarn
-> Accept quest
    <<set $quest_started = true>>
    <<jump quest_node>>
```

## Jump Command

The `<<jump>>` command transfers control to another node:

```yarn
<<jump NextNode>>
```

Jumps can be conditional or part of choices:

```yarn
<<if $quest_completed>>
    <<jump completed_node>>
<<else>>
    <<jump start_node>>
<<endif>>
```

## Node Structure Examples

### Simple Dialogue Node
```yarn
title: Greeting
---
NPC: Hello, adventurer!
<<set $met_npc = true>>
<<jump next_node>>
===
```

### Player Choice Node
```yarn
title: ChoicePoint
---
NPC: What would you like to do?
-> Go to the shop
    <<jump shop_node>>
-> Go to the inn
    <<jump inn_node>>
-> Leave
    <<jump exit_node>>
===
```

### Conditional Dialogue Node
```yarn
title: ConditionalDialogue
---
<<if $quest_completed>>
    NPC: Thank you for completing the quest!
<<elseif $quest_started>>
    NPC: How is the quest going?
<<else>>
    NPC: Would you like to start a quest?
<<endif>>
===
```

## Comments

Lines starting with `//` are comments:

```yarn
// This is a comment
NPC: Hello! // This is an inline comment
```

## Best Practices

1. **Use descriptive node names**: `start`, `shop_greeting`, `quest_complete`
2. **Keep nodes focused**: One node per dialogue exchange
3. **Use variables for state**: Track quest progress, inventory, etc.
4. **Test conditionals**: Ensure all branches are reachable
5. **Document complex logic**: Use comments for non-obvious flows

## Supported Features

Dialogue Forge supports:
- ✅ All node types (CHARACTER, PLAYER, CONDITIONAL)
- ✅ Variable operations (set, +=, -=, *=, /=, %=)
- ✅ Variable interpolation `{$var}`
- ✅ Conditional blocks (if/elseif/else)
- ✅ Conditional choices
- ✅ Jump commands
- ✅ Set commands in content and choices
- ✅ Multiline content
- ✅ Speaker prefixes

## Reference Links

- [Yarn Spinner Documentation](https://docs.yarnspinner.dev/)
- [Scripting Fundamentals](https://docs.yarnspinner.dev/write-yarn-scripts/scripting-fundamentals)
- [Command Reference](https://docs.yarnspinner.dev/write-yarn-scripts/commands)
- [Variable Reference](https://docs.yarnspinner.dev/write-yarn-scripts/variables)
