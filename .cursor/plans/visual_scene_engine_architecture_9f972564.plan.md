---
name: Visual Scene Engine Architecture
overview: Design and implement a visual scene engine for Dialogue Forge that supports asset management, scene editing, and runtime rendering, integrated with the direct execution engine.
todos:
  - id: setup-imagekit
    content: Install and configure payloadcms-plugin-imagekit in payload.config.ts with ImageKit credentials, including existing 'media' collection and new scene asset collections
    status: pending
  - id: update-media-collection
    content: Update existing media.ts collection to remove local staticDir and configure for ImageKit (existing relationships like characters.avatar will continue to work)
    status: pending
    dependencies:
      - setup-imagekit
  - id: create-asset-collections
    content: Create PayloadCMS collections for character-variants, scene-assets, audio-assets, video-assets, and scene-templates with both upload fields (ImageKit) and optional relationship fields to media collection for flexibility
    status: pending
    dependencies:
      - setup-imagekit
  - id: extend-forge-node
    content: Extend ForgeNode type in forge-graph.ts to include ForgeSceneConfig with background, characters, audio, video, camera, and transition fields
    status: pending
  - id: create-scene-types
    content: Create src/types/scene.ts with scene-related type definitions (ForgeSceneConfig, SceneTemplate, etc.)
    status: pending
    dependencies:
      - extend-forge-node
  - id: build-scene-renderer
    content: Create SceneRenderer component that renders backgrounds, characters, audio, video, and handles camera controls
    status: pending
    dependencies:
      - create-scene-types
  - id: integrate-scene-execution
    content: Integrate scene rendering into GamePlayer execution engine to trigger scene changes from node.sceneConfig
    status: pending
    dependencies:
      - build-scene-renderer
  - id: create-asset-browser
    content: Build AssetBrowser component for selecting and managing scene assets (backgrounds, audio, video, character variants)
    status: pending
    dependencies:
      - create-asset-collections
  - id: build-scene-editor
    content: Create SceneEditor component with canvas viewport, drag-and-drop positioning, property panels, and template selector
    status: pending
    dependencies:
      - create-asset-browser
      - create-scene-types
  - id: implement-templates
    content: Create default scene templates (single character, two characters split, etc.) and template application system
    status: pending
    dependencies:
      - build-scene-editor
  - id: add-camera-controls
    content: Implement camera panning, zooming, and position controls in both editor and runtime
    status: pending
    dependencies:
      - build-scene-renderer
  - id: add-transitions
    content: Implement scene transition effects (fade, slide, dissolve) for smooth scene changes
    status: pending
    dependencies:
      - build-scene-renderer
  - id: integrate-node-editor
    content: Add scene configuration tab to NodeEditor with scene preview and quick template selector
    status: pending
    dependencies:
      - build-scene-editor
  - id: optimize-asset-loading
    content: Implement asset preloading, caching, and optimized loading for smooth scene transitions
    status: pending
    dependencies:
      - build-scene-renderer
---

# Visual Scene Engine Architecture

## Overview

Build a comprehensive visual scene system that allows users to create and edit visual novel-style scenes with characters, backgrounds, audio, video, and camera controls. The system integrates with the direct execution engine to display scenes during dialogue progression.

## Architecture Components

### 1. ImageKit Setup and Configuration

**Installation:**

```bash
npm install payloadcms-plugin-imagekit
```

**Configuration in `app/payload.config.ts`:**

```typescript
import imagekitPlugin from 'payloadcms-plugin-imagekit';
// Note: If using @payloadcms/plugin-cloud, disable its storage:
// import { payloadCloud } from '@payloadcms/plugin-cloud';

export default buildConfig({
  plugins: [
    // If using Payload Cloud, disable storage:
    // payloadCloud({ storage: false }),
    imagekitPlugin({
      config: {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        endpoint: process.env.IMAGEKIT_ENDPOINT!, // e.g., https://ik.imagekit.io/your_id/
      },
      collections: {
        // Existing media collection - update to use ImageKit
        'media': {
          uploadOption: {
            folder: 'media',
            extensions: [
              {
                name: 'aws-auto-tagging',
                minConfidence: 80,
                maxTags: 10,
              },
            ],
          },
          savedProperties: ['url', 'AITags'],
        },
        // New scene asset collections
        'character-variants': {
          uploadOption: {
            folder: 'character-variants',
            extensions: [
              {
                name: 'aws-auto-tagging',
                minConfidence: 80,
                maxTags: 10,
              },
            ],
          },
          savedProperties: ['url', 'AITags'],
        },
        'scene-assets': {
          uploadOption: {
            folder: 'scene-assets',
          },
          savedProperties: ['url'],
        },
        'audio-assets': {
          uploadOption: {
            folder: 'audio-assets',
          },
          savedProperties: ['url'],
        },
        'video-assets': {
          uploadOption: {
            folder: 'video-assets',
          },
          savedProperties: ['url'],
        },
        'scene-templates': {
          uploadOption: {
            folder: 'scene-templates',
          },
          savedProperties: ['url'],
        },
      },
    }),
  ],
});
```

**Environment Variables:**

- `IMAGEKIT_PUBLIC_KEY`: Public API key from ImageKit dashboard
- `IMAGEKIT_PRIVATE_KEY`: Private API key (keep secure)
- `IMAGEKIT_ENDPOINT`: ImageKit URL endpoint (e.g., `https://ik.imagekit.io/jdncbq5wj`)

**Benefits:**

- Automatic file syncing from PayloadCMS to ImageKit
- CDN delivery for fast global access
- Image transformations (resize, crop, quality) via URL parameters
- Auto-tagging for better asset search
- Reduced PayloadCMS storage costs

### 2. Asset Management System (Normalized + Collection-Specific)

**Dual Storage Strategy:**

The system supports two patterns for maximum flexibility:

1. **Normalized Media** (via `media` collection):

   - Shared media collection that any collection can reference
   - Use `relationTo: 'media'` for reusable assets
   - Example: Character avatars, shared backgrounds
   - Updated to use ImageKit for file storage

2. **Collection-Specific Uploads**:

   - Direct upload fields within collections
   - Use `type: 'upload'` for collection-specific assets
   - Example: Character variant images, scene-specific assets
   - Also use ImageKit for file storage

**Benefits:**

- Reuse assets across collections (normalized)
- Collection-specific assets when needed (flexible)
- All files stored in ImageKit CDN (consistent)
- Choose the right pattern per use case

**Update Existing Media Collection** (`media.ts`):

- Remove local `staticDir` configuration
- Configure ImageKit plugin for `media` collection
- Keep existing fields (`alt`, etc.)
- Existing relationships (like `characters.avatar`) continue to work
- Files now sync to ImageKit instead of local storage

**Collection Pattern Examples:**

```typescript
// Pattern 1: Collection-specific upload (direct)
{
  character: 1,
  emotion: 'happy',
  image: <upload field> // Goes directly to ImageKit
}

// Pattern 2: Normalized media (relationship)
{
  character: 1,
  emotion: 'happy',
  imageMedia: <relationship to media> // Links to shared media collection
}
```

**New PayloadCMS Collections** (support both patterns):

**Character Variants Collection** (`character-variants.ts`)

- Fields:
  - `character` (relationship to `characters`)
  - `emotion` (text: happy/sad/angry/etc.)
  - `variantName` (text)
  - `image` (upload → ImageKit, collection-specific)
  - `imageMedia` (relationship to `media`, optional - for normalized assets)
  - `project` (relationship)
- Supports both direct uploads and linking to shared media
- ImageKit stores: `url`, `AITags` (auto-tagging for search)

**Scene Assets Collection** (`scene-assets.ts`)

- Fields:
  - `project` (relationship)
  - `name` (text)
  - `type` (select: background/prop/overlay)
  - `asset` (upload → ImageKit, collection-specific)
  - `assetMedia` (relationship to `media`, optional - for normalized assets)
  - `tags` (array)
- Can use direct upload or link to shared media
- ImageKit stores: `url`, optimized variants

**Audio Assets Collection** (`audio-assets.ts`)

- Fields:
  - `project` (relationship)
  - `name` (text)
  - `audio` (upload → ImageKit, collection-specific)
  - `audioMedia` (relationship to `media`, optional - for normalized assets)
  - `type` (select: music/sfx/voice)
  - `tags` (array)
- ImageKit stores: `url` for audio files

**Video Assets Collection** (`video-assets.ts`)

- Fields:
  - `project` (relationship)
  - `name` (text)
  - `video` (upload → ImageKit, collection-specific)
  - `videoMedia` (relationship to `media`, optional - for normalized assets)
  - `tags` (array)
- ImageKit stores: `url` for video files

**Scene Templates Collection** (`scene-templates.ts`)

- Fields:
  - `project` (relationship)
  - `name` (text)
  - `template` (json)
  - `preview` (upload → ImageKit, collection-specific)
  - `previewMedia` (relationship to `media`, optional - for normalized assets)
- ImageKit stores: `url` for preview images

### 2. Scene Data Model (Extend ForgeNode)

Extend `ForgeNode` type in `src/types/forge/forge-graph.ts` to include scene configuration:

```typescript
export type ForgeSceneConfig = {
  // Background
  backgroundAssetId?: number;
  backgroundPosition?: { x: number; y: number };
  backgroundScale?: number;
  
  // Characters
  characters?: Array<{
    characterId: string;
    variantId?: number; // Character variant ID for emotion
    position: { x: number; y: number; z?: number }; // z for layering
    scale?: number;
    opacity?: number;
    animation?: string; // Animation preset name
  }>;
  
  // Audio
  backgroundMusicId?: number;
  soundEffectId?: number;
  
  // Video
  videoAssetId?: number;
  videoLoop?: boolean;
  
  // Camera
  camera?: {
    position: { x: number; y: number };
    zoom?: number;
    pan?: { from: { x: number; y: number }; to: { x: number; y: number }; duration?: number };
  };
  
  // Transitions
  transition?: {
    type: 'fade' | 'slide' | 'dissolve';
    duration?: number;
  };
  
  // Template reference
  templateId?: number;
};

// Add to ForgeNode
export type ForgeNode = {
  // ... existing fields
  sceneConfig?: ForgeSceneConfig;
};
```

### 3. Scene Editor Component

Create `src/components/SceneEditor/SceneEditor.tsx` - a visual drag-and-drop editor:

**Features:**

- Canvas viewport showing scene preview
- Asset browser panel (characters, backgrounds, audio, video)
- Timeline for animations and transitions
- Property panel for selected elements
- Template selector for quick scene setup
- Character position controls (left/center/right presets + custom)
- Camera controls (pan, zoom, position)
- Audio/video preview and assignment

**UI Structure:**

```
┌─────────────────────────────────────────┐
│  Toolbar: Save, Load Template, Preview  │
├──────────┬──────────────────┬────────────┤
│ Asset    │   Canvas        │ Properties │
│ Browser  │   (Scene View)  │ Panel      │
│          │                 │            │
│ - Chars  │   [Background]   │ Position   │
│ - BGs    │   [Character]   │ Scale      │
│ - Audio  │   [Character]   │ Opacity    │
│ - Video  │                 │ Animation  │
│          │                 │            │
├──────────┴──────────────────┴────────────┤
│ Timeline: [Audio] [Video] [Camera]      │
└─────────────────────────────────────────┘
```

### 4. Scene Runtime Renderer

Create `src/components/GamePlayer/components/SceneRenderer.tsx` - renders scenes during execution:

**Features:**

- Renders background images with positioning/scaling
- Displays character sprites with variants and positions
- Plays audio (background music, sound effects)
- Plays video clips
- Handles camera panning/zooming
- Manages scene transitions (fade, slide, dissolve)
- Supports layering (z-index for characters)
- Optimized asset loading and caching
- Uses ImageKit URLs for CDN delivery and image transformations

**Integration with GamePlayer:**

- Hook into node execution to trigger scene changes
- Load scene config from `node.data.sceneConfig`
- Handle transitions between scenes
- Sync with dialogue display
- Use ImageKit URLs from asset collections (with optional transformations like `?tr=w-1920,h-1080` for responsive sizing)

### 5. Execution Engine Integration

Modify `src/components/GamePlayer/engine/` to support scene changes:

**Scene Execution Handler:**

- When executing a CHARACTER node, check for `sceneConfig`
- If scene config exists, trigger scene change
- Handle transitions and asset loading
- Support scene persistence (scene continues until next scene config)

**State Management:**

- Track current scene state
- Manage asset loading queue
- Handle preloading for smooth transitions

### 6. Asset Selector Components

Create reusable components for asset selection:

**CharacterVariantSelector** (`src/components/SceneEditor/components/CharacterVariantSelector.tsx`)

- Shows character with all emotion variants
- Allows selecting variant for scene

**AssetBrowser** (`src/components/SceneEditor/components/AssetBrowser.tsx`)

- Lists assets by type (backgrounds, audio, video)
- Search and filter capabilities
- Preview thumbnails
- Drag-and-drop to canvas

**TemplateSelector** (`src/components/SceneEditor/components/TemplateSelector.tsx`)

- Shows available scene templates
- Preview template layout
- Apply template to current scene

### 7. Scene Presets/Templates System

**Default Templates:**

- "Single Character Center" - One character centered
- "Two Characters Split" - Two characters left/right
- "Three Characters" - Left/center/right layout
- "Cinematic Wide" - Wide shot with multiple characters
- "Close-up" - Single character close-up

**Template Structure:**

```typescript
type SceneTemplate = {
  name: string;
  characterSlots: Array<{ position: { x: number; y: number }; scale: number }>;
  camera: { position: { x: number; y: number }; zoom: number };
  background: { position: { x: number; y: number }; scale: number };
};
```

### 8. Node Editor Integration

Extend `NodeEditor.tsx` to include scene configuration:

- Add "Scene" tab to node editor
- Show scene preview
- Link to full scene editor
- Quick scene template selector
- Character variant selector per node

## Implementation Phases

### Phase 1: Foundation

1. Install and configure ImageKit plugin in PayloadCMS (including existing `media` collection)
2. Update existing `media.ts` collection to use ImageKit instead of local storage
3. Create PayloadCMS collections for scene assets (with both upload and relationship fields)
4. Extend ForgeNode type with scene config
5. Create basic SceneRenderer component
6. Integrate scene rendering into GamePlayer

### Phase 2: Asset Management

1. Build AssetBrowser component
2. Create asset upload/management UI
3. Implement asset loading and caching
4. Add character variant system

### Phase 3: Scene Editor

1. Build SceneEditor canvas component
2. Implement drag-and-drop positioning
3. Add property panels for selected elements
4. Create template system

### Phase 4: Advanced Features

1. Add camera controls and panning
2. Implement transitions (fade, slide, dissolve)
3. Add timeline for animations
4. Audio/video playback controls

### Phase 5: Integration & Polish

1. Integrate with node editor
2. Add scene preview in graph view
3. Optimize performance
4. Add documentation and examples

## File Structure

```
src/
├── components/
│   ├── SceneEditor/
│   │   ├── SceneEditor.tsx              # Main editor component
│   │   ├── components/
│   │   │   ├── CanvasViewport.tsx       # Scene canvas
│   │   │   ├── AssetBrowser.tsx         # Asset selection
│   │   │   ├── CharacterVariantSelector.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── PropertyPanel.tsx        # Element properties
│   │   │   └── Timeline.tsx             # Animation timeline
│   │   └── hooks/
│   │       ├── useSceneEditor.ts        # Editor state
│   │       └── useAssetLoader.ts        # Asset loading
│   └── GamePlayer/
│       ├── components/
│       │   ├── SceneRenderer.tsx        # Runtime scene renderer
│       │   └── SceneTransition.tsx       # Transition effects
│       └── engine/
│           └── scene-handler.ts         # Scene execution logic
├── types/
│   └── scene.ts                         # Scene type definitions
└── lib/
    └── scene-templates.ts               # Default templates

app/
├── payload.config.ts                    # ImageKit plugin configuration
└── payload-collections/
    ├── enums.ts                          # Add new collection constants
    └── collection-configs/
        ├── media.ts                      # Update to use ImageKit
        ├── character-variants.ts        # New collection
        ├── scene-assets.ts               # New collection
        ├── audio-assets.ts               # New collection
        ├── video-assets.ts               # New collection
        └── scene-templates.ts            # New collection
```

## Key Design Decisions

1. **Scene Data in Nodes**: Scene config stored directly in `ForgeNode.sceneConfig` for tight integration with dialogue flow
2. **Dual Asset Storage Pattern**: Support both normalized media (via `media` collection relationships) and collection-specific uploads (direct upload fields), both using ImageKit
3. **ImageKit Integration**: Use [payloadcms-plugin-imagekit](https://github.com/novanda1/payload-imagekit) for automatic file syncing, CDN delivery, and image optimization across all collections
4. **Backward Compatibility**: Existing `media` collection and relationships (e.g., `characters.avatar`) continue to work, now with ImageKit storage
5. **Template System**: Opinionated templates for common scene layouts
6. **Character Variants**: Separate collection for emotion variants to support granular character expressions
7. **Direct Execution Integration**: Scene changes triggered during node execution, not separate system
8. **Progressive Enhancement**: Basic scenes work without editor; editor enhances experience

## Integration Points

- **Node Execution**: Scene changes triggered when executing nodes with `sceneConfig`
- **Asset Loading**: Assets loaded via PayloadCMS adapter, URLs resolved from ImageKit CDN (with optional transformations)
- **State Management**: Scene state managed alongside dialogue execution state
- **Editor Access**: Scene editor accessible from node editor or standalone

## Future Enhancements

- Animation keyframes and timeline editing
- Particle effects and visual effects
- 3D scene support
- Real-time collaboration
- Export scene data for external tools
- Theatre.js integration (optional, if needed)