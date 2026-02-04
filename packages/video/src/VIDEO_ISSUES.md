# Video Domain - Known Issues & TODOs

**Last Updated**: February 3, 2026

---

## February 3, 2026 Update

The legacy custom video workspace was removed. The host app uses Twick Studio (VideoWorkspaceTwick). Issues below that refer to the legacy workspace are archived for historical context only.

---

## Current Focus (Twick)

### 🟡 P1: Timeline Persistence Adapter
**Status**: ❌ Not Started  
**Description**: Wire Twick timeline load/save to the video adapter contract for persistence.  
**Notes**:
- Decide on JSON shape for saving/loading timeline data.
- Store by contextId (project + template).  

---

## Archived: Legacy Workspace Issues (removed Feb 3, 2026)

## 🔴 Critical Bugs (P0) - FIX IMMEDIATELY

### 🐛 Bug #1: Can't Interact with Layers After Drop
**Reporter**: User testing  
**Date Found**: 2026-01-27  
**Status**: 🔧 Fix Ready  

**Symptoms**:
- Drag element from palette → drop on canvas → layer appears
- Try to click/drag layer immediately → No response
- Wait 100-500ms → Layer becomes interactive

**Root Cause**:
Drop zone overlay inner div missing `pointer-events-none` class. Even though outer div has it, inner div blocks mouse events to layers underneath during React re-render.

**Files Affected**:
- `src/video/workspace/components/VideoCanvas/VideoCanvas.tsx:201`

**Fix**:
```diff
- <div className="px-4 py-2 rounded bg-[var(--color-df-video-bg)] text-[var(--color-df-video)] text-sm font-medium">
+ <div className="px-4 py-2 rounded bg-[var(--color-df-video-bg)] text-[var(--color-df-video)] text-sm font-medium pointer-events-none">
```

**Testing Checklist**:
- [ ] Drag text element, drop, immediately click → should select
- [ ] Drag rectangle, drop, immediately drag → should move
- [ ] Rapid drop multiple elements → all interactive immediately

**Priority**: P0 - BLOCKS ALL EDITING  
**Effort**: 1 minute  

---

### 🐛 Bug #2: Layers Render Behind Canvas Info Overlay
**Reporter**: Code review  
**Date Found**: 2026-01-27  
**Status**: 🔧 Fix Ready  

**Symptoms**:
- Layers may appear invisible or behind template info badge
- Layer rendering order unpredictable

**Root Cause**:
Canvas info overlay has `z-index: 50` but layers have no z-index (defaults to `auto`/0). Layers render behind overlay.

**Files Affected**:
- `src/video/workspace/components/VideoCanvas/VideoCanvas.tsx:186-196`
- `src/video/workspace/components/VideoCanvas/VideoLayerRenderer.tsx:171-196`

**Fix**:
```typescript
// VideoCanvas.tsx:186
{layers.map((layer, index) => (
  <VideoLayerRenderer
    layerIndex={index}  // Add this
    // ...
  />
))}

// VideoLayerRenderer.tsx interface
interface VideoLayerRendererProps {
  layerIndex: number;  // Add this
  // ...
}

// VideoLayerRenderer.tsx:180 style
style={{
  zIndex: layerIndex + 1,  // Add this
  // ...
}}
```

**Testing Checklist**:
- [ ] Drop 5 layers
- [ ] All layers visible above info overlay
- [ ] Later layers appear above earlier layers
- [ ] Can select any layer

**Priority**: P0 - CRITICAL UX BUG  
**Effort**: 15 minutes  

---

## 🟡 High Priority Features (P1)

### 📋 Feature #1: Default/Override Tab System
**Status**: ❌ Not Started  
**Required By**: Video export testing  

**Description**:
Need tab system to switch between editing template defaults and previewing with overrides (runtime data injection).

**Requirements**:
- Tab switcher: "Template" | "Override Preview"
- Template tab: Full editing (current canvas)
- Override tab: Override form + locked preview canvas
- Preview toggle button (eye icon)
- Canvas lock overlay when preview active

**Files to Create**:
- `src/video/workspace/components/OverrideEditor/OverrideEditor.tsx`
- `src/video/workspace/components/OverrideEditor/DefaultTab.tsx`
- `src/video/workspace/components/OverrideEditor/OverrideTab.tsx`

**Files to Modify**:
- `src/video/workspace/store/slices/viewState.slice.ts` (add overrideEditorState)
- `src/video/workspace/components/VideoWorkspaceLayout.tsx` (integrate tabs)

**Priority**: P1 - REQUIRED FOR TESTING  
**Effort**: 4-6 hours  

---

### 📋 Feature #2: Remotion Layer Rendering Components
**Status**: ❌ Not Started (TEXT placeholder exists)  
**Required By**: Video export  

**Description**:
VideoCompositionRenderer currently shows debug boxes. Need actual Remotion components for each layer type.

**Components Needed**:
- [x] Text.tsx (basic version exists in VideoLayerRenderer)
- [ ] Rectangle.tsx (Remotion AbsoluteFill + background)
- [ ] Circle.tsx (Remotion AbsoluteFill + border-radius)
- [ ] Image.tsx (Remotion Img with transforms)
- [ ] Video.tsx (Remotion Video with controls)
- [ ] Background.tsx (Remotion full-canvas image)

**Files to Create**:
- `src/video/player/components/layers/*.tsx` (6 files)
- `src/video/player/components/layers/index.ts` (registry)

**Files to Modify**:
- `src/video/player/VideoCompositionRenderer.tsx` (use real components)

**Priority**: P1 - BLOCKS EXPORT  
**Effort**: 4-5 hours  

---

### 📋 Feature #3: Export Modal & Flow
**Status**: ❌ Not Started (API exists)  
**Required By**: MVP  

**Description**:
Need UI to trigger video export, track progress, and download result.

**Requirements**:
- Export modal with settings (format, resolution, FPS, quality)
- Progress bar (percentage + estimated time)
- Download button when complete
- Error handling and retry

**Files to Modify**:
- `src/video/workspace/components/VideoWorkspaceModals.tsx` (implement ExportModal)
- `src/video/workspace/components/VideoWorkspaceToolbar.tsx` (wire button)

**API Endpoints** (already exist):
- `POST /api/video-render` (async mode)
- `GET /api/video-render/status/[jobId]` (poll status)
- `GET /api/video-render/[filename]` (download)

**Priority**: P1 - BLOCKS MVP  
**Effort**: 2 hours  

---

### 📋 Feature #4: Media Resolver Implementation
**Status**: 🟠 Stub Only  
**Required By**: Image/Video layers  

**Description**:
Need to resolve PayloadCMS media IDs to actual URLs for rendering.

**Current**: Returns `null` for all media
**Needed**: Query PayloadCMS media collection, return URL

**Files to Modify**:
- `src/video/lib/media-resolver.ts`
- `app/lib/video/payload-media-resolver.ts`

**Priority**: P1 - BLOCKS IMAGE/VIDEO EXPORT  
**Effort**: 2-3 hours  

---

## 🟢 Medium Priority Features (P2)

### Feature #5: Advanced Timeline Editing
**Status**: Basic timeline exists  
**Description**: Drag layer bars to adjust timing

**Needed**:
- [ ] Drag left edge → adjust startMs
- [ ] Drag right edge → adjust durationMs
- [ ] Drag entire bar → move layer in time
- [ ] Visual snap to time markers
- [ ] Collision detection (prevent overlap)

**Priority**: P2 - UX Enhancement  
**Effort**: 3-4 hours  

---

### Feature #6: Layer Z-Order Controls
**Status**: ❌ Not Started  
**Description**: Reorder layer stacking

**Needed**:
- [ ] Bring to Front button
- [ ] Send to Back button
- [ ] Move Up / Move Down
- [ ] Drag to reorder in timeline
- [ ] Update z-index on reorder

**Priority**: P2 - UX Enhancement  
**Effort**: 2-3 hours  

---

### Feature #7: Keyboard Shortcuts
**Status**: ❌ Not Started  
**Description**: Speed up editing workflow

**Needed**:
- [ ] Delete → remove selected layer
- [ ] Ctrl+D → duplicate layer
- [ ] Arrow keys → nudge 1px (Shift+Arrow → 10px)
- [ ] Ctrl+Z → undo
- [ ] Ctrl+Shift+Z → redo
- [ ] Escape → deselect all

**Priority**: P2 - UX Enhancement  
**Effort**: 2-3 hours  

---

### Feature #8: Multi-Scene Editing
**Status**: ❌ Not Started (only scene 0 editable)  
**Description**: Support templates with multiple scenes

**Needed**:
- [ ] Scene list in sidebar
- [ ] Switch active scene
- [ ] Add/delete/reorder scenes
- [ ] Scene transitions (cut, crossfade, wipe)

**Priority**: P2 - Feature Gap  
**Effort**: 5-6 hours  

---

## 🧹 Technical Debt

### Debt #1: Duplicate Components
**Impact**: Code confusion, maintenance burden

**Files to Delete** (8 legacy components):
```
src/video/workspace/components/
├── ElementLibrary.tsx      → Use ElementPalette
├── ElementRenderer.tsx     → Use VideoLayerRenderer
├── LayerInspector.tsx      → Use PropertyInspector
├── LayerList.tsx           → Use VideoTimeline
├── Preview.tsx             → Use RemotionPreview
├── SceneList.tsx           → Not implemented yet
├── Timeline.tsx            → Use VideoTimeline
└── VisualCanvas.tsx        → Use VideoCanvas
```

**Effort**: 1 hour (delete + verify no imports)

---

### Debt #2: Multiple Entry Points (Resolved)
**Status**: ✅ VideoTemplateWorkspace removed

---

### Debt #3: Missing Tests
**Current**: 1 test file
**Needed**: ~20 test files

**Coverage Gaps**:
- Store slices (0% coverage)
- UI components (0% coverage)
- Compilation pipeline (20% coverage)
- Integration tests (0%)

**Effort**: 2-3 weeks (ongoing)

---

### Debt #4: Missing Documentation
**Gaps**:
- No inline JSDoc
- docs/video.md is minimal (45 lines)
- No component usage examples
- No architecture diagrams

**Effort**: 1 week (ongoing)

---

## 📊 TODOs from Code Comments

### Video Copilot Actions (6 TODOs)
**File**: `workspace/copilot/video-actions-helper.ts`
- [ ] Line 15: Implement OpenRouter + Flux.2 model for image generation
- [ ] Line 28: Implement layout analysis for templates
- [ ] Line 41: Implement text optimization for video elements
- [ ] Line 54: Implement video element creation automation
- [ ] Line 67: Integration testing with actual Flux.2 API
- [ ] Line 80: Performance optimization for batch operations

### Media System (1 TODO)
**File**: `adapters/video-template-payload-adapter.ts`
- [ ] Line 132: Implement resolveMedia() method

### Remotion Integration (1 TODO)
**File**: `workspace/components/ElementRenderer.tsx`
- [ ] Line 45: Complete Remotion integration

---

## 🔬 Investigation Needed

### Investigation #1: Template Loading Race Condition
**Symptoms**: Sometimes templates don't load properly
**Hypothesis**: Race between resetDraft and template cache
**Status**: Under investigation

### Investigation #2: Canvas Scaling at Edge Cases
**Symptoms**: Layers might position incorrectly at very high/low zoom
**Hypothesis**: Coordinate transformation precision loss
**Status**: Needs testing

### Investigation #3: Performance with Many Layers
**Symptoms**: Unknown - not tested with 100+ layers
**Hypothesis**: May need virtualization
**Status**: Needs benchmarking

---

## 📈 Progress Tracking

### Week of Jan 27, 2026
- [x] Video workspace architecture rebuilt
- [x] Draft system integrated
- [x] Property inspector created
- [x] Timeline implemented
- [x] Project switcher added
- [ ] Fix pointer events bug
- [ ] Add z-index management
- [ ] Build Default/Override tabs
- [ ] Implement Remotion components
- [ ] Build export modal

### Blockers
- Pointer events bug (fix ready)
- Missing z-index (fix ready)
- No Remotion layer components (6 components needed)
- No export UI (modal needed)

---

## Notes

- This file tracks video domain issues only
- For cross-domain issues, see root-level issue tracker
- For feature requests, see ROADMAP.md
- For change history, see CHANGELOG.md
