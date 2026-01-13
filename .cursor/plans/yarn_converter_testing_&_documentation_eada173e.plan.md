---
name: Yarn Converter Testing & Documentation
overview: Implement comprehensive testing for yarn converter, create extensibility documentation with diagrams, and research execution strategy for Yarn Spinner compatibility vs opinionated ForgeGraphDoc execution.
todos:
  - id: create-test-helpers
    content: Create test helpers file with utilities for creating mock nodes, graphs, and contexts
    status: completed
  - id: create-test-fixtures
    content: Create test fixtures directory with sample Yarn files and ForgeGraphDoc structures
    status: completed
  - id: test-utils
    content: Create tests for utility functions (condition-parser, condition-formatter, content-formatter, variable-handler)
    status: completed
    dependencies:
      - create-test-helpers
  - id: test-builders
    content: Create tests for YarnTextBuilder and NodeBlockBuilder
    status: completed
    dependencies:
      - create-test-helpers
  - id: test-character-handler
    content: Create comprehensive tests for CharacterHandler (export, import, round-trip)
    status: completed
    dependencies:
      - create-test-helpers
      - create-test-fixtures
  - id: test-player-handler
    content: Create comprehensive tests for PlayerHandler (export, import, round-trip)
    status: completed
    dependencies:
      - create-test-helpers
      - create-test-fixtures
  - id: test-conditional-handler
    content: Create comprehensive tests for ConditionalHandler (export, import, round-trip)
    status: completed
    dependencies:
      - create-test-helpers
      - create-test-fixtures
  - id: test-storylet-handler
    content: Create tests for StoryletHandler with mocked workspace context
    status: completed
    dependencies:
      - create-test-helpers
      - create-test-fixtures
  - id: test-detour-handler
    content: Create tests for DetourHandler with mocked workspace context
    status: completed
    dependencies:
      - create-test-helpers
      - create-test-fixtures
  - id: test-integration
    content: Create integration tests for full graph conversion and round-trip scenarios
    status: completed
    dependencies:
      - test-character-handler
      - test-player-handler
      - test-conditional-handler
  - id: expand-round-trip
    content: Expand round-trip.test.ts with per-node-type tests and complex scenarios
    status: completed
    dependencies:
      - test-character-handler
      - test-player-handler
      - test-conditional-handler
  - id: create-architecture-docs
    content: Create architecture.md with handler pattern explanation and diagrams
    status: completed
  - id: create-extension-guide
    content: Create extending.md with step-by-step guide to add new node types
    status: completed
  - id: enhance-scripting-fundamentals
    content: Enhance scripting-fundamentals.md with complete Yarn Spinner syntax reference
    status: completed
  - id: create-visual-diagrams
    content: Create Mermaid diagrams for handler architecture, export/import flows, and extension points
    status: completed
  - id: research-yarn-vm
    content: Research Yarn Spinner VM architecture and integration requirements
    status: pending
  - id: analyze-forge-execution
    content: Analyze ForgeGraphDoc direct execution approach and customization opportunities
    status: pending
  - id: compare-execution-approaches
    content: Document comparison of Yarn VM vs ForgeGraphDoc execution approaches
    status: pending
    dependencies:
      - research-yarn-vm
      - analyze-forge-execution
  - id: create-gameplayer-engine-structure
    content: Create engine folder structure in GamePlayer with docs and engine directories
    status: completed
  - id: research-yarn-vm
    content: Research Yarn Spinner VM architecture and integration requirements
    status: pending
    dependencies:
      - create-gameplayer-engine-structure
  - id: analyze-forge-execution
    content: Analyze ForgeGraphDoc direct execution approach and customization opportunities
    status: pending
    dependencies:
      - create-gameplayer-engine-structure
  - id: compare-execution-approaches
    content: Document comparison of Yarn VM vs ForgeGraphDoc execution approaches
    status: pending
    dependencies:
      - research-yarn-vm
      - analyze-forge-execution
  - id: create-execution-recommendation
    content: Create execution-recommendation.md with analysis and recommendation in GamePlayer/engine/docs
    status: completed
    dependencies:
      - compare-execution-approaches
---

# Yarn Converter Testing & Documentation + GamePlayer Execution Strategy

## Overview

Implement comprehensive testing for the yarn converter system, create extensibility documentation with visual diagrams, and research execution strategy for GamePlayer engine (separate from yarn converter).

## Phase 1: Testing Implementation

### Task 1.1: Create Test Helpers and Fixtures

**Files to Create:**

- `src/lib/yarn-converter/__tests__/helpers.ts` - Test utilities
- `src/lib/yarn-converter/__tests__/fixtures/` - Sample Yarn files and ForgeGraphDoc structures

**Test Helpers Needed:**

- `createMockForgeFlowNode(type, data)` - Create test ForgeFlowNode
- `createMockForgeGraphDoc(title, nodes, edges)` - Create test ForgeGraphDoc
- `createMockYarnConverterContext(adapter?, cache?)` - Create mock context
- `parseYarnNode(yarnText)` - Parse single node block from Yarn
- `normalizeYarn(yarnText)` - Normalize whitespace for comparison
- `createMockAdapter()` - Mock ForgeDataAdapter for storylet/detour tests

**Fixtures Needed:**

- `simple-character.yarn` - Basic character node
- `player-with-choices.yarn` - Player node with multiple choices
- `conditional-blocks.yarn` - Conditional node with if/elseif/else
- `with-variables.yarn` - Nodes with variable operations
- `storylet-reference.yarn` - Storylet node referencing another graph

### Task 1.2: Test Utility Functions

**File:** `src/lib/yarn-converter/__tests__/utils.test.ts`

**Tests for `condition-parser.ts`:**

- Parse each operator (IS_SET, EQUALS, NOT_EQUALS, GREATER_THAN, etc.)
- Parse conditions with AND logic
- Parse quoted strings, numbers, booleans
- Parse edge cases (empty, malformed, nested)

**Tests for `condition-formatter.ts`:**

- Format each operator type
- Format multiple conditions with AND
- Handle undefined values
- Verify output matches Yarn syntax exactly

**Tests for `content-formatter.ts`:**

- Format content with/without speaker
- Extract set commands from content
- Remove set commands from content
- Handle multiline content

**Tests for `variable-handler.ts`:**

- Format set commands for boolean, number, string
- Parse set commands with all operators (+, -, *, /, =)
- Handle type coercion correctly

### Task 1.3: Test Builders

**File:** `src/lib/yarn-converter/__tests__/builders.test.ts`

**Tests for `YarnTextBuilder`:**

- Each method produces correct Yarn syntax
- Indentation is correct
- Node structure (title, separator, end) is correct
- Commands are formatted correctly

**Tests for `NodeBlockBuilder`:**

- Complete node blocks are built correctly
- Conditional blocks are formatted properly
- Choices are formatted with correct indentation
- Flags and jumps are added correctly

### Task 1.4: Test Core Node Handlers

**Files:**

- `src/lib/yarn-converter/__tests__/character-handler.test.ts`
- `src/lib/yarn-converter/__tests__/player-handler.test.ts`
- `src/lib/yarn-converter/__tests__/conditional-handler.test.ts`

**For Each Handler:**

- Export tests: Verify ForgeFlowNode → Yarn conversion
- Import tests: Verify Yarn → ForgeFlowNode conversion
- Round-trip tests: Export → Import → Export (verify data preservation)
- Edge cases: Empty content, missing fields, malformed Yarn

**Character Handler Specific:**

- Simple dialogue
- Dialogue with speaker
- Dialogue with nextNodeId
- Dialogue with setFlags
- Dialogue with conditional blocks
- Multiline content
- Variable interpolation `{$var}`

**Player Handler Specific:**

- Simple choices
- Choices with conditions
- Choices with setFlags
- Choices with nextNodeId
- Conditional choices (wrapped in <<if>>)
- Choice text with set commands

**Conditional Handler Specific:**

- If blocks
- If/else blocks
- If/elseif/else blocks
- Block nextNodeId
- Block speakers
- Block setFlags
- Complex nested conditionals

### Task 1.5: Test Advanced Node Handlers

**Files:**

- `src/lib/yarn-converter/__tests__/storylet-handler.test.ts`
- `src/lib/yarn-converter/__tests__/detour-handler.test.ts`

**Storylet Handler:**

- Export without storyletCall (fallback)
- Export with storyletCall (graph fetching)
- Circular reference detection
- Graph inlining
- Mock workspace context with cache
- Test cache-first resolution

**Detour Handler:**

- Export with DETOUR_RETURN mode
- Return node handling
- Graph inlining with return
- Circular reference detection

### Task 1.6: Test Integration and Round-Trip

**File:** `src/lib/yarn-converter/__tests__/integration.test.ts`

**Full Graph Tests:**

- Convert complete ForgeGraphDoc with all node types
- Verify node order preserved
- Verify edges (via nextNodeId) preserved
- Test with startNodeId and endNodeIds

**Round-Trip Tests:**

- Per node type round-trips
- Complex scenarios (nested conditionals, conditional choices)
- Variable operations preservation
- Graph with storylet/detour chains

**Yarn Spinner Feature Tests:**

- Variable interpolation
- Set command variations (+, -, *, /, =)
- Jump commands
- Conditional blocks
- Flow control (node structure)

## Phase 2: Extensibility Documentation

### Task 2.1: Create Architecture Documentation

**File:** `src/lib/yarn-converter/docs/architecture.md`

**Content:**

- Overview of handler pattern
- Registry system explanation
- Context object for graph resolution
- How to add new node types
- How to extend existing handlers
- Builder pattern for Yarn text generation

**Include Diagrams:**

- Handler registry flow
- Export/import process flow
- Context resolution flow
- Extension points

### Task 2.2: Create Extension Guide

**File:** `src/lib/yarn-converter/docs/extending.md`

**Content:**

- Step-by-step guide to add new node type
- Example: Adding a new "Cutscene" node type
- How to register handlers
- How to test new handlers
- Best practices for handler implementation

**Include:**

- Code examples
- Template handler class
- Testing checklist

### Task 2.3: Update Scripting Fundamentals

**File:** `src/lib/yarn-converter/docs/scripting-fundamentals.md`

**Enhance with:**

- Complete Yarn Spinner syntax reference
- All supported commands
- Variable operations
- Flow control structures
- Examples for each feature
- Links to official Yarn Spinner docs

### Task 2.4: Create Visual Diagrams

**Files:**

- `src/lib/yarn-converter/docs/diagrams/` directory
- Mermaid diagrams for:
- Handler architecture
- Export flow
- Import flow
- Context resolution
- Extension points

## Phase 3: GamePlayer Execution Strategy Research

### Task 3.1: Create Engine Folder Structure

**Files to Create:**

- `src/components/GamePlayer/engine/` - Engine implementation directory
- `src/components/GamePlayer/engine/docs/` - Execution strategy documentation
- `src/components/GamePlayer/engine/README.md` - Engine overview

**Structure:**

```
src/components/GamePlayer/
├── components/          # UI components (existing)
│   ├── GamePlayer.tsx
│   └── VNStage.tsx
└── engine/              # Execution engine (new)
    ├── README.md        # Engine overview
    ├── docs/            # Strategy documentation
    │   ├── execution-strategy.md
    │   ├── yarn-vm-research.md
    │   ├── forge-execution-analysis.md
    │   └── execution-recommendation.md
    └── [future implementation files]
```

### Task 3.2: Research Yarn Spinner VM

**Document:** `src/components/GamePlayer/engine/docs/yarn-vm-research.md`

**Research Topics:**

- Yarn Spinner Virtual Machine architecture
- How Yarn Spinner executes .yarn files
- Variable storage and management
- Command execution
- Function calls
- Integration points
- JavaScript/TypeScript bindings availability

**Questions to Answer:**

- Can we use Yarn Spinner's VM directly in TypeScript/JavaScript?
- What are the integration requirements?
- What dependencies are needed?
- How does variable storage work?
- How are commands executed?
- What's the API surface?
- Performance characteristics?

### Task 3.3: Analyze ForgeGraphDoc Execution

**Document:** `src/components/GamePlayer/engine/docs/forge-execution-analysis.md`

**Research Topics:**

- Current GamePlayer implementation (minimal, just UI)
- How ForgeGraphDoc could be executed directly
- Advantages of direct execution
- Customization opportunities
- Potential divergence from Yarn Spinner
- Node traversal patterns
- Condition evaluation
- Variable management

**Questions to Answer:**

- Can we execute ForgeGraphDoc without converting to Yarn?
- What would execution look like?
- How would variables be managed?
- How would commands be handled?
- What customization would be possible?
- How to handle storylet/detour nodes?
- How to handle conditional blocks?
- How to handle player choices?

### Task 3.4: Compare Execution Approaches

**Document:** `src/components/GamePlayer/engine/docs/execution-strategy.md`

**Compare Three Approaches:**

**Option A: Use Yarn Spinner VM**
- Convert ForgeGraphDoc → Yarn → Execute via Yarn VM
- Pros: Full parity, official support, battle-tested, handles edge cases
- Cons: External dependency, must convert to Yarn, less customization, potential conversion overhead

**Option B: Execute ForgeGraphDoc Directly**
- Execute ForgeGraphDoc nodes directly without conversion
- Pros: Full control, customization, no conversion overhead, native to our data model
- Cons: Must maintain parity with Yarn, potential bugs, divergence risk, more code to maintain

**Option C: Hybrid Approach**
- Convert to Yarn for export/sharing, execute ForgeGraphDoc directly in runtime
- Pros: Best of both worlds, export compatibility, runtime efficiency
- Cons: Two execution paths to maintain, potential inconsistencies

**Considerations:**

- Export compatibility: Do we need to execute Yarn files from other tools?
- Runtime performance: Which is faster?
- Maintenance burden: Which is easier to maintain?
- Customization needs: Do we need features beyond Yarn Spinner?
- Team expertise: What's easier for the team to work with?

### Task 3.5: Create Execution Recommendation

**File:** `src/components/GamePlayer/engine/docs/execution-recommendation.md`

**Include:**

- Executive summary
- Analysis of each approach
- Recommendation with detailed rationale
- Implementation considerations
- Migration path (if needed)
- Risk assessment
- Timeline estimates
- Next steps

**Decision Framework:**

- If we need full Yarn compatibility → Option A or C
- If we need maximum customization → Option B
- If we need both → Option C
- If we want simplicity → Option B (one codebase)

## Implementation Order

1. **Phase 1: Testing** - Foundation for confidence in yarn converter
2. **Phase 2: Documentation** - Enables extensibility of yarn converter
3. **Phase 3: Execution Strategy** - Research and decide on GamePlayer engine approach

**Note:** Phases 1 and 2 are independent and can proceed in parallel. Phase 3 should inform future engine implementation but doesn't block converter work.

## Success Criteria

- All node handlers have comprehensive tests
- All utility functions have tests
- Round-trip tests verify data preservation
- Documentation clearly explains extensibility
- Visual diagrams make architecture clear
- Execution strategy research is complete
- Recommendation is well-documented

## Notes

- Testing should follow existing Vitest patterns
- Documentation should be clear and example-driven
- Diagrams should use Mermaid for version control
- Execution strategy research should be thorough before making recommendations
- Consider both short-term and long-term implications
- GamePlayer engine docs are separate from yarn converter docs
- Execution strategy decision will inform future engine implementation
- Keep UI (components/) separate from engine logic