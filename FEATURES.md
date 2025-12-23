# Dialogue Forge Feature Roadmap

## ✅ Implemented
- Visual node graph editor
- NPC and Player node types
- Drag-and-drop connections
- Context menus (graph and node)
- Memory flags system
- Yarn Spinner export/import
- JSON export/import
- Play test view
- Node editor panel

## 🚧 Planned Enhancements

### User Experience
- [ ] **Quick Add Choice** - Right-click on Player node → "Add Choice" (✅ Already implemented!)
- [ ] **Duplicate Node** - Right-click node → "Duplicate"
- [ ] **Copy/Paste Nodes** - Select nodes, copy, paste elsewhere
- [ ] **Undo/Redo** - History stack for actions
- [ ] **Node Search** - Find nodes by ID or content
- [ ] **Minimap** - Overview of entire graph
- [ ] **Auto-layout** - Organize nodes automatically
- [ ] **Zoom to Fit** - Button to fit all nodes in view

### Yarn Spinner Features
- [ ] **Variables** - Support `$variable` syntax in conditions
- [ ] **Shortcuts** - Support `<<shortcut>>` syntax
- [ ] **Commands** - Support custom `<<command>>` syntax
- [ ] **Visited Tracking** - `visited("node_id")` conditions
- [ ] **Random Choices** - `<<shuffle>>` support
- [ ] **Stop/End** - `<<stop>>` and `<<end>>` commands
- [ ] **Wait** - `<<wait 2>>` timing commands
- [ ] **Conditional Text** - `<<if>>` blocks in dialogue

### Advanced Features
- [ ] **Conditional Choices** - Show/hide choices based on flags (partially implemented)
- [ ] **Variable Conditions** - `$gold >= 100` style conditions
- [ ] **Node Groups** - Group related nodes visually
- [ ] **Comments** - Add notes to nodes
- [ ] **Node Templates** - Save/load node templates
- [ ] **Validation** - Check for orphaned nodes, missing connections
- [ ] **Export Formats** - Twine, Ink, custom JSON schema

### Editor Improvements
- [ ] **Multi-select** - Select multiple nodes
- [ ] **Bulk Edit** - Edit multiple nodes at once
- [ ] **Node Styling** - Custom colors per node type
- [ ] **Connection Labels** - Show labels on connection lines
- [ ] **Snap to Grid** - Align nodes to grid
- [ ] **Keyboard Shortcuts** - Hotkeys for common actions
- [ ] **Node Icons** - Visual indicators for node types

### Integration
- [ ] **Unreal Engine Plugin** - Direct integration
- [ ] **Unity Package** - Unity-specific export
- [ ] **VS Code Extension** - Edit in VS Code
- [ ] **API** - Programmatic access to editor

## Yarn Spinner Syntax to Support

### Variables
```yarn
<<set $has_key = true>>
<<if $has_key>>
    You have the key!
<<endif>>
```

### Visited
```yarn
<<if visited("met_merchant")>>
    Merchant: We meet again!
<<else>>
    Merchant: First time here?
<<endif>>
```

### Shortcuts
```yarn
<<shortcut option1>>
    -> Option 1
    -> Option 2
<<shortcut option2>>
```

### Commands
```yarn
<<play_sound "door_creak">>
<<show_image "key">>
<<set_quest "find_treasure">>
```

### Random
```yarn
<<shuffle>>
    -> Option A
    -> Option B
    -> Option C
```





