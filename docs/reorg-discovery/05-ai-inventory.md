# 05 - AI Inventory and Layering Analysis

## AI Architecture Overview

The codebase has a **well-structured AI layering** with clear separation between:
- **AI Core Infrastructure** (host-side) - OpenRouter integration, streaming, model routing
- **Writer AI Layer** (src-side) - Patch-based editing system
- **Forge AI Layer** (currently minimal) - Future expansion point

## AI Components Analysis

### 1. AI Core Infrastructure (Host Layer)

**Location**: `app/lib/ai/ai-adapter.ts`

#### Core Types and Interfaces
```typescript
// Core AI contract types
export type AiResponse<T> = AiSuccessResponse<T> | AiFailureResponse;
export type AiEditProposal = { patch: string; summary?: string; };
export type AiPlan = { id: string; title: string; steps: AiPlanStep[]; };
export type AiStreamResponse = { stream: ReadableStream<Uint8Array>; };

// AI Adapter interface - central contract
export interface AiAdapter {
  streamChat: (payload: unknown) => Promise<AiStreamResponse>;
  proposeEdits: (payload: unknown) => Promise<AiResponse<AiEditProposal>>;
  createPlan: (payload: unknown) => Promise<AiResponse<AiPlan>>;
  proposePlanStep: (payload: AiPlanStepRequest) => Promise<AiResponse<AiPlanStepProposal>>;
  applyPlanStep?: (payload: AiPlanStepRequest) => Promise<AiResponse<AiPlanStepApplyResult>>;
}
```

#### Infrastructure Features
- **Model Routing**: Fast vs Reasoning models
- **Streaming Support**: Server-sent events for real-time responses
- **Error Handling**: Comprehensive error types and response formatting
- **OpenRouter Integration**: API key management, headers, endpoint configuration

#### Model Configuration
```typescript
const OPENROUTER_MODEL_FAST = 'openai/gpt-4o-mini';      // Fast responses
const OPENROUTER_MODEL_REASONING = 'openai/o1-mini';       // Complex reasoning
```

#### Ownership Classification
**Recommendation**: **Cross-Package Shared** - Core AI infrastructure for both domains

### 2. AI API Routes (Host Layer)

**Location**: `app/api/ai/`

#### Route Structure
```
app/api/ai/
├── chat/route.ts                    # General chat streaming
└── writer/
    ├── edits/
    │   └── propose/route.ts        # Writer edit proposals
    └── plans/
        ├── route.ts                 # Plan creation
        └── [planId]/steps/[stepId]/
            ├── propose/route.ts     # Step proposals
            └── apply/route.ts       # Step application
```

#### Route Patterns
- **Consistent**: All routes follow same adapter pattern
- **Type-Safe**: Use AiResponse<T> contracts
- **Error Handling**: Standardized error responses

#### Ownership Classification
**Recommendation**: **Host-Only** - API endpoints are host responsibility

### 3. Writer AI Layer (Writer Domain)

**Location**: `src/components/WriterWorkspace/` + `src/store/writer/`

#### Writer AI State Model
```typescript
interface WriterWorkspaceState {
  // AI state
  aiPreview: WriterPatchOp[] | null;
  aiProposalStatus: 'idle' | 'proposing' | 'ready' | 'applying';
  aiError: string | null;
  aiSelection: WriterSelectionRange | null;
  aiSnapshot: WriterDocSnapshot | null;
  aiUndoSnapshot: WriterDocSnapshot | null;
  
  // AI actions
  setAiSelection: (selection: WriterSelectionRange | null) => void;
  proposeAiEdits: () => Promise<void>;
  applyAiEdits: () => void;
  revertAiDraft: () => void;
}
```

#### Patch-Based Editing System
**Location**: `src/store/writer/writer-patches.ts`

```typescript
type WriterPatchOp =
  | { type: 'replace_content'; content: string | null }
  | { type: 'splice_content'; start: number; end: number; text: string }
  | { type: 'replace_blocks'; blocks: unknown[] | null };
```

#### AI Integration Points
- **ToolbarPlugin**: AI action triggers
- **AutosavePlugin**: Draft persistence with AI changes
- **WriterEditorPane**: Preview and apply AI suggestions

#### Ownership Classification
**Recommendation**: **Writer Domain** - Writer-specific AI patterns

### 4. Forge AI Layer (Minimal Currently)

#### Current State
- **No Direct AI Integration**: Forge doesn't use AI yet
- **Prepared Infrastructure**: AI core is available when needed
- **GraphEditor Patterns**: Session state ready for AI features

#### Future AI Opportunities
- **Node Content Generation**: AI-assisted dialogue writing
- **Graph Layout**: AI-powered graph organization
- **Character Dialogue**: AI character voice consistency
- **Quest Design**: AI-assisted branching narrative

#### Ownership Classification
**Recommendation**: **Forge Domain** - When AI features are added

## AI Layering Architecture

### Recommended Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Cross-Package Shared                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AI Core Infrastructure                   │    │
│  │  • Model routing (fast/reasoning)                   │    │
│  │  • Streaming support                                 │    │
│  │  • OpenRouter integration                            │    │
│  │  • Error handling & types                            │    │
│  │  • Common utilities                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
        │                        │
        ▼                        ▼
┌───────────────────┐    ┌─────────────────────────┐
│   Forge AI Layer  │    │   Writer AI Layer       │
│                   │    │                         │
│ • Graph editing   │    │ • Patch-based editing    │
│ • Content gen     │    │ • Selection management   │
│ • Layout AI       │    │ • Preview system        │
│ • Character AI    │    │ • Undo/redo             │
│                   │    │                         │
│ (Future features) │    │ (Currently implemented) │
└───────────────────┘    └─────────────────────────┘
```

## AI Contract Analysis

### Stable Shared Contracts ✅

#### Core Types (Cross-Package)
```typescript
// These should be stable and shared across domains
export type AiResponse<T>
export type AiStreamResponse  
export type AiError
export interface AiAdapter
```

#### Model Infrastructure (Cross-Package)
```typescript
// Model routing and streaming infrastructure
export type AiModel = 'fast' | 'reasoning'
export type StreamingResponse
export type ChatMessage
```

### Domain-Specific Contracts

#### Writer-Specific Types
```typescript
// Writer domain owns these
export type WriterPatchOp
export type WriterSelectionRange
export type WriterDocSnapshot
export interface WriterWorkspaceState['ai*']
```

#### Forge-Specific Types (Future)
```typescript
// Forge domain will own these when implemented
export type ForgeGraphEdit
export type ForgeContentGeneration
export type ForgeLayoutSuggestion
```

## Current AI Usage Patterns

### Writer AI Workflow
1. **User Selection** → `setAiSelection(range)`
2. **AI Proposal** → `proposeAiEdits()` → API call → `aiPreview`
3. **Preview** → Show patch application in UI
4. **Apply/Reject** → `applyAiEdits()` or `revertAiDraft()`

### Strengths ✅
- **Clean Patch System**: Immutable updates with clear operations
- **Good UX Flow**: Preview before apply
- **Error Handling**: Comprehensive error states
- **Streaming Ready**: Infrastructure supports real-time updates

### Areas for Improvement ⚠️
- **Limited to Writer**: Forge has no AI integration yet
- **Model Selection**: Hard-coded models, no user control
- **Context Management**: Limited context window awareness
- **Cost Tracking**: No usage metrics or limits

## Recommendations

### Immediate Actions

1. **Extract AI Core to Shared Library**:
   ```typescript
   // src/lib/ai-core/
   - ai-adapter.ts        // Move from app/lib/ai/
   - model-router.ts      // Model selection logic
   - streaming.ts         // Streaming utilities
   - error-handling.ts    // Error utilities
   ```

2. **Create AI Contract Types**:
   ```typescript
   // src/types/ai/
   - core-contracts.ts    // Shared AI interfaces
   - writer-contracts.ts  // Writer-specific
   - forge-contracts.ts   // Forge-specific (future)
   ```

### Medium Term

3. **Forge AI Integration**:
   - Graph content generation
   - Node auto-completion
   - Character dialogue assistance
   - Layout optimization suggestions

4. **Enhanced Writer AI**:
   - Multiple model options
   - Context-aware editing
   - Style preservation
   - Multi-step editing workflows

### Long Term

5. **Cross-Domain AI Features**:
   - Shared context between workspaces
   - AI-assisted project planning
   - Intelligent asset generation
   - Quality assurance automation

## Migration Strategy

### Phase 1: Extract Core Infrastructure
1. Move `app/lib/ai/ai-adapter.ts` → `src/lib/ai-core/`
2. Create shared contract types
3. Update API routes to use shared core
4. Add ESLint rules for AI boundaries

### Phase 2: Writer AI Enhancements
1. Enhance patch system with more operations
2. Add model selection UI
3. Implement multi-step editing
4. Add cost and usage tracking

### Phase 3: Forge AI Development
1. Design Forge AI contracts
2. Implement graph editing assistance
3. Add content generation features
4. Create AI-powered layout optimization

## Enforcement Rules

### Recommended ESLint Rules
```javascript
// AI core should not import domain-specific types
{
  'no-restricted-imports': ['error', {
    patterns: ['@/src/components/WriterWorkspace/*', '@/src/components/ForgeWorkspace/*']
  }],
  // Apply to src/lib/ai-core/
}

// Domains should only import core AI
{
  'no-restricted-imports': ['error', {
    patterns: ['@/app/lib/ai/*']
  }],
  // Apply to src/components/WriterWorkspace/, src/components/ForgeWorkspace/
}
```

## Next Steps

### Before Reorganization
1. **Audit AI usage patterns** - Verify all AI code is identified
2. **Design Forge AI contracts** - Plan future Forge AI features
3. **Plan core extraction** - Detail shared vs domain separation

### During Reorganization
1. **Extract AI core first** - Move infrastructure to shared layer
2. **Create clear contracts** - Define stable AI interfaces
3. **Update imports systematically** - Maintain functionality

### After Reorganization
1. **Implement Forge AI** - Add AI features to Forge workspace
2. **Enhance Writer AI** - Improve existing AI capabilities
3. **Add cross-domain features** - Shared AI assistance between workspaces

## Risk Assessment

### Low Risk ✅
- AI core is well-isolated and host-side
- Clear contract boundaries already exist
- Writer AI is self-contained and functional

### Medium Risk ⚠️
- Moving AI core from host to shared requires coordination
- API routes need updates to use new location
- Forge AI not yet designed (future scope)

### High Risk 🚨
- None identified - current AI architecture is solid