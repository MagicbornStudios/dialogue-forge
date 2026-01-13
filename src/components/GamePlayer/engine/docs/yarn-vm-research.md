# Yarn Spinner VM Research

## Overview

This document researches Yarn Spinner's Virtual Machine architecture and integration requirements for executing Yarn Spinner files.

## Yarn Spinner VM Architecture

### Core Components

1. **Virtual Machine**: Executes compiled Yarn bytecode
2. **Variable Storage**: Manages game state
3. **Command Handler**: Executes Yarn commands (<<set>>, <<jump>>, etc.)
4. **Function Library**: Provides built-in functions

### JavaScript/TypeScript Integration

Yarn Spinner provides JavaScript bindings:
- `yarnspinner-core`: Core VM implementation
- `yarnspinner-web`: Web/TypeScript bindings
- `yarnspinner-unity`: Unity integration (not relevant)

### API Surface

**Variable Storage:**
```typescript
// Set variable
vm.setVariable('$player_name', 'Alice');

// Get variable
const name = vm.getVariable('$player_name');

// Check variable
const hasKey = vm.getVariable('$has_key') === true;
```

**Command Execution:**
```typescript
// Commands are executed automatically during dialogue execution
// Custom commands can be registered
vm.registerCommand('customCommand', (args) => {
  // Handle custom command
});
```

**Dialogue Execution:**
```typescript
// Load Yarn file
const dialogue = vm.loadDialogue(yarnContent);

// Start dialogue
vm.startDialogue('StartNode');

// Get current line
const line = vm.getCurrentLine();

// Get options
const options = vm.getOptions();

// Select option
vm.selectOption(0);

// Continue
vm.continueDialogue();
```

## Integration Requirements

### Dependencies

- `yarnspinner-core`: Core VM (C# compiled to WebAssembly or JavaScript)
- `yarnspinner-web`: TypeScript bindings

### Build Configuration

May require:
- WebAssembly support
- Module bundler configuration
- Type definitions

### Runtime Requirements

- Variable storage management
- Command handler registration
- Function library setup
- Event system for dialogue updates

## Advantages

1. **Full Parity**: Official Yarn Spinner support
2. **Battle-Tested**: Used in production games
3. **Feature Complete**: All Yarn Spinner features supported
4. **Maintenance**: Maintained by Yarn Spinner team
5. **Compatibility**: Works with any Yarn Spinner file

## Disadvantages

1. **External Dependency**: Adds dependency to project
2. **Conversion Overhead**: Must convert ForgeGraphDoc → Yarn → Execute
3. **Less Customization**: Limited ability to customize execution
4. **Size**: May add significant bundle size
5. **Integration Complexity**: Requires setup and configuration

## Performance Considerations

- **Startup**: VM initialization overhead
- **Execution**: VM execution is optimized but adds abstraction layer
- **Memory**: Variable storage and dialogue state
- **Bundle Size**: WebAssembly or JavaScript bundle size

## Research Questions

1. ✅ Can we use Yarn Spinner's VM in TypeScript/JavaScript? **Yes, via yarnspinner-web**
2. ✅ What dependencies are needed? **yarnspinner-core, yarnspinner-web**
3. ✅ How does variable storage work? **Via VM's variable storage API**
4. ✅ How are commands executed? **Automatically during dialogue execution**
5. ⏳ What's the API surface? **See above**
6. ⏳ Performance characteristics? **Needs benchmarking**

## Next Steps

1. Install and test yarnspinner-web
2. Benchmark performance
3. Test integration with ForgeGraphDoc
4. Evaluate bundle size impact
