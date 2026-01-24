---
name: ""
overview: ""
todos:
  - id: consolidate-pages-collection
    content: Merge Acts, Chapters, Pages into single Pages collection with pageType discriminator
    status: pending
  - id: update-narrative-types
    content: Replace ForgeAct, ForgeChapter, ForgePage with unified ForgePage type
    status: pending
  - id: update-graph-node-handlers
    content: Update ACT, CHAPTER, PAGE node creation/editing to work with unified Pages collection
    status: pending
  - id: refactor-writer-store
    content: Simplify Writer store to use single pages array with activePageId
    status: pending
  - id: add-version-history-sidebar
    content: Add version history UI to Writer sidebar narrative outline
    status: pending
  - id: clickable-breadcrumbs
    content: Make breadcrumbs clickable to navigate to parent pages
    status: completed
isProject: false
---

# Unified Pages Architecture Refactor

## Overview

Consolidate Acts, Chapters, and Pages into a single `Pages` collection with a `pageType` discriminator ('ACT', 'CHAPTER', 'PAGE'). The narrative graph in Forge and the Writer workspace operate on the same unified data model, with Forge focusing on graph navigation and Writer focusing on content editing.

## Core Concept

**Everything is a Page** with hierarchical relationships:

- ACT pages: Top-level narrative containers
- CHAPTER pages: Belong to an ACT (via `parent` relationship)
- PAGE pages: Belong to a CHAPTER (via `parent` relationship)

The narrative graph nodes (ACT, CHAPTER, PAGE) all reference the same `Pages` collection, just filtered by `pageType`.

## Current State Analysis

### Existing Collections

- **Acts** (`app/payload-collections/collection-configs/acts.ts`): 66 lines
                                                                                                                                - Fields: project, title, summary, content (json), order, bookHeading, bookBody, _status
                                                                                                                                - Versioning: drafts enabled

- **Chapters** (`app/payload-collections/collection-configs/chapters.ts`): 73 lines
                                                                                                                                - Fields: project, act (relationship), title, summary, content (json), order, bookHeading, bookBody, _status
                                                                                                                                - Versioning: drafts enabled

- **Pages** (`app/payload-collections/collection-configs/pages.ts`): ~82 lines
                                                                                                                                - Fields: project, chapter (relationship), title, summary, order, bookBody, archivedAt, _status, dialogueGraph (relationship)
                                                                                                                                - Versioning: drafts enabled

### Forge Graph Node Types

From `src/forge/types/forge-graph.ts`:

```typescript
export const NARRATIVE_FORGE_NODE_TYPE = {
  ACT: 'ACT',
  CHAPTER: 'CHAPTER',
  PAGE: 'PAGE',
  // ... others
} as const;
```

### Current Writer Store Structure

- `acts: ForgeAct[]`
- `chapters: ForgeChapter[]`
- `pages: ForgePage[]`
- `activePageId`, `activeActId`, `activeChapterId` (three separate IDs)

## Proposed Architecture

### 1. Unified Pages Collection

**File**: `app/payload-collections/collection-configs/pages.ts`

```typescript
import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Pages: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.PAGES,
  trash: true,
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.PROJECTS,
      required: true,
      index: true,
    },
    {
      name: 'pageType',
      type: 'select',
      options: [
        { label: 'Act', value: 'ACT' },
        { label: 'Chapter', value: 'CHAPTER' },
        { label: 'Page', value: 'PAGE' },
      ],
      required: true,
      index: true,
      admin: {
        description: 'Type of page in narrative hierarchy',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.PAGES,
      required: false,
      index: true,
      admin: {
        description: 'Parent page (Chapter for Page, Act for Chapter, null for Act)',
        condition: (data) => data.pageType !== 'ACT', // Acts have no parent
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'json',
      admin: {
        description: 'Rich content/metadata (optional)',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      index: true,
    },
    {
      name: 'bookHeading',
      type: 'text',
      admin: {
        description: 'Optional heading for book export',
      },
    },
    {
      name: 'bookBody',
      type: 'textarea',
      admin: {
        description: 'Main text content for this page',
      },
    },
    {
      name: 'dialogueGraph',
      type: 'relationship',
      relationTo: PAYLOAD_COLLECTIONS.FORGE_GRAPHS,
      required: false,
      admin: {
        description: 'Dialogue graph for PAGE type',
        condition: (data) => data.pageType === 'PAGE',
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      admin: {
        description: 'Timestamp when page was archived',
      },
    },
    {
      name: '_status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      required: false,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 50, // Keep more versions for narrative content
  },
}
```

### 2. Unified Type System

**File**: `src/forge/types/narrative.ts`

```typescript
/**
 * Unified Narrative Page - replaces ForgeAct, ForgeChapter, ForgePage
 * 
 * All narrative elements are pages with different types.
 * Hierarchy is established through parent relationships:
 * - ACT: pageType='ACT', parent=null
 * - CHAPTER: pageType='CHAPTER', parent=<Act Page ID>
 * - PAGE: pageType='PAGE', parent=<Chapter Page ID>
 */

export const PAGE_TYPE = {
  ACT: 'ACT',
  CHAPTER: 'CHAPTER',
  PAGE: 'PAGE',
} as const;

export type PageType = typeof PAGE_TYPE[keyof typeof PAGE_TYPE];

export type ForgePage = {
  id: number;
  pageType: PageType;
  title: string;
  summary?: string | null;
  order: number;
  bookHeading?: string | null;
  bookBody?: string | null;
  content?: any; // JSON field for rich metadata
  archivedAt?: string | null;
  _status?: 'draft' | 'published' | null;
  project: number;
  parent?: number | null; // References another Page (null for ACT)
  dialogueGraph?: number | null; // Only for PAGE type
};

// Helper type guards
export function isActPage(page: ForgePage): boolean {
  return page.pageType === PAGE_TYPE.ACT;
}

export function isChapterPage(page: ForgePage): boolean {
  return page.pageType === PAGE_TYPE.CHAPTER;
}

export function isContentPage(page: ForgePage): boolean {
  return page.pageType === PAGE_TYPE.PAGE;
}

// Hierarchy helpers
export type NarrativeHierarchy = {
  acts: Array<{
    page: ForgePage; // ACT page
    chapters: Array<{
      page: ForgePage; // CHAPTER page
      pages: ForgePage[]; // PAGE pages
    }>;
  }>;
};

export function buildNarrativeHierarchy(pages: ForgePage[]): NarrativeHierarchy {
  const acts = pages
    .filter(p => p.pageType === PAGE_TYPE.ACT)
    .sort((a, b) => a.order - b.order);
  
  return {
    acts: acts.map(act => ({
      page: act,
      chapters: pages
        .filter(p => p.pageType === PAGE_TYPE.CHAPTER && p.parent === act.id)
        .sort((a, b) => a.order - b.order)
        .map(chapter => ({
          page: chapter,
          pages: pages
            .filter(p => p.pageType === PAGE_TYPE.PAGE && p.parent === chapter.id)
            .sort((a, b) => a.order - b.order),
        })),
    })),
  };
}
```

### 3. Writer Store Simplification

**File**: `src/writer/components/WriterWorkspace/store/writer-workspace-types.ts`

```typescript
export interface WriterWorkspaceState {
  // Single unified pages array
  pages: ForgePage[];
  
  // Single active page ID
  activePageId: number | null;
  
  // Expanded state for navigation tree
  expandedPageIds: Set<number>; // Tracks which ACT/CHAPTER pages are expanded
  
  // ... rest of state (drafts, aiPreview, etc.)
}
```

**File**: `src/writer/components/WriterWorkspace/store/slices/content.slice.ts`

```typescript
export interface ContentSlice {
  pages: ForgePage[];
  contentError: string | null;
}

export interface ContentActions {
  setPages: (pages: ForgePage[]) => void;
  updatePage: (pageId: number, patch: Partial<ForgePage>) => void;
  setContentError: (error: string | null) => void;
}
```

**File**: `src/writer/components/WriterWorkspace/store/slices/navigation.slice.ts`

```typescript
export interface NavigationSlice {
  activePageId: number | null;
  expandedPageIds: Set<number>; // Which ACT/CHAPTER nodes are expanded in tree
  navigationError: string | null;
}

export interface NavigationActions {
  setActivePageId: (pageId: number | null) => void;
  togglePageExpanded: (pageId: number) => void; // For tree expand/collapse
  setNavigationError: (error: string | null) => void;
}
```

### 4. Forge Node Handlers Update

**Files to update**:

- `src/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ActNode/ActNodeFields.tsx`
- `src/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ChapterNode/ChapterNodeFields.tsx`
- `src/forge/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PageNode/PageNodeFields.tsx`

All three should now interact with the unified `Pages` collection:

- Create page with `pageType: 'ACT' | 'CHAPTER' | 'PAGE'`
- Set `parent` relationship correctly
- Filter lookups by `pageType` when needed

### 5. Data Adapter Updates

**File**: `app/lib/forge/data-adapter/payload-forge-adapter.ts`

Replace:

- `createAct()` 
- `updateAct()`
- `deleteAct()`

With unified:

```typescript
async createPage(input: {
  projectId: number;
  pageType: 'ACT' | 'CHAPTER' | 'PAGE';
  title: string;
  order: number;
  parent?: number; // Required for CHAPTER/PAGE
  content?: any;
}): Promise<ForgePage> {
  const result = await this.sdk.create({
    collection: 'pages',
    data: {
      project: input.projectId,
      pageType: input.pageType,
      title: input.title,
      order: input.order,
      parent: input.parent,
      content: input.content,
      _status: 'draft',
    },
  });
  return this.transformPageDoc(result.doc);
}

async updatePage(
  pageId: number,
  patch: Partial<ForgePage>
): Promise<ForgePage> {
  const result = await this.sdk.update({
    collection: 'pages',
    id: pageId,
    data: patch,
  });
  return this.transformPageDoc(result.doc);
}

async deletePage(pageId: number): Promise<void> {
  await this.sdk.delete({
    collection: 'pages',
    id: pageId,
  });
}

async listPages(projectId: number): Promise<ForgePage[]> {
  const result = await this.sdk.find({
    collection: 'pages',
    where: {
      project: { equals: projectId },
    },
    limit: 1000,
  });
  return result.docs.map(doc => this.transformPageDoc(doc));
}
```

**File**: `app/lib/writer/data-adapter/payload-writer-adapter.ts`

Same unified approach - remove separate `listActs`, `listChapters`, `listPages`. Replace with single `listPages()` method, then filter/organize by `pageType` in the UI layer.

### 6. Graph Sync Update

**File**: `src/writer/lib/sync/narrative-graph-sync.ts`

Update to work with unified pages:

```typescript
export function syncNarrativeGraphToPages(
  graph: ForgeGraphDoc,
  existingPages: ForgePage[]
): ForgePage[] {
  const nodes = Object.values(graph.flow.nodes);
  const updatedPages = [...existingPages];
  
  for (const node of nodes) {
    if (node.type === 'ACT' || node.type === 'CHAPTER' || node.type === 'PAGE') {
      const existingPage = updatedPages.find(p => p.id === node.data?.pageId);
      
      if (!existingPage) {
        // Create new page with appropriate pageType
        const newPage: ForgePage = {
          id: node.data?.pageId || 0, // Will be assigned by backend
          pageType: node.type as PageType,
          title: node.data?.title || 'Untitled',
          order: node.position.y / 100, // Derive from graph position
          parent: node.data?.parentId || null,
          project: graph.projectId,
          bookBody: '',
          _status: 'draft',
        };
        updatedPages.push(newPage);
      }
    }
  }
  
  return updatedPages;
}
```

### 7. WriterTree Simplification

**File**: `src/writer/components/WriterWorkspace/sidebar/WriterTree.tsx`

Massively simplified - single list of pages, build hierarchy client-side:

```typescript
export function WriterTree({ projectId }: WriterTreeProps) {
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const expandedPageIds = useWriterWorkspaceStore((state) => state.expandedPageIds);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  const togglePageExpanded = useWriterWorkspaceStore((state) => state.actions.togglePageExpanded);
  
  // Build hierarchy from flat pages array
  const hierarchy = useMemo(() => buildNarrativeHierarchy(pages), [pages]);
  
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
      {hierarchy.acts.map(({ page: actPage, chapters }) => (
        <div key={actPage.id}>
          <WriterTreeRow
            label={actPage.title}
            icon={<BookOpen size={14} />}
            depth={0}
            hasChildren={chapters.length > 0}
            isExpanded={expandedPageIds.has(actPage.id)}
            onToggle={() => togglePageExpanded(actPage.id)}
            onSelect={() => setActivePageId(actPage.id)}
            isSelected={activePageId === actPage.id}
            contextMenu={/* Act context menu */}
          />
          
          {expandedPageIds.has(actPage.id) && chapters.map(({ page: chapterPage, pages: contentPages }) => (
            <div key={chapterPage.id}>
              <WriterTreeRow
                label={chapterPage.title}
                icon={<FileText size={14} />}
                depth={1}
                hasChildren={contentPages.length > 0}
                isExpanded={expandedPageIds.has(chapterPage.id)}
                onToggle={() => togglePageExpanded(chapterPage.id)}
                onSelect={() => setActivePageId(chapterPage.id)}
                isSelected={activePageId === chapterPage.id}
                contextMenu={/* Chapter context menu */}
              />
              
              {expandedPageIds.has(chapterPage.id) && contentPages.map(page => (
                <WriterTreeRow
                  key={page.id}
                  label={page.title}
                  icon={<File size={14} />}
                  depth={2}
                  onSelect={() => setActivePageId(page.id)}
                  isSelected={activePageId === page.id}
                  contextMenu={/* Page context menu */}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 8. Version History in Writer Sidebar

Add version history UI directly in the Writer sidebar narrative outline:

**New Component**: `src/writer/components/WriterWorkspace/sidebar/PageVersionHistory.tsx`

```typescript
export function PageVersionHistory({ pageId }: { pageId: number }) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch versions from: GET /api/pages/{pageId}/versions
  useEffect(() => {
    async function fetchVersions() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/pages/${pageId}/versions`);
        const data = await response.json();
        setVersions(data.docs || []);
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    void fetchVersions();
  }, [pageId]);
  
  return (
    <div className="border-t border-df-node-border p-2">
      <div className="text-xs font-semibold text-df-text-secondary mb-2">
        Version History
      </div>
      
      {isLoading ? (
        <div className="text-xs text-df-text-tertiary">Loading...</div>
      ) : (
        <div className="space-y-1">
          {versions.map(version => (
            <div
              key={version.id}
              className="flex items-center justify-between text-xs p-1 hover:bg-df-control-bg rounded"
            >
              <span className="text-df-text-secondary">
                v{version.version} - {formatDate(version.updatedAt)}
              </span>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button className="text-df-text-tertiary hover:text-df-text-primary">
                    •••
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => viewVersion(version)}>
                    View
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => restoreVersion(pageId, version.id)}>
                    Restore
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => compareVersion(version)}>
                    Compare
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Add to `WriterTreeRow` when a page is selected:

```typescript
{isSelected && <PageVersionHistory pageId={page.id} />}
```

### 9. Clickable Breadcrumbs

**File**: `src/writer/components/WriterWorkspace/layout/WriterTopBar.tsx`

```typescript
export function WriterTopBar() {
  const pages = useWriterWorkspaceStore((state) => state.pages);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const setActivePageId = useWriterWorkspaceStore((state) => state.actions.setActivePageId);
  
  const activePage = useMemo(
    () => pages.find(p => p.id === activePageId) ?? null,
    [pages, activePageId]
  );
  
  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!activePage) return [];
    
    const path: ForgePage[] = [activePage];
    let current = activePage;
    
    // Walk up parent chain
    while (current.parent) {
      const parent = pages.find(p => p.id === current.parent);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return path;
  }, [activePage, pages]);
  
  return (
    <div className="flex flex-col gap-2 px-4 py-3 mb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-df-text-tertiary">
            {breadcrumbPath.map((page, index) => (
              <React.Fragment key={page.id}>
                {index > 0 && <ChevronRight size={12} />}
                <button
                  type="button"
                  onClick={() => setActivePageId(page.id)}
                  className="truncate hover:text-df-text-primary transition-colors"
                >
                  {page.title}
                </button>
              </React.Fragment>
            ))}
          </nav>
          <div className="mt-1 text-base font-semibold text-df-text-primary">
            {activePage?.title || 'Select a page'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Migration Strategy

### Database Migration

1. Create new unified `pages` table structure
2. Migrate existing data:
   ```sql
   -- Migrate Acts
   INSERT INTO pages (id, project, pageType, title, summary, content, order, bookHeading, bookBody, _status, parent)
   SELECT id, project, 'ACT', title, summary, content, order, bookHeading, bookBody, _status, NULL
   FROM acts;
   
   -- Migrate Chapters
   INSERT INTO pages (id, project, pageType, title, summary, content, order, bookHeading, bookBody, _status, parent)
   SELECT id, project, 'CHAPTER', title, summary, content, order, bookHeading, bookBody, _status, act
   FROM chapters;
   
   -- Migrate Pages (rename chapter column to parent)
   UPDATE pages SET parent = chapter WHERE pageType = 'PAGE';
   ```

3. Backup and drop old `acts` and `chapters` tables

### Code Migration

1. Remove `acts.ts` and `chapters.ts` collection configs
2. Update `pages.ts` collection config with new schema
3. Update all type imports: `ForgeAct`, `ForgeChapter` → `ForgePage`
4. Update data adapters to use unified methods
5. Update graph node handlers
6. Update Writer workspace store slices
7. Update WriterTree component
8. Update all graph sync logic

## Testing Checklist

- [ ] Create ACT page → appears in WriterTree
- [ ] Create CHAPTER page under ACT → hierarchy displays correctly
- [ ] Create PAGE under CHAPTER → full 3-level hierarchy works
- [ ] Click ACT in sidebar → edits ACT bookBody
- [ ] Click CHAPTER in sidebar → edits CHAPTER bookBody  
- [ ] Click PAGE in sidebar → edits PAGE bookBody
- [ ] Click breadcrumb → navigates to that page
- [ ] Version history shows in sidebar when page selected
- [ ] Restore version works
- [ ] Create ACT node in Forge → creates ACT page in database
- [ ] Edit ACT node in Forge → updates page in database
- [ ] Writer and Forge stay in sync via narrative graph

## Benefits of Unified Architecture

1. **Simpler Mental Model**: Everything is a page, hierarchy is via relationships
2. **Easier Graph Sync**: Forge and Writer work with same data structure
3. **Unified Versioning**: All pages have same version history system
4. **Less Code Duplication**: Single set of CRUD operations
5. **Flexible Hierarchy**: Easy to add new page types in future (e.g., PART, SCENE)
6. **Better Navigation**: Single active page ID, clear parent/child relationships
7. **Unified Search**: Search across all narrative content in one place