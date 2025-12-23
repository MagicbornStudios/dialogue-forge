# Architecture Analysis & Next Steps

## Current State Assessment

### What Works Well
- ✅ Visual node editor with drag-and-drop
- ✅ Basic Yarn import/export
- ✅ Flag system with types and categories
- ✅ Conditional choices
- ✅ Example system

### Critical Issues
1. **Variable Extraction**: Not extracting all `$variable` references from imported Yarn files
2. **Flag Merge Strategy**: No clear policy for merging supplied flags vs Yarn variables
3. **Complex Data Types**: Only supports boolean/number/string, not objects/arrays
4. **UI Bugs**: Demo selection scrolls off-screen
5. **Minimap**: Broken, needs removal

## Core Problem: Variables vs Flags

### The Challenge

**Yarn Spinner Reality:**
- Variables (`$var`) are stored in Variable Storage at runtime
- `.yarn` files contain commands (`<<set $var = value>>`)
- Variables can be set/read by game code OR dialogue

**Dialogue Forge Reality:**
- We define flags in a schema
- We export flags as Yarn variable commands
- We need to import variables from Yarn files

### The Conflict

When importing a Yarn file:
1. Yarn file has `<<set $quest_dragon = "started">>`
2. User also supplies a Flag Schema with `quest_dragon`
3. **Which one wins?** → User wants supplied flags to win

### Solution Strategy

**Principle: Supplied Flags Override Yarn Variables**

1. **Extract all variables from Yarn file** when importing
2. **Merge with supplied Flag Schema**:
   - If flag exists in schema → Use schema definition (supplied wins)
   - If variable only in Yarn → Create new flag definition (auto-discover)
3. **Support complex types** for game data (element affinity, etc.)

## Proposed Architecture

### 1. Variable Extraction System

```typescript
interface ExtractedVariable {
  name: string;           // Without $ prefix
  inferredType: 'boolean' | 'number' | 'string' | 'object';
  defaultValue?: any;
  usage: {
    set: boolean;        // Found in <<set>>
    condition: boolean;  // Found in <<if>>
    comparison: boolean; // Found in comparisons
  };
}

function extractVariablesFromYarn(yarnContent: string): ExtractedVariable[] {
  // Scan for:
  // - <<set $var = value>>
  // - <<if $var>>
  // - <<if $var == value>>
  // - $var in any context
}
```

### 2. Flag Merge Strategy

```typescript
function mergeFlagSchemas(
  supplied: FlagSchema,
  extracted: ExtractedVariable[]
): FlagSchema {
  // 1. Start with supplied flags (these win)
  const merged = { ...supplied };
  
  // 2. Add extracted variables that don't conflict
  extracted.forEach(variable => {
    if (!supplied.flags.find(f => f.id === variable.name)) {
      // Auto-create flag definition
      merged.flags.push({
        id: variable.name,
        name: variable.name,
        type: inferFlagType(variable.name),
        valueType: variable.inferredType
      });
    }
  });
  
  return merged;
}
```

### 3. Complex Data Type Support

For element affinity, rune familiarity, etc.:

```typescript
interface FlagDefinition {
  // ... existing fields
  valueType?: 'boolean' | 'number' | 'string' | 'object' | 'array';
  structure?: {
    // For objects: define shape
    type: 'object';
    properties: Record<string, FlagValueType>;
  } | {
    // For arrays: define element type
    type: 'array';
    elementType: FlagValueType;
  };
}

// Example: Element Affinity
{
  id: 'player_element_affinity',
  name: 'Element Affinity',
  type: FLAG_TYPE.STAT,
  valueType: 'object',
  structure: {
    type: 'object',
    properties: {
      Fire: 'number',
      Water: 'number',
      Earth: 'number',
      Air: 'number'
    }
  }
}
```

### 4. Yarn Export for Complex Types

```yarn
# For object flags, we need to handle them carefully
<<set $player_element_affinity_Fire = 0.8>>
<<set $player_element_affinity_Water = 0.3>>

# OR use Yarn's variable storage directly (game handles it)
# Dialogue just checks: <<if $player_element_affinity_Fire >= 0.5>>
```

## Next Steps (Prioritized)

### Phase 1: Critical Fixes (Do First)
1. ✅ Remove minimap component
2. ✅ Fix demo selection scroll issue
3. ✅ Add minimap to roadmap as low priority
4. ✅ Clean up redundant header icons

### Phase 2: Variable Extraction (High Priority)
1. **Extract variables from Yarn files**
   - Parse all `$variable` references
   - Detect variable types from usage
   - Track where variables are used (set/check/compare)

2. **Flag merge system**
   - Merge extracted variables with supplied schema
   - Supplied flags always win
   - Auto-create flags for new variables

3. **Import flow update**
   - When importing Yarn, extract variables
   - Show user: "Found X new variables, add to schema?"
   - Auto-merge with existing schema

### Phase 3: Complex Data Support (Medium Priority)
1. **Object/Array flag types**
   - Extend FlagDefinition to support objects
   - UI for defining object structures
   - Export strategy for complex types

2. **Element Affinity example**
   - Create example with element affinity flags
   - Show how to use in conditions
   - Document best practices

### Phase 4: Polish (Lower Priority)
1. Multi-select & copy/paste
2. Undo/redo
3. Node search
4. Better edge routing

## Implementation Plan

### Step 1: Remove Minimap (Immediate)
- Delete Minimap component
- Remove from exports
- Remove from app
- Add to roadmap

### Step 2: Fix Demo Selection (Immediate)
- Ensure dialog stays on screen
- Fix scroll behavior

### Step 3: Variable Extraction (Next Sprint)
- Create `extractVariablesFromYarn()` function
- Update `importFromYarn()` to return extracted variables
- Show extraction results to user

### Step 4: Flag Merge (Next Sprint)
- Create `mergeFlagSchemas()` function
- Update import flow to merge
- Add UI to show what's being merged

### Step 5: Complex Types (Future)
- Extend type system
- Update UI for object/array flags
- Update Yarn export for complex types

## Key Decisions

1. **Supplied flags always win** - User's schema is source of truth
2. **Auto-discover new variables** - Extract from Yarn, add to schema
3. **Support complex types** - But keep Yarn export simple (flatten objects)
4. **Flag import/export** - Keep it, but make it smart about merging

## Questions to Answer

1. **How to handle nested objects in Yarn?**
   - Option A: Flatten (`$player_affinity_Fire`, `$player_affinity_Water`)
   - Option B: Use Yarn's variable storage directly (game manages structure)
   - **Recommendation**: Option A for simplicity, document Option B for advanced users

2. **Should we validate variable names?**
   - Yes - ensure they match Yarn naming conventions
   - Warn on conflicts

3. **How to handle variable values in Yarn?**
   - Extract default values from `<<set $var = value>>`
   - Use as hints for flag definitions





