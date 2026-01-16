import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  type LexicalNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
  MenuOption,
  type MenuTextMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import {
  OPEN_EMBED_DIALOG_COMMAND,
  OPEN_MEDIA_PICKER_COMMAND,
} from '@/writer/components/WriterWorkspace/editor/lexical/plugins/MediaPlugin';
import { WRITER_MEDIA_KIND } from '@/writer/lib/data-adapter/media';

type SlashCommandAction = () => void;

class SlashCommandOption extends MenuOption {
  title: string;
  description?: string;
  keywords: string[];
  onSelect: SlashCommandAction;

  constructor({
    title,
    description,
    keywords,
    onSelect,
  }: {
    title: string;
    description?: string;
    keywords: string[];
    onSelect: SlashCommandAction;
  }) {
    super(title);
    this.title = title;
    this.description = description;
    this.keywords = keywords;
    this.onSelect = onSelect;
  }
}

const emptyOrWhitespace = (value: string) => value.trim().length === 0;

const getTopLevelBlock = (node: LexicalNode | null) => {
  if (!node) {
    return null;
  }
  return node.getTopLevelElementOrThrow();
};

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);

  const checkForSlash = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const insertBlock = (createNode: () => LexicalNode) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      const activeBlock = getTopLevelBlock(selection.anchor.getNode());
      const newNode = createNode();
      selection.insertNodes([newNode]);
      if (activeBlock && activeBlock.isAttached()) {
        activeBlock.remove();
      }
      newNode.selectEnd();
    });
  };

  const insertParagraph = () =>
    insertBlock(() => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(''));
      return paragraph;
    });

  const insertHeading = (tag: 'h1' | 'h2' | 'h3') =>
    insertBlock(() => {
      const heading = $createHeadingNode(tag);
      heading.append($createTextNode(''));
      return heading;
    });

  const insertQuote = () =>
    insertBlock(() => {
      const quote = $createQuoteNode();
      quote.append($createTextNode(''));
      return quote;
    });

  const insertCallout = () =>
    insertBlock(() => {
      const callout = $createQuoteNode();
      callout.append($createTextNode('Callout'));
      return callout;
    });

  const insertCodeBlock = () =>
    insertBlock(() => {
      const code = $createCodeNode();
      code.append($createTextNode(''));
      return code;
    });

  const insertDivider = () =>
    insertBlock(() => {
      const divider = $createParagraphNode();
      divider.append($createTextNode('---'));
      return divider;
    });

  const insertTable = () =>
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: '3', columns: '3' });

  const insertImage = () =>
    editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, {
      kind: WRITER_MEDIA_KIND.IMAGE,
    });

  const insertFile = () =>
    editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, {
      kind: WRITER_MEDIA_KIND.FILE,
    });

  const insertEmbed = () =>
    editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, {});

  const baseOptions = useMemo(
    () => [
      new SlashCommandOption({
        title: 'Paragraph',
        description: 'Plain text block',
        keywords: ['paragraph', 'text', 'body'],
        onSelect: insertParagraph,
      }),
      new SlashCommandOption({
        title: 'Heading 1',
        description: 'Large section heading',
        keywords: ['heading', 'h1', 'title'],
        onSelect: () => insertHeading('h1'),
      }),
      new SlashCommandOption({
        title: 'Heading 2',
        description: 'Medium section heading',
        keywords: ['heading', 'h2', 'subtitle'],
        onSelect: () => insertHeading('h2'),
      }),
      new SlashCommandOption({
        title: 'Heading 3',
        description: 'Small section heading',
        keywords: ['heading', 'h3'],
        onSelect: () => insertHeading('h3'),
      }),
      new SlashCommandOption({
        title: 'Bulleted list',
        description: 'Start a bulleted list',
        keywords: ['list', 'bullets'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new SlashCommandOption({
        title: 'Ordered list',
        description: 'Start a numbered list',
        keywords: ['list', 'ordered', 'numbered'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new SlashCommandOption({
        title: 'Checklist',
        description: 'Checklist items',
        keywords: ['list', 'check', 'todo'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new SlashCommandOption({
        title: 'Quote',
        description: 'Pull quote block',
        keywords: ['quote', 'blockquote'],
        onSelect: insertQuote,
      }),
      new SlashCommandOption({
        title: 'Callout',
        description: 'Highlighted callout block',
        keywords: ['callout', 'note', 'highlight'],
        onSelect: insertCallout,
      }),
      new SlashCommandOption({
        title: 'Code block',
        description: 'Monospace code block',
        keywords: ['code', 'snippet'],
        onSelect: insertCodeBlock,
      }),
      new SlashCommandOption({
        title: 'Divider',
        description: 'Horizontal divider',
        keywords: ['divider', 'rule', 'separator'],
        onSelect: insertDivider,
      }),
      new SlashCommandOption({
        title: 'Table',
        description: 'Insert a table',
        keywords: ['table', 'grid'],
        onSelect: insertTable,
      }),
      new SlashCommandOption({
        title: 'Image',
        description: 'Insert an image',
        keywords: ['image', 'photo', 'media'],
        onSelect: insertImage,
      }),
      new SlashCommandOption({
        title: 'File attachment',
        description: 'Upload a file',
        keywords: ['file', 'attachment', 'upload'],
        onSelect: insertFile,
      }),
      new SlashCommandOption({
        title: 'Embed',
        description: 'Embed an external URL',
        keywords: ['embed', 'video', 'iframe'],
        onSelect: insertEmbed,
      }),
    ],
    [editor]
  );

  const options = useMemo(() => {
    if (query === null || emptyOrWhitespace(query)) {
      return baseOptions;
    }
    const lowered = query.toLowerCase();
    return baseOptions.filter(
      (option) =>
        option.title.toLowerCase().includes(lowered) ||
        option.keywords.some((keyword) => keyword.includes(lowered))
    );
  }, [baseOptions, query]);

  const onSelectOption = (
    selectedOption: SlashCommandOption,
    nodeToRemove: LexicalNode | null,
    closeMenu: () => void
  ) => {
    editor.update(() => {
      if (nodeToRemove) {
        nodeToRemove.remove();
      }
    });
    selectedOption.onSelect();
    closeMenu();
  };

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      triggerFn={(text, editor) => {
        const match = checkForSlash(text, editor) as MenuTextMatch | null;
        return match;
      }}
      options={options}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp }) => {
        if (!anchorElementRef.current) {
          return null;
        }

        return createPortal(
          <div className="z-50 min-w-[240px] rounded-lg border border-df-node-border bg-df-surface-2 p-1 shadow-lg">
            {options.map((option, index) => (
              <button
                key={option.key}
                type="button"
                className={`flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left text-xs transition ${
                  selectedIndex === index
                    ? 'bg-df-control-bg text-df-text-primary'
                    : 'text-df-text-secondary hover:bg-df-control-bg hover:text-df-text-primary'
                }`}
                onClick={() => selectOptionAndCleanUp(option)}
              >
                <span className="text-[12px] font-medium text-df-text-primary">
                  {option.title}
                </span>
                {option.description ? (
                  <span className="text-[11px] text-df-text-tertiary">
                    {option.description}
                  </span>
                ) : null}
              </button>
            ))}
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
