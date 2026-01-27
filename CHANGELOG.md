# Changelog

All notable changes to Dialogue Forge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Video Workspace Reconstruction** (January 27, 2026)
  - Complete 4-panel workspace layout matching Forge architecture
  - VideoCanvas with drag-and-drop layer creation
  - VideoLayerRenderer with move/resize capabilities
  - PropertyInspector overlay panel with full layer property editing
  - VideoTimeline with playback controls and layer tracks
  - VideoProjectSwitcher for project management
  - Orange-red theming and Forge-style hover borders
  - Draft system integration for template editing
  - Template/Draft/ViewState/Project store slices
  - Event system with auto-save on commit
  - PayloadCMS adapter for template persistence

### Changed
- Simplified template palette to show only "Blank Canvas" template
- Property inspector now overlays as right panel instead of shifting layout
- Template loading now uses draft system (resetDraft) instead of cache
- All layer operations now update draftGraph instead of template cache
- Toolbar enhanced with Save button (highlights when unsaved changes)
- Menu bar shows template name and project switcher

### Fixed
- Template loading from draft system
- Inspector blocking canvas interaction (moved to side panel)
- Canvas coordinate transformation for anchor-based positioning
- Layer rendering with proper anchor point calculations
- Project switching triggering template reload

### In Progress
- Fixing pointer events bug preventing layer interaction after drop
- Adding z-index management for layer stacking
- Building Default/Override tab system
- Implementing Remotion layer rendering components
- Building export modal with progress tracking

---

## [0.1.8] - 2026-01-26

### Added
- **Video Workspace Initial Implementation**
  - Video workspace with Remotion integration and preview
  - Timeline grid layout for scene sequencing
  - Video template duplication and management
  - Layer kinds and Remotion mapping
  - Export rendering panel
  - CopilotKit actions for video studio (#141, #140, #139)
  - Interactive buttons and metadata controls (#139)
  
- **Draft System** (Generic Pattern)
  - Draft delta types and helpers (#126)
  - Generic draft slice implementation (#127)
  - Forge workspace draft slice (#128)
  - Writer narrative draft pipeline (#134)
  - Visual indicators for graph nodes and edges (#130)
  - Commit bar component for narrative graphs (#133)
  - Status bar for graph editor (#131)
  
- **Video Studio Features**
  - Project gating and project switcher (#125)
  - Template input override validation (#123)
  - Remotion player preview in GamePlayer (#109)
  - Interactive GamePlayer execution mode (#109)
  
- **Runtime Integration**
  - Frame-to-template input mapper
  - Media resolver for video template previews
  - Video template compilation helpers
  - Runtime frame helpers and composition compiler
  - Video template presets
  - Remotion video render API

### Changed
- Enhanced narrative graph validation (#136)
- Improved writer workspace UI and smoothness
- Adjusted video studio presets workflow (#137)
- Updated graph editor to use draft deltas (#129)
- Refined pending page creation to occur on draft commit (#132)
- Repo organization and boundary enforcement

### Fixed
- Preview binding guard issues (#138)
- Build errors related to workspace store
- Excessive API requests
- Conditional detour nodes performance
- Character node edge drop menu
- GetServerSnapshot infinite loop

---

## [0.1.7] - 2025-12-15

### Added
- Video template workspace scaffolding
- Video template types and bindings
- Frame-to-template input mapper
- Media resolver foundation

### Changed
- Repo organization improvements

---

## [0.1.6] - 2025-11-20

### Added
- ForgeWorkspace foundational architecture
- WriterWorkspace initial implementation
- Flag system for game state management

---

## Version History

For detailed commit history, see [GitHub Commits](https://github.com/MagicbornStudios/dialogue-forge/commits/main)

---

## Migration Guides

### Migrating to v0.2.0 (Upcoming)
- Draft system is now required for all workspaces
- VideoTemplateWorkspace deprecated in favor of VideoWorkspace
- Template loading now uses `resetDraft()` instead of `loadTemplate()`
- See [docs/migration/v0.1-to-v0.2.md](./docs/migration/v0.1-to-v0.2.md) for details

---

## Breaking Changes

### v0.1.8
- None (additive changes only)

### Future Breaking Changes
- Removal of VideoTemplateWorkspace (use VideoWorkspace instead)
- Reorganization of src/ directory structure (see reorg-discovery)
- Draft system will become required (currently optional)
