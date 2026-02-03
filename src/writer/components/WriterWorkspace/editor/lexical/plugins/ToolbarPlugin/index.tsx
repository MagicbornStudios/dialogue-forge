/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {
  $isCodeNode,
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import {
  getCodeLanguageOptions as getCodeLanguageOptionsShiki,
  getCodeThemeOptions as getCodeThemeOptionsShiki,
  normalizeCodeLanguage as normalizeCodeLanguageShiki,
} from '@lexical/code-shiki';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {$isListNode, ListNode} from '@lexical/list';
import {INSERT_EMBED_COMMAND} from '@lexical/react/LexicalAutoEmbedPlugin';
import {INSERT_HORIZONTAL_RULE_COMMAND} from '@lexical/react/LexicalHorizontalRuleNode';
import {$isHeadingNode} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import {$isTableNode, $isTableSelection} from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from '@lexical/utils';
import {
  $addUpdateTag,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  CommandPayloadType,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORIC_TAG,
  INDENT_CONTENT_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {Dispatch, useCallback, useEffect, useState} from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Code,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Link,
  Image,
  Table,
  Plus,
  Type,
  Minus,
  ChevronDown,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus as HorizontalRule,
  FileText,
  Calendar,
  Columns,
  StickyNote,
  ChevronRight,
  FunctionSquare,
  Square,
  MoreHorizontal,
  CaseLower,
  CaseUpper,
  Subscript,
  Superscript,
  Highlighter,
  Eraser,
  Palette,
} from 'lucide-react';

import {Button} from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/shared/ui/dropdown-menu';

import {useSettings} from '../../context/SettingsContext';
import {
  blockTypeToBlockName,
  useToolbarState,
} from '../../context/ToolbarContext';
import useModal from '../../hooks/useModal';
import catTypingGif from '../../images/cat-typing.gif';
import {$createStickyNode} from '../../nodes/StickyNode';
import DropdownColorPicker from '../../ui/DropdownColorPicker';
import {isKeyboardInput} from '../../utils/focusUtils';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {sanitizeUrl} from '../../utils/url';
import {EmbedConfigs} from '../AutoEmbedPlugin';
import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
import {INSERT_DATETIME_COMMAND} from '../DateTimePlugin';
import {InsertEquationDialog} from '../EquationsPlugin';
import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
import {
  INSERT_IMAGE_COMMAND,
  InsertImageDialog,
  InsertImagePayload,
} from '../ImagesPlugin';
import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
import {InsertPollDialog} from '../PollPlugin';
import {SHORTCUTS} from '../ShortcutsPlugin/shortcuts';
import {InsertTableDialog} from '../TablePlugin';
import FontSize, {parseFontSizeForToolbar} from './fontSize';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from './utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

const CODE_LANGUAGE_OPTIONS_PRISM: [string, string][] =
  getCodeLanguageOptionsPrism().filter((option) =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'swift',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

const CODE_LANGUAGE_OPTIONS_SHIKI: [string, string][] =
  getCodeLanguageOptionsShiki().filter((option) =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

const CODE_THEME_OPTIONS_SHIKI: [string, string][] =
  getCodeThemeOptionsShiki().filter((option) =>
    [
      'catppuccin-latte',
      'everforest-light',
      'github-light',
      'gruvbox-light-medium',
      'kanagawa-lotus',
      'dark-plus',
      'light-plus',
      'material-theme-lighter',
      'min-light',
      'one-light',
      'rose-pine-dawn',
      'slack-ochin',
      'snazzy-light',
      'solarized-light',
      'vitesse-light',
    ].includes(option[0]),
  );

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string;
    iconRTL: string;
    name: string;
  };
} = {
  center: {
    icon: 'center-align',
    iconRTL: 'center-align',
    name: 'Center Align',
  },
  end: {
    icon: 'right-align',
    iconRTL: 'left-align',
    name: 'End Align',
  },
  justify: {
    icon: 'justify-align',
    iconRTL: 'justify-align',
    name: 'Justify Align',
  },
  left: {
    icon: 'left-align',
    iconRTL: 'left-align',
    name: 'Left Align',
  },
  right: {
    icon: 'right-align',
    iconRTL: 'right-align',
    name: 'Right Align',
  },
  start: {
    icon: 'left-align',
    iconRTL: 'right-align',
    name: 'Start Align',
  },
};

function dropDownActiveClass(active: boolean) {
  if (active) {
    return 'active dropdown-item-active';
  } else {
    return '';
  }
}

function BlockFormatDropDown({
  editor,
  blockType,
  rootType,
  disabled = false,
}: {
  blockType: keyof typeof blockTypeToBlockName;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 gap-2"
          aria-label="Formatting options for text style">
          <Type className="h-4 w-4" />
          <span className="text-sm">{blockTypeToBlockName[blockType]}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuItem
          onClick={() => formatParagraph(editor)}
          className={blockType === 'paragraph' ? 'bg-accent' : ''}>
          <Type className="mr-2 h-4 w-4" />
          <span>Normal</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.NORMAL}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatHeading(editor, blockType, 'h1')}
          className={blockType === 'h1' ? 'bg-accent' : ''}>
          <Heading1 className="mr-2 h-4 w-4" />
          <span>Heading 1</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.HEADING1}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatHeading(editor, blockType, 'h2')}
          className={blockType === 'h2' ? 'bg-accent' : ''}>
          <Heading2 className="mr-2 h-4 w-4" />
          <span>Heading 2</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.HEADING2}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatHeading(editor, blockType, 'h3')}
          className={blockType === 'h3' ? 'bg-accent' : ''}>
          <Heading3 className="mr-2 h-4 w-4" />
          <span>Heading 3</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.HEADING3}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => formatNumberedList(editor, blockType)}
          className={blockType === 'number' ? 'bg-accent' : ''}>
          <ListOrdered className="mr-2 h-4 w-4" />
          <span>Numbered List</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.NUMBERED_LIST}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatBulletList(editor, blockType)}
          className={blockType === 'bullet' ? 'bg-accent' : ''}>
          <List className="mr-2 h-4 w-4" />
          <span>Bullet List</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.BULLET_LIST}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatCheckList(editor, blockType)}
          className={blockType === 'check' ? 'bg-accent' : ''}>
          <CheckSquare className="mr-2 h-4 w-4" />
          <span>Check List</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.CHECK_LIST}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => formatQuote(editor, blockType)}
          className={blockType === 'quote' ? 'bg-accent' : ''}>
          <Quote className="mr-2 h-4 w-4" />
          <span>Quote</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.QUOTE}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => formatCode(editor, blockType)}
          className={blockType === 'code' ? 'bg-accent' : ''}>
          <Code className="mr-2 h-4 w-4" />
          <span>Code Block</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.CODE_BLOCK}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Divider(): JSX.Element {
  return <div className="h-6 w-px bg-df-control-border mx-1" />;
}

function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}): JSX.Element {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  const buttonAriaLabel =
    style === 'font-family'
      ? 'Formatting options for font family'
      : 'Formatting options for font size';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 gap-2"
          aria-label={buttonAriaLabel}>
          {style === 'font-family' && <Type className="h-4 w-4" />}
          <span className="text-sm">{value}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[150px]">
        {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
          ([option, text]) => (
            <DropdownMenuItem
              onClick={() => handleClick(option)}
              key={option}
              className={value === option ? 'bg-accent' : ''}>
              <span>{text}</span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: ElementFormatType;
  isRTL: boolean;
  disabled: boolean;
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || 'left'];

  const getIcon = (format: ElementFormatType) => {
    switch (format) {
      case 'left':
      case 'start':
        return <AlignLeft className="h-4 w-4" />;
      case 'center':
        return <AlignCenter className="h-4 w-4" />;
      case 'right':
      case 'end':
        return <AlignRight className="h-4 w-4" />;
      case 'justify':
        return <AlignJustify className="h-4 w-4" />;
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 gap-2"
          aria-label="Formatting options for text alignment">
          {getIcon(value || 'left')}
          <span className="text-sm">{formatOption.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          }}>
          <AlignLeft className="mr-2 h-4 w-4" />
          <span>Left Align</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.LEFT_ALIGN}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          }}>
          <AlignCenter className="mr-2 h-4 w-4" />
          <span>Center Align</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.CENTER_ALIGN}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          }}>
          <AlignRight className="mr-2 h-4 w-4" />
          <span>Right Align</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.RIGHT_ALIGN}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          }}>
          <AlignJustify className="mr-2 h-4 w-4" />
          <span>Justify Align</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.JUSTIFY_ALIGN}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start');
          }}>
          {getIcon('start')}
          <span className="ml-2">Start Align</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end');
          }}>
          {getIcon('end')}
          <span className="ml-2">End Align</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          }}>
          <Outdent className="mr-2 h-4 w-4" />
          <span>Outdent</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.OUTDENT}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          }}>
          <Indent className="mr-2 h-4 w-4" />
          <span>Indent</span>
          <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.INDENT}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, (e) => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

export default function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element {
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const {toolbarState, updateToolbarState} = useToolbarState();

  const dispatchToolbarCommand = <T extends LexicalCommand<unknown>>(
    command: T,
    payload: CommandPayloadType<T> | undefined = undefined,
    skipRefocus: boolean = false,
  ) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
      }

      // Re-assert on Type so that payload can have a default param
      activeEditor.dispatchCommand(command, payload as CommandPayloadType<T>);
    });
  };

  const dispatchFormatTextCommand = (
    payload: TextFormatType,
    skipRefocus: boolean = false,
  ) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND, payload, skipRefocus);

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();

      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const {
    settings: {isCodeHighlighted, isCodeShiki},
  } = useSettings();

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted &&
                (isCodeShiki
                  ? normalizeCodeLanguageShiki(language)
                  : normalizeCodeLanguagePrism(language))) ||
                language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();

          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      // Handle buttons
      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }

      // If matchingParent is a valid node, pass it's format type
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // Update text format
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState('blockType', type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          // Update elementFormat for node selection (e.g., images)
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      {editor: activeEditor},
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          {editor: activeEditor},
        );
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  const applyStyleText = useCallback(
    (
      styles: Record<string, string>,
      skipHistoryStack?: boolean,
      skipRefocus: boolean = false,
    ) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag(SKIP_DOM_SELECTION_TAG);
          }
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? {tag: HISTORIC_TAG} : {},
      );
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText({color: value}, skipHistoryStack, skipRefocus);
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean, skipRefocus: boolean) => {
      applyStyleText(
        {'background-color': value},
        skipHistoryStack,
        skipRefocus,
      );
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl('https://'),
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );
  const onCodeThemeSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setTheme(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey],
  );
  const insertGifOnClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-df-elevated border-b border-df-control-border">
      <Button
        variant="ghost"
        size="icon"
        disabled={!toolbarState.canUndo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(UNDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'}
        className="h-8 w-8"
        aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!toolbarState.canRedo || !isEditable}
        onClick={(e) =>
          dispatchToolbarCommand(REDO_COMMAND, undefined, isKeyboardInput(e))
        }
        title={IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)'}
        className="h-8 w-8"
        aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>
      <Divider />
      {toolbarState.blockType in blockTypeToBlockName &&
        activeEditor === editor && (
          <>
            <BlockFormatDropDown
              disabled={!isEditable}
              blockType={toolbarState.blockType}
              rootType={toolbarState.rootType}
              editor={activeEditor}
            />
            <Divider />
          </>
        )}
      {toolbarState.blockType === 'code' && isCodeHighlighted ? (
        <>
          {!isCodeShiki && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!isEditable}
                  className="h-8 px-2 gap-2"
                  aria-label="Select language">
                  <Code className="h-4 w-4" />
                  <span className="text-sm">
                    {(CODE_LANGUAGE_OPTIONS_PRISM.find(
                      (opt) =>
                        opt[0] ===
                        normalizeCodeLanguagePrism(toolbarState.codeLanguage),
                    ) || ['', ''])[1]}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[150px]">
                {CODE_LANGUAGE_OPTIONS_PRISM.map(([value, name]) => {
                  return (
                    <DropdownMenuItem
                      onClick={() => onCodeLanguageSelect(value)}
                      key={value}
                      className={value === toolbarState.codeLanguage ? 'bg-accent' : ''}>
                      <span>{name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isCodeShiki && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isEditable}
                    className="h-8 px-2 gap-2"
                    aria-label="Select language">
                    <Code className="h-4 w-4" />
                    <span className="text-sm">
                      {(CODE_LANGUAGE_OPTIONS_SHIKI.find(
                        (opt) =>
                          opt[0] ===
                          normalizeCodeLanguageShiki(toolbarState.codeLanguage),
                      ) || ['', ''])[1]}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px]">
                  {CODE_LANGUAGE_OPTIONS_SHIKI.map(([value, name]) => {
                    return (
                      <DropdownMenuItem
                        onClick={() => onCodeLanguageSelect(value)}
                        key={value}
                        className={value === toolbarState.codeLanguage ? 'bg-accent' : ''}>
                        <span>{name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isEditable}
                    className="h-8 px-2 gap-2"
                    aria-label="Select theme">
                    <Code className="h-4 w-4" />
                    <span className="text-sm">
                      {(CODE_THEME_OPTIONS_SHIKI.find(
                        (opt) => opt[0] === toolbarState.codeTheme,
                      ) || ['', ''])[1]}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px]">
                  {CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => {
                    return (
                      <DropdownMenuItem
                        onClick={() => onCodeThemeSelect(value)}
                        key={value}
                        className={value === toolbarState.codeTheme ? 'bg-accent' : ''}>
                        <span>{name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </>
      ) : (
        <>
          <FontDropDown
            disabled={!isEditable}
            style={'font-family'}
            value={toolbarState.fontFamily}
            editor={activeEditor}
          />
          <Divider />
          <FontSize
            selectionFontSize={parseFontSizeForToolbar(
              toolbarState.fontSize,
            ).slice(0, -2)}
            editor={activeEditor}
            disabled={!isEditable}
          />
          <Divider />
          <Button
            variant={toolbarState.isBold ? 'secondary' : 'ghost'}
            size="icon"
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('bold', isKeyboardInput(e))
            }
            className="h-8 w-8"
            title={`Bold (${SHORTCUTS.BOLD})`}
            aria-label={`Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={toolbarState.isItalic ? 'secondary' : 'ghost'}
            size="icon"
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('italic', isKeyboardInput(e))
            }
            className="h-8 w-8"
            title={`Italic (${SHORTCUTS.ITALIC})`}
            aria-label={`Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={toolbarState.isUnderline ? 'secondary' : 'ghost'}
            size="icon"
            disabled={!isEditable}
            onClick={(e) =>
              dispatchFormatTextCommand('underline', isKeyboardInput(e))
            }
            className="h-8 w-8"
            title={`Underline (${SHORTCUTS.UNDERLINE})`}
            aria-label={`Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`}>
            <Underline className="h-4 w-4" />
          </Button>
          {canViewerSeeInsertCodeButton && (
            <Button
              variant={toolbarState.isCode ? 'secondary' : 'ghost'}
              size="icon"
              disabled={!isEditable}
              onClick={(e) =>
                dispatchFormatTextCommand('code', isKeyboardInput(e))
              }
              className="h-8 w-8"
              title={`Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`}
              aria-label="Insert code block">
              <Code className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={toolbarState.isLink ? 'secondary' : 'ghost'}
            size="icon"
            disabled={!isEditable}
            onClick={insertLink}
            className="h-8 w-8"
            aria-label="Insert link"
            title={`Insert link (${SHORTCUTS.INSERT_LINK})`}>
            <Link className="h-4 w-4" />
          </Button>
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel="Formatting text color"
            buttonIconClassName="icon font-color"
            color={toolbarState.fontColor}
            onChange={onFontColorSelect}
            title="text color"
          />
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel="Formatting background color"
            buttonIconClassName="icon bg-color"
            color={toolbarState.bgColor}
            onChange={onBgColorSelect}
            title="bg color"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!isEditable}
                className="h-8 w-8"
                aria-label="Formatting options for additional text styles">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('lowercase', isKeyboardInput(e))
                }
                className={toolbarState.isLowercase ? 'bg-accent' : ''}>
                <CaseLower className="mr-2 h-4 w-4" />
                <span>Lowercase</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.LOWERCASE}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('uppercase', isKeyboardInput(e))
                }
                className={toolbarState.isUppercase ? 'bg-accent' : ''}>
                <CaseUpper className="mr-2 h-4 w-4" />
                <span>Uppercase</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.UPPERCASE}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('capitalize', isKeyboardInput(e))
                }
                className={toolbarState.isCapitalize ? 'bg-accent' : ''}>
                <Type className="mr-2 h-4 w-4" />
                <span>Capitalize</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.CAPITALIZE}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('strikethrough', isKeyboardInput(e))
                }
                className={toolbarState.isStrikethrough ? 'bg-accent' : ''}>
                <Strikethrough className="mr-2 h-4 w-4" />
                <span>Strikethrough</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.STRIKETHROUGH}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('subscript', isKeyboardInput(e))
                }
                className={toolbarState.isSubscript ? 'bg-accent' : ''}>
                <Subscript className="mr-2 h-4 w-4" />
                <span>Subscript</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.SUBSCRIPT}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('superscript', isKeyboardInput(e))
                }
                className={toolbarState.isSuperscript ? 'bg-accent' : ''}>
                <Superscript className="mr-2 h-4 w-4" />
                <span>Superscript</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.SUPERSCRIPT}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) =>
                  dispatchFormatTextCommand('highlight', isKeyboardInput(e))
                }
                className={toolbarState.isHighlight ? 'bg-accent' : ''}>
                <Highlighter className="mr-2 h-4 w-4" />
                <span>Highlight</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => clearFormatting(activeEditor, isKeyboardInput(e))}
                title="Clear text formatting"
                aria-label="Clear all text formatting">
                <Eraser className="mr-2 h-4 w-4" />
                <span>Clear Formatting</span>
                <span className="ml-auto text-xs text-muted-foreground">{SHORTCUTS.CLEAR_FORMATTING}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canViewerSeeInsertDropdown && (
            <>
              <Divider />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isEditable}
                    className="h-8 px-2 gap-2"
                    aria-label="Insert specialized editor node">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Insert</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[200px]">
                  <DropdownMenuItem
                    onClick={() =>
                      dispatchToolbarCommand(INSERT_HORIZONTAL_RULE_COMMAND)
                    }>
                    <HorizontalRule className="mr-2 h-4 w-4" />
                    <span>Horizontal Rule</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => dispatchToolbarCommand(INSERT_PAGE_BREAK)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Page Break</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      showModal('Insert Image', (onClose) => (
                        <InsertImageDialog
                          activeEditor={activeEditor}
                          onClose={onClose}
                        />
                      ));
                    }}>
                    <Image className="mr-2 h-4 w-4" />
                    <span>Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      insertGifOnClick({
                        altText: 'Cat typing on a laptop',
                        src:
                          typeof catTypingGif === 'string'
                            ? catTypingGif
                            : catTypingGif.src,
                      })
                    }>
                    <Image className="mr-2 h-4 w-4" />
                    <span>GIF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      dispatchToolbarCommand(INSERT_EXCALIDRAW_COMMAND)
                    }>
                    <Square className="mr-2 h-4 w-4" />
                    <span>Excalidraw</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      showModal('Insert Table', (onClose) => (
                        <InsertTableDialog
                          activeEditor={activeEditor}
                          onClose={onClose}
                        />
                      ));
                    }}>
                    <Table className="mr-2 h-4 w-4" />
                    <span>Table</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      showModal('Insert Poll', (onClose) => (
                        <InsertPollDialog
                          activeEditor={activeEditor}
                          onClose={onClose}
                        />
                      ));
                    }}>
                    <Square className="mr-2 h-4 w-4" />
                    <span>Poll</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      showModal('Insert Columns Layout', (onClose) => (
                        <InsertLayoutDialog
                          activeEditor={activeEditor}
                          onClose={onClose}
                        />
                      ));
                    }}>
                    <Columns className="mr-2 h-4 w-4" />
                    <span>Columns Layout</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      showModal('Insert Equation', (onClose) => (
                        <InsertEquationDialog
                          activeEditor={activeEditor}
                          onClose={onClose}
                        />
                      ));
                    }}>
                    <FunctionSquare className="mr-2 h-4 w-4" />
                    <span>Equation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      editor.update(() => {
                        const root = $getRoot();
                        const stickyNode = $createStickyNode(0, 0);
                        root.append(stickyNode);
                      });
                    }}>
                    <StickyNote className="mr-2 h-4 w-4" />
                    <span>Sticky Note</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND)
                    }>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    <span>Collapsible container</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const dateTime = new Date();
                      dateTime.setHours(0, 0, 0, 0);
                      dispatchToolbarCommand(INSERT_DATETIME_COMMAND, {dateTime});
                    }}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Date</span>
                  </DropdownMenuItem>
                  {EmbedConfigs.map((embedConfig) => (
                    <DropdownMenuItem
                      key={embedConfig.type}
                      onClick={() =>
                        dispatchToolbarCommand(
                          INSERT_EMBED_COMMAND,
                          embedConfig.type,
                        )
                      }>
                      <span className="mr-2">{embedConfig.icon}</span>
                      <span>{embedConfig.contentName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </>
      )}
      <Divider />
      <ElementFormatDropdown
        disabled={!isEditable}
        value={toolbarState.elementFormat}
        editor={activeEditor}
        isRTL={toolbarState.isRTL}
      />

      {modal}
    </div>
  );
}
