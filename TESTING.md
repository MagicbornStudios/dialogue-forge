# Testing Dialogue Forge

## Quick Test Checklist

### Basic Functionality
- [ ] Create NPC node (right-click empty space)
- [ ] Create Player node (right-click empty space)
- [ ] Edit node content (click node, edit in side panel)
- [ ] Connect nodes (drag from output port to another node)
- [ ] Create node from edge (drag edge to empty space)
- [ ] Delete node (select node, press Delete key)

### Node Context Menu (Right-click on node)
- [ ] Right-click NPC node → See context menu
- [ ] "Edit Node" → Opens editor panel
- [ ] "Add Choice" (on Player node) → Adds new choice
- [ ] "Play from Here" → Switches to play mode
- [ ] "Delete Node" → Removes node (except start node)

### Player Node Features
- [ ] Add choice via context menu
- [ ] Add choice via editor panel "+ Add" button
- [ ] Edit choice text
- [ ] Connect choice to target node
- [ ] Set flags on choice
- [ ] Delete choice

### Memory Flags
- [ ] Set flags on NPC node (Set Flags field)
- [ ] Set flags on Player choice
- [ ] Flags appear in PlayView during playthrough

### Views
- [ ] Graph view - Visual editor
- [ ] Yarn view - See generated Yarn script
- [ ] Play view - Test dialogue

### Export/Import
- [ ] Export to Yarn (.yarn file)
- [ ] Export to JSON (.json file)
- [ ] Import Yarn file
- [ ] Import JSON file

### Yarn Spinner Features
- [ ] Generated Yarn syntax is correct
- [ ] Speaker names export correctly
- [ ] Flags export as `<<set $flag = true>>`
- [ ] Choices export as `-> Choice text`
- [ ] Jumps export as `<<jump node_id>>`

## Known Issues to Test
- Edge drop menu appears correctly
- Node context menu doesn't interfere with graph panning
- Play view restarts correctly
- Memory flags persist through playthrough





