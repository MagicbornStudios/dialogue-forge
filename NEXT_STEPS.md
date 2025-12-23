# Next Steps & Architecture Decisions

## ✅ Completed (This Session)

### Critical Fixes
1. **Removed Minimap** - Component removed, added to roadmap as low priority
2. **Fixed Demo Selection** - Added max-height to prevent scroll issues
3. **Cleaned Header Icons** - Removed redundant buttons, better grouping

### Variable Extraction System
1. **Created `variable-extractor.ts`** - Extracts all `$variable` references from Yarn files
2. **Updated `importFromYarn()`** - Now returns `{ dialogue, extractedVariables }`
3. **Created `mergeExtractedVariables()`** - Merges extracted variables with supplied schema
4. **Updated Import Flow** - Automatically extracts and merges variables on import

### Documentation
1. **Updated Guide** - Added key details about flags = Yarn variables
2. **Created UNREAL_INTEGRATION.md** - Complete Unreal integration guide
3. **Created ARCHITECTURE_ANALYSIS.md** - Technical analysis and decisions
4. **Updated Roadmap** - Shows current work and priorities

## 🎯 Current Architecture: Variables & Flags

### The Solution

**Principle: Supplied Flags Always Override Extracted Variables**

When importing a Yarn file:
1. Extract all `$variable` references
2. Merge with supplied Flag Schema:
   - **Supplied flags win** - If flag exists in schema, use schema definition
   - **Auto-discover new** - If variable only in Yarn, create flag definition
3. User is notified of new variables found

### How It Works

```typescript
// 1. Import Yarn file
const { dialogue, extractedVariables } = importFromYarn(yarnContent);

// 2. Merge with your flag schema
const mergedSchema = mergeExtractedVariables(
  yourFlagSchema,  // Your defined flags (these win)
  extractedVariables  // Variables found in Yarn (auto-added if new)
);

// 3. Use merged schema
setFlagSchema(mergedSchema);
```

### Example Flow

**Scenario 1: Import Yarn with new variables**
```
Yarn file has: <<set $quest_new_quest = "started">>
Your schema has: quest_dragon_slayer

Result: 
- quest_dragon_slayer (from your schema) - KEPT
- quest_new_quest (from Yarn) - AUTO-ADDED to schema
```

**Scenario 2: Import Yarn with conflicting variables**
```
Yarn file has: <<set $quest_dragon_slayer = "complete">>
Your schema has: quest_dragon_slayer (type: quest, valueType: string)

Result:
- quest_dragon_slayer (from your schema) - YOUR DEFINITION WINS
- Yarn variable value is ignored (schema definition is source of truth)
```

## 🚀 Next Crucial Steps (Prioritized)

### Phase 1: Complete Variable System (Do Next)

**1. Test Variable Extraction**
- [ ] Test with real Yarn files
- [ ] Verify all variable patterns are caught
- [ ] Test merge behavior

**2. UI for Variable Discovery**
- [ ] Show notification when new variables found
- [ ] Allow user to review before auto-adding
- [ ] Show which variables were added vs kept from schema

**3. Flag Import/Export Strategy**
- [ ] Keep flag import/export buttons
- [ ] When exporting flags, include extracted variables
- [ ] When importing flags, merge intelligently

### Phase 2: Complex Data Types (High Priority)

**For Element Affinity & Rune Familiarity:**

**Option A: Flatten Objects (Recommended)**
```typescript
// Instead of: player_element_affinity = { Fire: 0.8, Water: 0.3 }
// Use: player_element_affinity_Fire = 0.8, player_element_affinity_Water = 0.3

// In Yarn:
<<if $player_element_affinity_Fire >= 0.5>>
    You have strong Fire affinity!
<<endif>>
```

**Option B: Game Manages Structure**
```typescript
// Flag is just: player_element_affinity = true (boolean)
// Game code manages the object structure
// Dialogue checks: <<if $player_element_affinity>>
// Game code reads object from separate storage
```

**Recommendation: Option A**
- Simpler for Yarn Spinner
- Works with existing variable system
- Easy to check individual values
- Can still group in UI by prefix

**Implementation:**
1. Extend FlagDefinition to support "object" type with structure
2. UI shows grouped flags (player_element_affinity_*)
3. Export flattens to individual variables
4. Document pattern for users

### Phase 3: Enhanced Yarn Support

**1. Conditional Blocks**
- Support `<<if>>`, `<<elseif>>`, `<<else>>`, `<<endif>>`
- Visual conditional nodes in editor
- Export properly nested conditionals

**2. Advanced Set Operations**
- `<<set $var += 10>>` (increment)
- `<<set $var -= 5>>` (decrement)
- Support in flag system

**3. Variable References in Text**
- Support `$variable` in dialogue text
- Show variable values in play view

### Phase 4: Editor Enhancements

**1. Multi-Select & Copy/Paste**
- Select multiple nodes
- Copy with connections
- Paste with offset

**2. Undo/Redo**
- Action history
- Keyboard shortcuts

**3. Node Search**
- Search by ID, content, flags
- Filter by type

## 📋 Updated Roadmap (In Guide)

The roadmap in the guide now shows:
- **In Progress**: Variable extraction, complex data types
- **Planned (High)**: Conditional blocks, multi-select, undo/redo
- **Planned (Medium)**: Node search, edge routing, alignment
- **Low Priority**: Minimap (removed, will revisit)

## 🔑 Key Decisions Made

1. **Supplied flags override extracted variables** - User's schema is source of truth
2. **Auto-discover new variables** - Extract from Yarn, add to schema automatically
3. **Keep flag import/export** - But make it smart about merging
4. **Complex types: flatten objects** - Simpler for Yarn, easier to work with
5. **Minimap removed** - Low priority, revisit later

## 🐛 Known Issues Fixed

- ✅ Minimap zoom issues → Removed
- ✅ Demo selection scroll → Fixed with max-height
- ✅ Redundant icons → Cleaned up

## 📝 Documentation Updates

- ✅ Guide updated with flags = variables explanation
- ✅ Unreal integration guide created
- ✅ Architecture analysis document created
- ✅ Roadmap visible in guide panel

## 🎯 Immediate Next Actions

1. **Test variable extraction** with real Yarn files
2. **Add UI for variable discovery** (show what's being added)
3. **Design complex type system** (element affinity example)
4. **Update flag import/export** to handle merging
5. **Add conditional blocks support** (if/elseif/else)

## 💡 For Your Element Affinity Use Case

**Recommended Approach:**

```typescript
// Define flags as flattened:
{
  id: 'player_element_affinity_Fire',
  name: 'Fire Affinity',
  type: FLAG_TYPE.STAT,
  valueType: FLAG_VALUE_TYPE.NUMBER,
  defaultValue: 0
},
{
  id: 'player_element_affinity_Water',
  name: 'Water Affinity',
  type: FLAG_TYPE.STAT,
  valueType: FLAG_VALUE_TYPE.NUMBER,
  defaultValue: 0
},
// ... etc

// In dialogue conditions:
// <<if $player_element_affinity_Fire >= 0.5>>
//     "You have strong Fire magic!"
// <<endif>>

// In game code:
// Set all affinities, dialogue checks individual ones
```

This keeps it simple, works with Yarn Spinner, and is easy to manage.





