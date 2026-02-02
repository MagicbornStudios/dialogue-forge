/**
 * Unified Narrative Page Types - replaces ForgeAct, ForgeChapter, ForgePage
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

/**
 * Unified ForgePage type - replaces ForgeAct, ForgeChapter, and the old ForgePage
 *
 * Internal library type matching PayloadCMS Pages collection structure.
 * The library itself remains independent and portable.
 */
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
  project: number;
  parent?: number | null; // References another Page (null for ACT)
  narrativeGraph?: number | null; // Forge graph ID this page belongs to
  dialogueGraph?: number | null; // Only for PAGE type
};

// Legacy type aliases for backward compatibility during migration
// TODO: Remove these once all code is updated to use ForgePage with pageType
export type ForgeAct = ForgePage & { pageType: 'ACT' };
export type ForgeChapter = ForgePage & { pageType: 'CHAPTER' };

/**
 * Helper type guards
 */
export function isActPage(page: ForgePage): page is ForgeAct {
  return page.pageType === PAGE_TYPE.ACT;
}

export function isChapterPage(page: ForgePage): page is ForgeChapter {
  return page.pageType === PAGE_TYPE.CHAPTER;
}

export function isContentPage(page: ForgePage): boolean {
  return page.pageType === PAGE_TYPE.PAGE;
}

/**
 * Narrative hierarchy helper type
 */
export type NarrativeHierarchy = {
  acts: Array<{
    page: ForgePage; // ACT page
    chapters: Array<{
      page: ForgePage; // CHAPTER page
      pages: ForgePage[]; // PAGE pages
    }>;
  }>;
};

/**
 * Build narrative hierarchy from flat pages array
 */
export function buildNarrativeHierarchy(pages: ForgePage[]): NarrativeHierarchy {
  if (!pages || !Array.isArray(pages)) {
    return { acts: [] };
  }

  const acts = pages
    .filter((page) => page && page.pageType === PAGE_TYPE.ACT)
    .sort((a, b) => a.order - b.order);

  return {
    acts: acts.map((act) => ({
      page: act,
      chapters: pages
        .filter((page) => page && page.pageType === PAGE_TYPE.CHAPTER && page.parent === act.id)
        .sort((a, b) => a.order - b.order)
        .map((chapter) => ({
          page: chapter,
          pages: pages
            .filter((page) => page && page.pageType === PAGE_TYPE.PAGE && page.parent === chapter.id)
            .sort((a, b) => a.order - b.order),
        })),
    })),
  };
}
