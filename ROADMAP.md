# Dialogue Forge - Roadmap

**Last Updated**: January 27, 2026

## Vision

Build a professional, Canva-like video template editor integrated with narrative dialogue systems, enabling game developers and content creators to transform dialogue into polished video content.

---

## Current State (v0.1.8 - January 2026)

### Overall Progress: 60%

```
Video Workspace Completion Progress:

Core Editing        ████████████████░░  85%
Timeline            ████████████████░░  85%
Persistence         ████████████████░░  90%
UI/UX              ███████████████░░░  75%
Remotion Export     ████░░░░░░░░░░░░░  25%
Media System        ██░░░░░░░░░░░░░░░  15%
Overrides System    ██░░░░░░░░░░░░░░░  15%
Advanced Features   ░░░░░░░░░░░░░░░░░   5%

Overall:            ████████████░░░░░  60%
```

### ✅ Completed Features

**Video Workspace Foundation (85% Complete)**:
- [x] Professional 4-panel layout (Sidebar | Canvas | Inspector | Timeline)
- [x] Template system (VideoTemplate → VideoScene → VideoLayer hierarchy)
- [x] Visual canvas with layer rendering
- [x] Drag-and-drop element creation
- [x] Layer selection, move, resize
- [x] Property inspector (position, size, rotation, opacity, text, colors)
- [x] Timeline with playback controls
- [x] Playhead scrubbing
- [x] Project switcher
- [x] PayloadCMS persistence
- [x] Draft system integration
- [x] Auto-save on commit
- [x] Orange-red theming and Forge-style borders

**Template System (95% Complete)**:
- [x] Template structure (scenes and layers)
- [x] Layer types (TEXT, RECTANGLE, CIRCLE, IMAGE, VIDEO, BACKGROUND, etc.)
- [x] Visual properties (position, size, rotation, scale, anchor points)
- [x] Style properties (colors, fonts, borders)
- [x] Input binding system
- [x] Compilation pipeline (normalize → stitch → resolve)

**Store Architecture (100% Complete)**:
- [x] Zustand store with 4 slices
- [x] Draft/commit workflow
- [x] Event system
- [x] Subscription patterns
- [x] Template history (undo/redo ready)

### 🚧 In Progress

**Critical Bugs**:
- [ ] Fix pointer events bug preventing layer interaction after drop
- [ ] Add z-index management for proper layer stacking
- [ ] Fix template loading edge cases

**Active Development**:
- [ ] Default/Override tab system for template customization
- [ ] Remotion layer rendering components
- [ ] Export modal with progress tracking

---

## Immediate (This Week) - CRITICAL PATH

**Goal**: Fix critical bugs, ship working editor with export

### Day 1-2: Critical Bug Fixes (30 min)
- [ ] **P0**: Fix pointer events bug (VideoCanvas.tsx:201) - Add `pointer-events-none` to inner div
- [ ] **P0**: Add z-index to layers (VideoLayerRenderer.tsx) - Pass layerIndex, apply zIndex
- [ ] Test drag-drop-move-edit workflow works perfectly

### Day 2-3: Default/Override Tabs (4-6 hours) ✅ COMPLETE
- [x] Create OverrideEditor component with tab switcher
- [x] Build DefaultTab (current canvas - editable)
- [x] Build OverrideTab (override form + preview)
- [x] Add canvas readonly mode (lock during preview)
- [x] Wire to store (overrideEditorState slice)
- [x] Add preview toggle button
- [x] Show lock overlay when preview active

**Deliverable**: ✅ Can switch between editing template defaults and previewing with overrides

### Day 3-4: Remotion Export Core (6-8 hours) ✅ MOSTLY COMPLETE
- [x] Implement Text layer component (Remotion)
- [x] Implement Rectangle layer component
- [x] Implement Circle layer component
- [x] Implement Image layer component
- [x] Implement Video layer component
- [x] Implement Background layer component
- [x] Update VideoCompositionRenderer to use real components
- [ ] Build export modal UI (settings: format, resolution, FPS) ← IN PROGRESS
- [ ] Wire export button to modal
- [ ] Integrate with existing Remotion API

**Deliverable**: 85% - Remotion rendering ready, need export UI

---

## Short Term (Next 2 Weeks) - MVP COMPLETION

### Week 1: Media Support
- [ ] Implement media resolver (PayloadCMS integration)
- [ ] Build Image layer component (Remotion)
- [ ] Build Video layer component (Remotion)
- [ ] Build Background layer component (Remotion)
- [ ] Add media picker UI (select from PayloadCMS media)
- [ ] Test image/video export

**Deliverable**: Can use images and videos in templates

### Week 2: Advanced Timeline
- [ ] Drag layer bars to adjust startMs/durationMs
- [ ] Visual feedback during timeline drag
- [ ] Layer reordering (drag tracks up/down)
- [ ] Update z-index when reordering
- [ ] Timeline zoom controls
- [ ] Snap to time markers
- [ ] Keyboard shortcuts:
  - Delete → remove layer
  - Ctrl+D → duplicate layer
  - Arrow keys → nudge layer
  - Ctrl+Z/Y → undo/redo

**Deliverable**: Professional timeline editor with full layer control

---

## Medium Term (Next 4-6 Weeks) - POLISH & SCALE

### Weeks 3-4: Multi-Scene Editing
- [ ] Scene list UI in sidebar
- [ ] Add/delete/reorder scenes
- [ ] Switch active scene
- [ ] Scene duration editing
- [ ] Scene transitions (crossfade, cut, wipe)
- [ ] Copy/paste scenes

**Deliverable**: Complex multi-scene video templates

### Weeks 5-6: Template Gallery & Library
- [ ] 10+ professional built-in templates
- [ ] Template preview thumbnails
- [ ] Template categories (Social, Marketing, Tutorial, etc.)
- [ ] Template search/filter
- [ ] Template duplication in UI
- [ ] Template marketplace integration (future)

**Deliverable**: Rich template library for quick starts

### Weeks 7-8: Advanced Editing Tools
- [ ] Snap to grid (toggle)
- [ ] Smart guides (align to other layers)
- [ ] Align/distribute tools
- [ ] Layer groups
- [ ] Layer locking
- [ ] Copy/paste/duplicate layers
- [ ] Undo/redo UI and shortcuts

**Deliverable**: Professional editing experience

---

## Long Term (Q2-Q3 2026) - ADVANCED FEATURES

### Q2 (Apr-Jun): Animation & Audio

**Animation System**:
- [ ] Keyframe support in VideoLayer type
- [ ] Keyframe UI in timeline
- [ ] Easing curves (linear, ease-in, ease-out, spring)
- [ ] Opacity animations
- [ ] Position animations
- [ ] Scale animations
- [ ] Rotation animations
- [ ] Animation presets (fade in, slide in, bounce)

**Audio System**:
- [ ] Audio track in timeline
- [ ] Waveform visualization
- [ ] Audio layer type
- [ ] Volume control
- [ ] Fade in/out
- [ ] Voiceover integration
- [ ] Background music
- [ ] Sound effects

**Deliverable**: Rich animated videos with audio

### Q3 (Jul-Sep): Forge Integration & Batch Export

**Export from Forge Workspace**:
- [ ] "Export as Video" button in ForgeWorkspace
- [ ] Template picker modal
- [ ] Frame → Template compilation UI
- [ ] Batch export (all paths)
- [ ] Export queue management
- [ ] Preview before export

**Advanced Compilation**:
- [ ] Character-specific templates (per character portrait/voice)
- [ ] Conditional templates (branching narratives)
- [ ] Dynamic duration (based on dialogue length)
- [ ] Subtitle generation
- [ ] Multi-language support

**Deliverable**: Seamless dialogue-to-video workflow

---

## Future (Q4 2026+) - ENTERPRISE FEATURES

### Collaboration
- [ ] Real-time collaborative editing
- [ ] Comments on layers
- [ ] Version history
- [ ] Template sharing
- [ ] User permissions

### AI System Architecture & Chat (Planned — separate agent)
- [ ] **Execute AI system plan**: Per-domain agents (Forge: create graphs; Writer: write stories; Video: create templates), barebones AI layer with no domain coupling, chat system that routes to the active agent, keep existing CopilotKit frontend actions in domains. See **[docs/plans/ai-system-architecture.md](docs/plans/ai-system-architecture.md)** for full plan and acceptance criteria. A dedicated agent will implement this.

### AI Features
- [ ] AI-generated backgrounds (OpenRouter + Flux.2)
- [ ] Text-to-video generation
- [ ] Style transfer
- [ ] Auto-layout suggestions
- [ ] Smart cropping

### Platform Integration
- [ ] Template marketplace
- [ ] Community templates
- [ ] Asset library (stock images, music, effects)
- [ ] Game engine SDKs (Unity, Unreal, Godot)
- [ ] REST API for headless rendering
- [ ] Webhook integrations

### Performance & Scale
- [ ] Canvas rendering optimization (React.memo, virtualization)
- [ ] Large template handling (1000+ layers)
- [ ] Render farm for batch exports
- [ ] CDN integration for media
- [ ] Caching strategies

---

## Feature Status Matrix

| Feature | Status | % | Priority | Blocking Export? |
|---------|--------|---|----------|------------------|
| **CORE EDITING** |
| Template structure | ✅ Complete | 100% | - | No |
| Load template | ✅ Complete | 95% | High | No |
| Canvas rendering | 🟡 Partial | 65% | High | **Yes** |
| Layer creation (drag-drop) | 🟡 Partial | 60% | High | **Yes** |
| Layer selection | ✅ Complete | 100% | High | No |
| Layer move | 🟢 Mostly Done | 85% | High | No |
| Layer resize | 🟢 Mostly Done | 85% | High | No |
| Layer delete | ✅ Complete | 100% | Medium | No |
| Property editing | ✅ Complete | 90% | High | No |
| Multi-layer select | 🟠 Started | 30% | Low | No |
| Layer z-ordering | ❌ Not Started | 0% | Medium | No |
| **TIMELINE** |
| Timeline display | ✅ Complete | 90% | High | No |
| Playhead scrubbing | ✅ Complete | 95% | High | No |
| Play/pause | ✅ Complete | 100% | High | No |
| Layer tracks | ✅ Complete | 85% | High | No |
| Drag layer duration | ❌ Not Started | 0% | Medium | No |
| Keyframe support | ❌ Not Started | 0% | Low | No |
| **REMOTION** |
| Composition compiler | ✅ Complete | 100% | High | No |
| VideoCompositionRenderer | 🟠 Started | 25% | High | **Yes** |
| Text layer component | ❌ Not Started | 0% | High | **Yes** |
| Rectangle layer component | ❌ Not Started | 0% | Medium | **Yes** |
| Circle layer component | ❌ Not Started | 0% | Medium | **Yes** |
| Image layer component | ❌ Not Started | 0% | High | **Yes** |
| Video layer component | ❌ Not Started | 0% | High | **Yes** |
| Background layer component | ❌ Not Started | 0% | Medium | **Yes** |
| Export modal | ❌ Not Started | 0% | High | **Yes** |
| Export progress | 🟠 Started | 30% | High | **Yes** |
| **OVERRIDES** |
| Override types | ✅ Complete | 100% | Medium | No |
| Override compilation | ✅ Complete | 100% | Medium | No |
| Default/Override tabs | ❌ Not Started | 0% | High | No |
| Canvas readonly mode | ❌ Not Started | 0% | High | No |
| Override form | ❌ Not Started | 0% | High | No |
| **MEDIA** |
| Media resolver | 🟠 Started | 15% | High | **Yes** |
| Media library | ❌ Not Started | 0% | Medium | No |
| Media upload | ❌ Not Started | 0% | Medium | No |
| Media picker | ❌ Not Started | 0% | Medium | No |

**Blockers Count**: 9 features blocking export functionality

---

## Critical Path Timeline

```
Week 1 (Jan 27 - Feb 2):
├─ Day 1: Fix bugs (30 min) ✓ Critical
├─ Day 1-2: Default/Override tabs (6 hrs) ✓ High priority  
├─ Day 2-3: Remotion components (5 hrs) ✓ Blocking export
└─ Day 3-4: Export modal (2 hrs) ✓ Blocking export

Week 2 (Feb 3 - Feb 9):
├─ Media resolver (3 hrs) ✓ Blocking media layers
├─ Advanced timeline (4 hrs) ✓ High priority
└─ Test & polish (3 hrs)

MVP TARGET: February 9, 2026
```

---

## Success Metrics

### MVP Success Criteria
- [ ] Can create new video template from blank
- [ ] Can drag text/shapes onto canvas
- [ ] Can move/resize/edit layers
- [ ] Can preview with overrides (readonly mode)
- [ ] Can export as MP4 video
- [ ] Exported video plays correctly with all layers

### Beta Success Criteria
- [ ] Supports images and videos
- [ ] Advanced timeline editing (drag duration)
- [ ] Multi-scene templates
- [ ] 10+ professional templates
- [ ] Keyboard shortcuts working
- [ ] Undo/redo functional

### Production Success Criteria
- [ ] Animation keyframes
- [ ] Audio tracks
- [ ] Export from Forge workspace
- [ ] Batch video generation
- [ ] Template marketplace

---

## Questions & Decisions Log

### 2026-01-27
**Q**: Should we keep Starter/Hero templates?
**A**: No, simplify to just Blank template for now

**Q**: Preview modal or inline playback?
**A**: Inline playback in timeline, no separate preview modal

**Q**: Export priority?
**A**: Export from Video workspace first, Forge export later (Q3)

**Q**: Timeline complexity?
**A**: Advanced - draggable duration, keyframes, multi-layer controls

**Q**: Override system priority?
**A**: Immediate - needed to test templates with different data

---

## Notes

- This roadmap is a living document, updated as we implement features
- Priorities may shift based on user feedback and testing
- Timelines are estimates and may adjust based on complexity
- See [CHANGELOG.md](./CHANGELOG.md) for detailed version history
- See [VIDEO_ISSUES.md](./src/video/VIDEO_ISSUES.md) for current bugs and technical debt
- 2026-02-02: Forge graph editors now share a unified auto-save indicator and immediate-save path for structural changes
- 2026-02-02: Forge narrative/storylet sidebar supports graph deletion with cache cleanup
- 2026-02-02: Forge narrative editor content now guards missing character data
- 2026-02-02: Storylet node editor now renders optimistic input while waiting for debounced save
- 2026-02-02: Narrative node editor supports page selection for Act/Chapter/Page nodes
