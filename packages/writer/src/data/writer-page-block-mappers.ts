import { PAGE_TYPE } from '@magicborn/shared/types/narrative';
import type { ResolvedSerializedContent } from '@magicborn/shared/types/page-contract-v2';
import type {
  WriterBlockDoc,
  WriterPageContractV2,
  WriterPageDoc,
} from './writer-types';

type PayloadBlockLike = {
  id: number;
  page: number | { id?: number };
  parent_block?: number | { id?: number } | null;
  type: string;
  position: number;
  payload?: Record<string, unknown> | null;
  archived?: boolean;
  in_trash?: boolean;
  has_children?: boolean;
};

const EMPTY_LEXICAL_SERIALIZED = JSON.stringify({
  root: {
    children: [],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

const toId = (
  value: number | { id?: number } | null | undefined,
  field: string
): number | null => {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value.id === 'number') return value.id;
  throw new Error(`Expected numeric id for ${field}`);
};

const buildLexicalFromPlainText = (text: string): string =>
  JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });

export function legacyPageToPageContractV2(page: WriterPageDoc): WriterPageContractV2 {
  return {
    id: page.id,
    project: page.project,
    parent:
      page.parent == null
        ? { type: 'workspace', workspace: true }
        : { type: 'page_id', page_id: page.parent },
    properties: {
      title: page.title,
      summary: page.summary ?? null,
    },
    archived: page.archivedAt != null,
    in_trash: false,
    legacy: {
      pageType: page.pageType,
      title: page.title,
      summary: page.summary ?? null,
      order: page.order,
      narrativeGraph: page.narrativeGraph ?? null,
      dialogueGraph: page.dialogueGraph ?? null,
      bookHeading: page.bookHeading ?? null,
      bookBody: page.bookBody ?? null,
      content: page.content ?? null,
    },
  };
}

export function legacyPageToSeedBlockContracts(page: WriterPageDoc): WriterBlockDoc[] {
  if (!page.bookBody || !page.bookBody.trim()) {
    return [];
  }
  return [
    {
      id: 0,
      page: page.id,
      parent_block: null,
      type: page.pageType === PAGE_TYPE.PAGE ? 'paragraph' : 'heading_1',
      position: 0,
      payload: {
        lexicalSerialized: page.bookBody,
      },
      archived: false,
      in_trash: false,
      has_children: false,
    },
  ];
}

export function mapPayloadBlockToWriterBlockDoc(block: PayloadBlockLike): WriterBlockDoc {
  return {
    id: block.id,
    page: toId(block.page, 'block.page') ?? 0,
    parent_block: toId(block.parent_block, 'block.parent_block'),
    type: block.type,
    position: block.position,
    payload: block.payload ?? {},
    archived: block.archived ?? false,
    in_trash: block.in_trash ?? false,
    has_children: block.has_children ?? false,
  };
}

export function canonicalBlocksToSerializedContent(blocks: WriterBlockDoc[]): string | null {
  if (!blocks.length) return null;
  const ordered = [...blocks].sort((a, b) => a.position - b.position);

  for (const block of ordered) {
    const lexicalSerialized = block.payload?.lexicalSerialized;
    if (typeof lexicalSerialized === 'string' && lexicalSerialized.trim()) {
      return lexicalSerialized;
    }
  }

  const plainText = ordered
    .map((block) => {
      const text = block.payload?.text;
      if (typeof text === 'string' && text.trim()) return text;
      const richText = block.payload?.rich_text;
      return Array.isArray(richText)
        ? richText
            .map((item) =>
              typeof item === 'string'
                ? item
                : typeof item === 'object' && item !== null && 'plain_text' in item
                  ? String((item as { plain_text?: unknown }).plain_text ?? '')
                  : ''
            )
            .join('')
        : '';
    })
    .filter(Boolean)
    .join('\n\n');

  if (!plainText) return EMPTY_LEXICAL_SERIALIZED;
  return buildLexicalFromPlainText(plainText);
}

export function resolveSerializedContentFromBlocksOrLegacy(
  blocks: WriterBlockDoc[] | null | undefined,
  legacySerialized: string | null | undefined
): ResolvedSerializedContent {
  if (Array.isArray(blocks) && blocks.length > 0) {
    const serialized = canonicalBlocksToSerializedContent(blocks);
    return { serialized, source: 'blocks' };
  }
  if (legacySerialized && legacySerialized.trim()) {
    return { serialized: legacySerialized, source: 'legacy' };
  }
  return { serialized: null, source: 'empty' };
}
