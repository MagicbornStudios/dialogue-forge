# Enhancement Roadmap

## ✅ Recently Completed (V2 Migration)

- [x] **React Flow Migration** - Complete rewrite using React Flow
  - Custom NPC and Player node components
  - Color-coded choice edges
  - Node dragging, pan, zoom (React Flow built-in)
  - Context menus (pane and node)
  - NodeEditor sidebar integration
  - Flag indicators on nodes with color coding
  - Fixed all critical bugs (flag duplication, PlayView freeze, handle positioning)

- [x] **Minimap** - React Flow built-in minimap
- [x] **Zoom Controls** - React Flow built-in controls
- [x] **Node Context Menu** - Right-click on nodes for quick actions
- [x] **Flag System** - Full flag support with color coding (quest, achievement, item, stat, title, global, dialogue)
- [x] **Edge Drop Menu** - Create nodes when dropping edge on empty space with auto-connect
- [x] **Multi-Select** - Selection box (drag to select) and multi-delete
- [x] **Delete Key** - Delete selected nodes with Delete/Backspace key
- [x] **Undo/Redo** - React Flow built-in undo/redo system

## Yarn Spinner Feature Support

### ✅ Currently Implemented (Core Features)
- [x] **Nodes and Lines** - Basic dialogue structure with speakers
- [x] **Options** - Player choices (`-> Choice text`)
- [x] **Jump Command** - `<<jump node_id>>` for navigation
- [x] **Conditional Blocks** (`<<if>>`, `<<elseif>>`, `<<else>>`, `<<endif>>`)
  - [x] Basic conditional blocks in NodeEditor
  - [x] Export/import conditional blocks
  - [x] Visual conditional nodes in graph editor
  - [x] Support flag checks with operators (==, !=, >, <, >=, <=)
  - [x] Conditional choices (choices wrapped in `<<if>>`)
  - [ ] Nested conditionals (enhancement)
- [x] **Basic Set Command** - `<<set $flag = true>>` (boolean flags only)
- [x] **Advanced Set Operations** - `<<set $var += value>>`, `<<set $var -= value>>`, `<<set $var *= value>>`, `<<set $var /= value>>`
- [x] **Variable Interpolation** - `{$variable}` in dialogue text
- [x] **Condition Operators** - is_set, is_not_set, ==, !=, >, <, >=, <=
- [x] **Multiple Conditions** - AND logic (`$flag1 == 5 and $flag2 > 10`)
- [x] **Condition Editor UX** - 2-column layout with operator/keyword quick reference, pro tips, and improved autocomplete

### 🔥 Phase 1: Core Variables & Operations (HIGH PRIORITY - Next Sprint)
- [x] **Advanced Set Operations** - ✅ **COMPLETED**
  - [x] `<<set $var += 10>>` (increment)
  - [x] `<<set $var -= 5>>` (decrement)
  - [x] `<<set $var *= 2>>` (multiply)
  - [x] `<<set $var /= 2>>` (divide)
  - [x] Parse and execute in PlayView
  - [x] Export/import with correct syntax
- [x] **Variable Interpolation** - ✅ **COMPLETED**
  - [x] `{$variable}` syntax in dialogue text
  - [x] Runtime variable replacement
  - [x] Export/import support

- [ ] **Full Variable System** (`$variable`) - **IN PROGRESS**
  - [x] Variable operations (+=, -=, *=, /=)
  - [x] Variable interpolation in text
  - [ ] Variable types (string, number, boolean) - partial (works but needs UI)
  - [ ] Variable management UI (similar to FlagManager)
  - [x] Variable state tracking in PlayView
  - [ ] Variable initialization from schema/defaults

### 📅 Phase 2: Commands & Flow Control (MEDIUM PRIORITY)
- [ ] **Detour Command** (`<<detour node_id>>`)
  - Temporary jump that returns to original position
  - Stack-based navigation
  - Return mechanism

- [ ] **Once Command** (`<<once>>`)
  - Mark options to only appear once
  - Track visited choices
  - Visual indicator in editor

- [ ] **Wait Command** (`<<wait 2>>`)
  - Pause dialogue for specified seconds
  - Timing controls in PlayView
  - Visual timing indicator

- [ ] **Stop Command** (`<<stop>>`)
  - End dialogue immediately
  - Handle in PlayView
  - Visual indicator

### 🎯 Phase 3: Shortcuts & Advanced Features (MEDIUM PRIORITY)
- [ ] **Shortcuts** (`[[text|node]]`)
  - Inline shortcuts in dialogue text
  - Visual representation in editor (underlined/colored)
  - Clickable shortcuts in PlayView
  - Parse from Yarn format
  - Export to Yarn format

- [ ] **Tags** (`#tag`)
  - Tag system for nodes
  - Filter/search by tags
  - Tag-based organization
  - Export tags in node headers

- [ ] **Node Headers** (metadata)
  - `color:` header for node colors
  - `group:` header for node grouping
  - `style: note` for sticky notes
  - Visual representation in editor

### 🚀 Phase 4: Functions & Smart Features (LOWER PRIORITY)
- [ ] **Built-in Functions**
  - `visited("node_id")` - Check if node was visited
  - `random(min, max)` - Random number generation
  - `dice(sides)` - Dice roll
  - Function calls in conditions
  - Function execution in PlayView

- [ ] **Custom Functions**
  - User-defined function support
  - Function registration system
  - Function parameters
  - Function return values

- [ ] **Smart Variables**
  - Auto-incrementing variables
  - Variable dependencies
  - Variable validation

- [ ] **Enums**
  - Enum type support
  - Enum values in conditions
  - Enum dropdowns in editor

- [ ] **Line Groups**
  - Group multiple lines together
  - Random line selection
  - Sequential line playback

### 🔧 Phase 5: PlayView/Dialogue Runner Improvements (HIGH PRIORITY)

#### Current State Analysis
**What Works:**
- Basic dialogue flow (NPC → Player → NPC)
- Conditional blocks (if/elseif/else) evaluation
- Conditional choices filtering
- Flag setting (boolean only)
- Basic jump navigation
- History tracking
- Debug panel for flags

**What Needs Improvement:**
- Variable system is limited to boolean flags
- No support for string/number variables
- No variable operations (+=, -=, *=, /=)
- No variable references in dialogue text
- No command processing (wait, stop, detour, once)
- No function execution
- No shortcuts support
- Limited error handling
- Not a true Yarn Spinner execution engine

#### Rebuild Plan: PlayView as Yarn Runner

- [ ] **Core Execution Engine**
  - [ ] Line-by-line Yarn script execution
  - [ ] Command processing pipeline
  - [ ] Variable state management (string, number, boolean)
  - [ ] Function execution system
  - [ ] Error handling and validation
  - [ ] Performance optimization

- [ ] **Variable System**
  - [ ] Variable storage (separate from flags)
  - [ ] Variable types (string, number, boolean)
  - [ ] Variable operations (set, +=, -=, *=, /=)
  - [ ] Variable references in text (`"Hello {$name}"`)
  - [ ] Variable initialization
  - [ ] Variable persistence

- [ ] **Command Processing**
  - [ ] `<<set $var = value>>` - Full support
  - [ ] `<<set $var += value>>` - Increment
  - [ ] `<<set $var -= value>>` - Decrement
  - [ ] `<<set $var *= value>>` - Multiply
  - [ ] `<<set $var /= value>>` - Divide
  - [ ] `<<jump node_id>>` - Navigation
  - [ ] `<<detour node_id>>` - Temporary jump with return
  - [ ] `<<wait seconds>>` - Pause dialogue
  - [ ] `<<stop>>` - End dialogue
  - [ ] `<<once>>` - Mark option to appear once
  - [ ] `<<command param>>` - Custom commands

- [ ] **Function System**
  - [ ] `visited("node_id")` - Check if node visited
  - [ ] `random(min, max)` - Random number
  - [ ] `dice(sides)` - Dice roll
  - [ ] Custom function registration
  - [ ] Function calls in conditions
  - [ ] Function return values

- [ ] **Shortcuts & Tags**
  - [ ] Parse `[[text|node]]` shortcuts
  - [ ] Render shortcuts in PlayView
  - [ ] Clickable shortcuts
  - [ ] Parse `#tag` tags
  - [ ] Tag-based filtering

- [ ] **Yarn Parser Improvements**
  - [ ] Full Yarn Spinner syntax support
  - [ ] Better error messages
  - [ ] Line-by-line parsing
  - [ ] Command parsing
  - [ ] Function parsing
  - [ ] Tag parsing
  - [ ] Node header parsing (color, group, style)

- [ ] **Export/Import Improvements**
  - [ ] Round-trip compatibility (import → edit → export)
  - [ ] Preserve all Yarn features
  - [ ] Handle edge cases
  - [ ] Validation before export
  - [ ] Support all Yarn Spinner features

### Phase 2: Commands & Shortcuts (Medium Priority)
- [ ] **Commands** (`<<command>>`)
  - Command node type
  - Command parameters
  - Custom command definitions
  - Command execution in simulation

- [ ] **Shortcuts** (`[[text|node]]`)
  - Inline shortcuts in dialogue text
  - Visual representation in editor
  - Clickable shortcuts in play view

- [ ] **Tags** (`#tag`)
  - Tag system for nodes
  - Filter/search by tags
  - Tag-based organization

### Phase 3: Advanced Features (Lower Priority)
- [ ] **Functions**
  - Built-in functions (random, visited, etc.)
  - Custom function support
  - Function calls in conditions

- [ ] **Wait/Stop Commands**
  - `<<wait 2>>` - Pause dialogue
  - `<<stop>>` - End dialogue
  - Timing controls

- [ ] **Localization Support**
  - Multi-language support
  - String table integration
  - Language switching

## UI/UX Enhancements

### ✅ Recently Completed
- [x] **Condition Editor Redesign** - 2-column layout with quick reference sidebar
  - [x] Left sidebar with operators, keywords, and templates
  - [x] Pro tip about `$` for accessing variables/flags
  - [x] Improved autocomplete with tag styling
  - [x] Debounced suggestions (300ms) for smoother experience
  - [x] Drag-and-drop support for operators/keywords
- [x] **Custom Scrollbars** - Purple gradient scrollbars for dialogue-forge package
- [x] **ConditionAutocomplete Improvements**
  - [x] Tag-based styling for variables, operators, and keywords
  - [x] Shows `$` prefix in variable suggestions
  - [x] Only shows suggestions when actively typing (not on focus)
  - [x] Better visual feedback and hover states

## Graph Editor Enhancements

### Phase 1: Core UX Improvements (High Priority)
- [x] **Minimap** - ✅ React Flow built-in
  - [x] Overview of entire graph
  - [x] Click to navigate
  - [x] Current view indicator

- [x] **Zoom Controls** - ✅ React Flow built-in
  - [x] Zoom in/out buttons
  - [x] Mouse wheel zoom
  - [x] Zoom to fit
  - [ ] Zoom to selection (enhancement)

- [x] **Multi-Select** - ✅ Complete (with known issues - deprioritized)
  - [x] Click + drag to select multiple nodes (selection box)
  - [x] Multi-select with selection box
  - [x] Bulk operations (delete multiple nodes)
  - [x] Selection box visual feedback
  - [ ] Shift+click for multi-select (enhancement - **DEPRIORITIZED**)
  - [ ] Copy/paste for multi-selected nodes (next feature)
  - [ ] **Known Issue**: Square selection doesn't always capture all nodes in the selection box (deprioritized)

- [ ] **Copy/Paste** - **HIGH PRIORITY**
  - Copy selected nodes
  - Paste with offset
  - Duplicate nodes
  - Copy connections

- [x] **Undo/Redo** - ✅ Complete (React Flow built-in)
  - [x] Action history (React Flow manages)
  - [x] Keyboard shortcuts (Ctrl+Z, Ctrl+Y / Cmd+Z, Cmd+Y)
  - [x] Works for all node/edge operations
  - [ ] Visual undo/redo buttons (enhancement)

### Phase 2: Navigation & Organization (Medium Priority)
- [ ] **Node Search/Filter** - **MEDIUM PRIORITY**
  - Search by node ID, content, speaker
  - Filter by node type
  - Filter by flags used
  - Highlight search results
  - Jump to node from search

- [ ] **Node Grouping/Folders** - **LOWER PRIORITY**
  - Group related nodes
  - Collapse/expand groups
  - Visual grouping indicators
  - Move groups together

- [x] **Better Edge Routing** - ✅ Partially complete
  - [x] Curved edges (React Flow smoothstep)
  - [x] Edge colors by type (choice edges color-coded)
  - [x] Edge hover highlighting
  - [x] Edge deletion (Delete key or click to select + delete)
  - [ ] Smart edge paths (avoid nodes) - enhancement
  - [ ] Edge labels - enhancement

- [ ] **Node Alignment Tools**
  - Align left/right/center
  - Align top/bottom/middle
  - Distribute evenly
  - Snap to grid

### Phase 3: Advanced Features (Lower Priority)
- [ ] **Node Templates**
  - Save node templates
  - Quick insert templates
  - Template library

- [ ] **Keyboard Shortcuts**
  - Comprehensive shortcut system
  - Customizable shortcuts
  - Shortcut hints/cheat sheet

- [ ] **Visual Enhancements**
  - Node icons
  - Custom node colors
  - Connection animations
  - Better visual feedback

- [ ] **Performance Optimizations**
  - Virtual scrolling for large graphs
  - Lazy node rendering
  - Optimized edge rendering

## Implementation Priority

### 🔥 Immediate (Next Sprint) - Critical for Yarn Compatibility
1. **Full Variable System** - Core Yarn Spinner feature (string, number, boolean)
2. **Advanced Set Operations** - `+=`, `-=`, `*=`, `/=` operators
3. **Rebuild PlayView as Yarn Runner** - Proper execution engine
4. **Yarn Parser Improvements** - Full syntax support, better error handling
5. **Export/Import Round-trip** - Ensure compatibility

### 📅 Short Term (Next Month) - High Value Features
1. **Detour Command** - Temporary jumps with return
2. **Once Command** - Mark options to appear only once
3. **Shortcuts** (`[[text|node]]`) - Inline navigation
4. **Wait/Stop Commands** - Timing and flow control
5. **Node search/filter** - Essential for large dialogues
6. **Copy/paste** - Essential for workflow efficiency

### 🎯 Medium Term (Next Quarter) - Feature Enhancements
1. **Tags system** (`#tag`) - Node organization
2. **Node Headers** - color, group, style metadata
3. **Built-in Functions** - visited(), random(), dice()
4. **Node alignment tools** - Align, distribute, snap to grid
5. **Nested conditionals** - Enhanced conditional support
6. **Visual undo/redo buttons** - Better UX

### 🚀 Long Term (Future) - Nice to Have
1. **Custom Functions** - User-defined function support
2. **Smart Variables** - Auto-incrementing, dependencies
3. **Enums** - Enum type support
4. **Line Groups** - Random/sequential line selection
5. **Localization** - Multi-language support
6. **Node templates** - Reusable node patterns
7. **Performance optimizations** - Virtual scrolling, lazy rendering
8. **Advanced visual features** - Animations, custom colors, icons

## Known Issues & Bugs

### Critical Bugs (Fix Immediately)
- [ ] None currently - all critical bugs resolved

### Minor Issues
- [ ] Flag display in NodeEditor can be stale until tab switch (monitoring - partially fixed)
- [ ] Square selection doesn't always capture all nodes in the selection box (deprioritized)

## Technical Debt

- [x] Clean up V1 components (removed DialogueEditorV1 and GraphViewV1)
- [ ] Improve type safety in reactflow-converter
- [ ] Add comprehensive error boundaries
- [ ] Improve test coverage
- [ ] Performance profiling for large graphs (100+ nodes)

## Technical Considerations

### Data Structure Updates
- Add `ConditionalNode` type for if/else blocks
- Add `CommandNode` type for commands
- Extend `DialogueNode` with variable support
- Add `VariableDefinition` to schema

### UI Components Needed
- ConditionalNodeEditor
- VariableManager
- ~~Minimap component~~ ✅ (React Flow built-in)
- ~~ZoomControls component~~ ✅ (React Flow built-in)
- ~~MultiSelectHandler~~ ✅ (React Flow built-in)
- ~~UndoRedoManager~~ ✅ (React Flow built-in)

### Yarn Converter Updates
- Parse conditional blocks
- Parse variables
- Parse commands
- Parse shortcuts
- Export all new features


