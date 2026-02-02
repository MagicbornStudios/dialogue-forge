---
name: Verify and Fix Template Override System
overview: Review and verify the current template-level override system works correctly with Remotion compositions and Forge graph runtime directives. Ensure overrides are applied correctly during compilation and rendering.
todos:
  - id: review-input-resolution
    content: Review and verify input resolution order in compile-composition.ts and compile-template-overrides.ts
    status: pending
  - id: verify-remotion-props
    content: Verify that resolvedInputs are correctly passed to Remotion layer components and used properly
    status: pending
  - id: verify-directive-mapping
    content: Verify that ForgeRuntimeDirective payload structure aligns with TEMPLATE_INPUT_KEY expectations
    status: pending
  - id: fix-any-issues
    content: Fix any issues found during verification (input order, prop passing, directive mapping)
    status: pending
    dependencies:
      - review-input-resolution
      - verify-remotion-props
      - verify-directive-mapping
---

# Verify and Fix Template Override System

## Overview

Keep the current template-level override system (not per-layer). Verify that:

1. Template overrides correctly map to Remotion composition inputs
2. Frame inputs properly override template inputs during compilation
3. The override system aligns with Forge graph runtime directive expectations
4. Remotion layers receive the correct resolved inputs

## Current System Review

### Current Override Flow

1. **Template Overrides**: `VideoTemplateOverrides` with `inputs` (template-level) and `frameInputs` (per-frame)
2. **Input Keys**: Uses `TEMPLATE_INPUT_KEY` (node.background, node.dialogue, node.image, node.speaker)
3. **Compilation**: `compileTemplateWithOverrides` merges frame inputs with overrides
4. **Resolution**: `mergeResolvedInputs` merges template/scene/layer inputs with frame inputs
5. **Remotion**: `VideoCompositionRenderer` passes `resolvedInputs` to layer components

### Verification Tasks

1. **Verify Input Resolution Order**

- Check that override priority is correct: frameInputs > template overrides > base frame inputs
- Verify template/scene/layer inputs merge correctly
- Ensure `TEMPLATE_INPUT_KEY` values are correctly resolved

2. **Verify Remotion Integration**

- Check that `resolvedInputs` are passed correctly to Remotion layer components
- Verify layer components use `resolvedInputs` properly
- Ensure visual/style properties are preserved during compilation

3. **Verify Forge Graph Integration**

- Check that `ForgeRuntimeDirective` can provide values for template inputs
- Verify directive payload maps to `TEMPLATE_INPUT_KEY` values
- Ensure frame inputs from graph execution align with template input keys

4. **Fix Any Issues Found**

- Correct input resolution order if wrong
- Fix Remotion prop passing if incorrect
- Align directive payload structure with template input keys

## Files to Review

- `src/video/templates/compile/compile-template-overrides.ts` - Override application logic
- `src/video/templates/compile/compile-composition.ts` - Input resolution and merging
- `src/video/templates/compile/frames-to-template-inputs.ts` - Frame to input conversion
- `src/video/player/VideoCompositionRenderer.tsx` - Remotion rendering
- `src/video/player/components/layers/*.tsx` - Layer components that receive inputs
- `src/forge/runtime/engine/execute-graph-to-frames.ts` - Graph execution that produces frames
- `src/forge/components/ForgeWorkspace/components/GamePlayer/GamePlayer.tsx` - Integration point

## Expected Behavior

1. **Template Overrides**: Applied to all frames unless frame-specific override exists
2. **Frame Inputs**: Override template inputs for specific frames
3. **Input Resolution**: Template → Scene → Layer → Frame (with overrides applied)
4. **Remotion Props**: Layer components receive `resolvedInputs` with all merges applied
5. **Directive Mapping**: ForgeRuntimeDirective payload should align with TEMPLATE_INPUT_KEY structure