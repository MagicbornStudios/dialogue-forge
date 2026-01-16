---
name: CopilotKit Actions Organization and Architecture
overview: ""
todos: []
---

# CopilotKit Actions Organization and Architecture

## Current State Analysis

**Issues:**

- String literals used for action names (`'proposeTextEdit'`, `'getCurrentPage'`, `'listPages'`)
- Actions not organized by domain or scope
- No constants file for action names
- Actions mixed in single hook file
- No separation between workspace-level and editor-level actions
- Missing Forge domain actions entirely

**Existing Patterns to Follow:**

- `FORGE_COMMAND` constants pattern in `src/forge/lib/graph-editor/hooks/forge-commands.ts`
- Command pattern with dispatch in `useForgeEditorActions.tsx`
- Domain separation: `src/forge/` ↔ `src/writer/` (no cross-imports)
- AI infrastructure in `src/ai/` (domains can use, AI can't import domains)
- Workspace store vs Editor session store separation
- Editor shell pattern for bridging editor libraries

## Architecture Layers

```
Host (app/)
    ↓ imports
AI Infrastructure (src/ai/copilotkit/)
    ↓ provides contracts/interfaces
Domain Actions (src/{domain}/copilotkit/)
    ├── Workspace Actions (workspace store operations)
    └── Editor Actions (editor shell/command operations)
```

## Proposed File Structure

### 1. AI Infrastructure Layer (src/ai/copilotkit/)

**Purpose**: Shared CopilotKit infrastructure, contracts, and base patterns.

```
src/ai/copilotkit/
├── constants/
│   └── action-names.ts              # Base action name constants (if any shared)
├── types/
│   └── action-types.ts               # Shared action type utilities
├── hooks/
│   ├── useCopilotKitContext.ts       # Context provider hook (existing)
│   └── useCopilotKitActions.ts       # Base actions hook (refactor)
├── providers/
│   ├── CopilotKitWorkspaceProvider.tsx
│   ├── CopilotKitContextProvider.tsx
│   └── CopilotKitActionsProvider.tsx
└── index.ts
```

### 2. Writer Domain Actions (src/writer/copilotkit/)

**Purpose**: Writer-specific CopilotKit actions, organized by scope.

```
src/writer/copilotkit/
├── constants/
│   └── writer-action-names.ts        # Writer action name constants
├── actions/
│   ├── workspace/
│   │   ├── writer-workspace-actions.ts    # Workspace-level actions
│   │   └── types.ts                        # Action parameter types
│   └── editor/
│       ├── writer-editor-actions.ts        # Editor-level actions (Lexical)
│       └── types.ts                        # Editor action types
├── hooks/
│   ├── useWriterWorkspaceActions.ts        # Register workspace actions
│   └── useWriterEditorActions.ts           # Register editor actions
└── index.ts
```

**Why this location:**

- Follows domain separation: Writer actions in `src/writer/`
- Matches pattern: `src/writer/components/WriterWorkspace/` for workspace code
- AI infrastructure (`src/ai/copilotkit/`) provides base, Writer extends it
- Clear separation: workspace actions vs editor actions

### 3. Forge Domain Actions (src/forge/copilotkit/)

**Purpose**: Forge-specific CopilotKit actions for graph editing.

```
src/forge/copilotkit/
├── constants/
│   └── forge-action-names.ts         # Forge action name constants
├── actions/
│   ├── workspace/
│   │   ├── forge-workspace-actions.ts     # Workspace-level actions
│   │   └── types.ts                        # Workspace action types
│   └── editor/
│       ├── forge-graph-editor-actions.ts  # Graph editor actions
│       └── types.ts                        # Editor action types
├── hooks/
│   ├── useForgeWorkspaceActions.ts        # Register workspace actions
│   └── useForgeGraphEditorActions.ts      # Register editor actions
└── index.ts
```

**Why this location:**

- Follows domain separation: Forge actions in `src/forge/`
- Matches pattern: `src/forge/lib/graph-editor/hooks/` for editor hooks
- Parallel structure to Writer for consistency
- Editor actions can use existing `ForgeEditorActions` from command pattern

## Action Organization Principles

### 1. Constants Pattern (Following FORGE_COMMAND)

```typescript
// src/writer/copilotkit/constants/writer-action-names.ts
export const WRITER_ACTION_NAME = {
  WORKSPACE: {
    PROPOSE_TEXT_EDIT: 'writer.workspace.proposeTextEdit',
    GET_CURRENT_PAGE: 'writer.workspace.getCurrentPage',
    LIST_PAGES: 'writer.workspace.listPages',
    SWITCH_PAGE: 'writer.workspace.switchPage',
  },
  EDITOR: {
    INSERT_TEXT: 'writer.editor.insertText',
    REPLACE_SELECTION: 'writer.editor.replaceSelection',
    FORMAT_TEXT: 'writer.editor.formatText',
  },
} as const;

export type WriterActionName = 
  | typeof WRITER_ACTION_NAME.WORKSPACE[keyof typeof WRITER_ACTION_NAME.WORKSPACE]
  | typeof WRITER_ACTION_NAME.EDITOR[keyof typeof WRITER_ACTION_NAME.EDITOR];
```

### 2. Explicit Typing with FrontendAction

```typescript
// src/writer/copilotkit/actions/workspace/types.ts
import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';

export interface ProposeTextEditParams extends Parameter[] {
  0: { name: 'instruction'; type: 'string'; description: string; required: true };
}

export type ProposeTextEditAction = FrontendAction<ProposeTextEditParams>;
```

### 3. Workspace Actions vs Editor Actions

**Workspace Actions:**

- Operate on workspace store (domain state)
- Examples: `proposeTextEdit`, `getCurrentPage`, `listPages`, `switchPage`
- Location: `src/{domain}/copilotkit/actions/workspace/`
- Access: Workspace store via `StoreApi<{Domain}WorkspaceState>`

**Editor Actions:**

- Operate on editor shell/commands (editor instance)
- Examples: `createNode`, `connectNodes`, `updateNodeData`, `focusNode`
- Location: `src/{domain}/copilotkit/actions/editor/`
- Access: Editor actions via `useForgeEditorActions()` or editor shell

### 4. Action Definition Pattern

```typescript
// src/writer/copilotkit/actions/workspace/writer-workspace-actions.ts
import type { StoreApi } from 'zustand/vanilla';
import type { WriterWorkspaceState } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import type { Parameter } from '@copilotkit/shared';
import type { FrontendAction } from '@copilotkit/react-core';
import { WRITER_ACTION_NAME } from '../constants/writer-action-names';

export function createProposeTextEditAction(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]> {
  return {
    name: WRITER_ACTION_NAME.WORKSPACE.PROPOSE_TEXT_EDIT,
    description: 'Propose edits to selected text in the writer.',
    parameters: [
      {
        name: 'instruction',
        type: 'string',
        description: 'What changes to make to the text',
        required: true,
      },
    ] as Parameter[],
    handler: async (args: { [x: string]: unknown }) => {
      const instruction = args.instruction as string;
      if (!instruction) throw new Error('Instruction is required');
      
      const state = workspaceStore.getState();
      if (!state.aiSelection) {
        throw new Error('No text selected. Please select text first.');
      }
      
      await state.actions.proposeAiEdits(instruction);
      return { success: true, message: 'Edit proposal generated.' };
    },
  };
}

// Export all workspace actions
export function createWriterWorkspaceActions(
  workspaceStore: StoreApi<WriterWorkspaceState>
): FrontendAction<Parameter[]>[] {
  return [
    createProposeTextEditAction(workspaceStore),
    createGetCurrentPageAction(workspaceStore),
    createListPagesAction(workspaceStore),
    // ... more actions
  ];
}
```

### 5. Editor Actions Pattern (Forge Example)

```typescript

// src/forge/copilotkit/actions/editor/forge-graph-editor-actions.ts

import type { Parameter } from '@copilotkit/shared';

import type { FrontendAction } from '@copilotkit/react-core';

import type { ForgeEditorActions } from '@/forge/lib/graph-editor/hooks/useForgeEditorActions';

import type { ForgeNodeType, ForgeNode } from '@/forge/types/forge-graph';

import { FORGE_ACTION_NAME } from '../constants/forge-action-names';

import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

export function createCreateNodeAction(

editorActions: ForgeEditorActions,

reactFlow: any // ReactFlow instance for position calculation

): FrontendAction<Parameter[]> {

return {

name: FORGE_ACTION_NAME.EDITOR.CREATE_NODE,

description: 'Create a new node in the graph editor.',

parameters: [

{ name: 'nodeType', type: 'string', description: 'Type of node to create', required: true },

{ name: 'x', type: 'number', description: 'X position', required: false },

{ name: 'y', type: 'number', description: 'Y position', required: false },

{ name: 'autoFocus', type: 'boolean', description: 'Focus on node after creation', required: false },

] as Parameter[],

handler: async (args: { [x: string]: unknown }) => {

const nodeType = arg