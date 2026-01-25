import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FORMAT_TEXT_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  $createTextNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  $isRootNode,
  type LexicalNode,
  type LexicalEditor,
} from 'lexical';
import {
  $createHeadingNode,
  $isHeadingNode,
  $createQuoteNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import {
  INSERT_TABLE_COMMAND,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import {
  OPEN_EMBED_DIALOG_COMMAND,
  OPEN_MEDIA_PICKER_COMMAND,
} from '@/writer/components/WriterWorkspace/editor/lexical/plugins/MediaPlugin';
import { WRITER_MEDIA_KIND } from '@/writer/lib/data-adapter/media';
import {
  ChevronDown,
  Mic,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  Minus,
  ImagePlus,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  FileCode,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { $isParagraphNode } from 'lexical';

// Toolbar styling using app theme
const toolbarItemBase = 'toolbar-item flex items-center justify-center h-8 min-w-[32px] px-2 rounded border border-df-control-border bg-df-control-bg text-df-text-secondary hover:bg-df-control-hover hover:text-df-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-df-control-bg disabled:hover:text-df-text-secondary';
const toolbarItemSpaced = `${toolbarItemBase} mr-1`;
const dividerClass = 'divider w-px h-6 bg-df-node-border mx-1';

interface ToolbarState {
  canUndo: boolean;
  canRedo: boolean;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isCode: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  blockType: string;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  bgColor: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    canUndo: false,
    canRedo: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isCode: false,
    isStrikethrough: false,
    isSubscript: false,
    isSuperscript: false,
    blockType: 'paragraph',
    fontSize: 15,
    fontFamily: 'Arial',
    textColor: '#000000',
    bgColor: '#ffffff',
    alignment: 'left',
  });
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const updateListenerRef = useRef<(() => void) | null>(null);
  const undoListenerRef = useRef<(() => void) | null>(null);
  const redoListenerRef = useRef<(() => void) | null>(null);

  const setAiSelection = useWriterWorkspaceStore((state) => state.actions.setAiSelection);
  const proposeAiEdits = useWriterWorkspaceStore((state) => state.actions.proposeAiEdits);
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageMap = useWriterWorkspaceStore((state) => state.pageMap);
  const draft = useWriterWorkspaceStore((state) =>
    activePageId ? state.drafts[activePageId] ?? null : null
  );
  const activePage = activePageId ? pageMap.get(activePageId) ?? null : null;

  // Update toolbar state from editor
  const updateToolbar = useCallback(() => {
    try {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          // Keep previous state when no selection
          return;
        }

        const nodes = selection.getNodes();
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let isCode = false;
        let isStrikethrough = false;
        let isSubscript = false;
        let isSuperscript = false;

        for (const node of nodes) {
          if ($isTextNode(node)) {
            const format = node.getFormat();
            isBold = isBold || (format & 1) === 1;
            isItalic = isItalic || (format & 2) === 2;
            isUnderline = isUnderline || (format & 4) === 4;
            isStrikethrough = isStrikethrough || (format & 8) === 8;
            isSubscript = isSubscript || (format & 16) === 16;
            isSuperscript = isSuperscript || (format & 32) === 32;
            isCode = isCode || (format & 64) === 64;
          }
        }

        // Get block type - safely handle empty/invalid states
        let blockType = 'paragraph';
        try {
          const anchorNode = selection.anchor.getNode();
          
          // Don't try to get top-level element if anchor is root
          if ($isRootNode(anchorNode)) {
            blockType = 'paragraph';
          } else {
            const topLevelNode = anchorNode.getTopLevelElement();
            if (topLevelNode) {
              if ($isHeadingNode(topLevelNode)) {
                blockType = topLevelNode.getTag();
              } else if ($isParagraphNode(topLevelNode)) {
                blockType = 'paragraph';
              } else if ($isListNode(topLevelNode)) {
                blockType = topLevelNode.getListType();
              } else if ($isQuoteNode(topLevelNode)) {
                blockType = 'quote';
              } else if ($isCodeNode(topLevelNode)) {
                blockType = 'code';
              }
            }
          }
        } catch (error) {
          // If we can't determine block type, default to paragraph
          blockType = 'paragraph';
        }

        setToolbarState((prev) => ({
          ...prev,
          isBold,
          isItalic,
          isUnderline,
          isCode,
          isStrikethrough,
          isSubscript,
          isSuperscript,
          blockType,
        }));
      });
    } catch (error) {
      // Silently handle errors during editor state transitions
      // This can happen when switching pages - the editor state might be temporarily invalid
      console.debug('Toolbar update error (expected during page transitions):', error);
    }
  }, [editor]);

  // Register update listener with proper cleanup
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });

    updateListenerRef.current = removeUpdateListener;

    return () => {
      if (updateListenerRef.current) {
        updateListenerRef.current();
        updateListenerRef.current = null;
      }
    };
  }, [editor, updateToolbar]);

  // Track undo/redo state by listening to history changes
  useEffect(() => {
    // Update undo/redo state after each editor update
    const removeUpdateListener = editor.registerUpdateListener(() => {
      // HistoryPlugin will update the editor state, we'll track it via update listener
      updateToolbar();
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor, updateToolbar]);

  // Speech-to-text setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(transcript);
          } else {
            const root = $getRoot();
            const lastChild = root.getLastChild();
            if ($isParagraphNode(lastChild)) {
              // Append to existing paragraph
              const textNode = $createTextNode(transcript);
              lastChild.append(textNode);
            } else {
              // Create new paragraph
              const paragraph = $createParagraphNode();
              const textNode = $createTextNode(transcript);
              paragraph.append(textNode);
              root.append(paragraph);
            }
          }
        });
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [editor]);

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const toggleSpeechToText = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };


  const getListType = (node: LexicalNode | null) => {
    let currentNode: LexicalNode | null = node;
    while (currentNode) {
      if ($isListNode(currentNode)) {
        return currentNode.getListType();
      }
      currentNode = currentNode.getParent();
    }
    return null;
  };

  const toggleList = (
    listType: 'bullet' | 'number' | 'check',
    command:
      | typeof INSERT_UNORDERED_LIST_COMMAND
      | typeof INSERT_ORDERED_LIST_COMMAND
      | typeof INSERT_CHECK_LIST_COMMAND
  ) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      const isInList = selection
        .getNodes()
        .some((node) => getListType(node) === listType);
      editor.dispatchCommand(isInList ? REMOVE_LIST_COMMAND : command, undefined);
    });
  };

  const insertHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      
      try {
        const anchorNode = selection.anchor.getNode();
        
        // Don't try to get top-level element if anchor is root
        if ($isRootNode(anchorNode)) {
          return;
        }
        
        const topLevelNode = anchorNode.getTopLevelElement();
        if (!topLevelNode) {
          return;
        }
        
        if ($isHeadingNode(topLevelNode) && topLevelNode.getTag() === tag) {
          const paragraph = $createParagraphNode();
          const children = topLevelNode.getChildren();
          paragraph.append(...children);
          topLevelNode.replace(paragraph);
          paragraph.selectEnd();
        } else {
          const heading = $createHeadingNode(tag);
          const children = topLevelNode.getChildren();
          heading.append(...children);
          topLevelNode.replace(heading);
          heading.selectEnd();
        }
      } catch (error) {
        // Silently handle errors - editor might be in transition
        console.debug('Insert heading error (expected during transitions):', error);
      }
    });
  };

  const convertToBlockType = (targetType: 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'check' | 'quote' | 'code') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      
      try {
        const anchorNode = selection.anchor.getNode();
        if ($isRootNode(anchorNode)) {
          return;
        }
        
        const topLevelNode = anchorNode.getTopLevelElement();
        if (!topLevelNode) {
          return;
        }
        
        const children = topLevelNode.getChildren();
        
        if (targetType === 'paragraph') {
          const paragraph = $createParagraphNode();
          paragraph.append(...children);
          topLevelNode.replace(paragraph);
          paragraph.selectEnd();
        } else if (targetType === 'h1' || targetType === 'h2' || targetType === 'h3') {
          const heading = $createHeadingNode(targetType);
          heading.append(...children);
          topLevelNode.replace(heading);
          heading.selectEnd();
        } else if (targetType === 'quote') {
          const quote = $createQuoteNode();
          quote.append(...children);
          topLevelNode.replace(quote);
          quote.selectEnd();
        } else if (targetType === 'code') {
          const code = $createCodeNode();
          code.append(...children);
          topLevelNode.replace(code);
          code.selectEnd();
        } else if (targetType === 'bullet' || targetType === 'number' || targetType === 'check') {
          // For lists, use the existing toggleList function
          const command = targetType === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND :
                         targetType === 'number' ? INSERT_ORDERED_LIST_COMMAND :
                         INSERT_CHECK_LIST_COMMAND;
          toggleList(targetType, command);
        }
      } catch (error) {
        console.debug('Convert block type error (expected during transitions):', error);
      }
    });
  };


  const onRewriteSelection = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setAiSelection(null);
        return;
      }
      const selectionText = selection.getTextContent();
      const fullText = $getRoot().getTextContent();
      if (!selectionText) {
        setAiSelection(null);
        return;
      }
      const start = fullText.indexOf(selectionText);
      if (start === -1) {
        setAiSelection(null);
        return;
      }
      setAiSelection({ start, end: start + selectionText.length });
    });

    void proposeAiEdits();
  };

  return (
    <div className="toolbar flex items-center gap-1 border-b border-df-node-border bg-df-elevated px-2 py-1.5 overflow-x-auto shadow-sm">
      {/* Undo/Redo */}
      <button
        type="button"
        className={toolbarItemSpaced}
        onClick={handleUndo}
        disabled={!toolbarState.canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={toolbarItemBase}
        onClick={handleRedo}
        disabled={!toolbarState.canRedo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <Redo2 className="w-4 h-4" />
      </button>
      <div className={dividerClass} />

      {/* Block Type - Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${toolbarItemBase} block-controls`}
            aria-label="Formatting options for text style"
          >
            <Type className="w-4 h-4" />
            <span className="text dropdown-button-text text-xs ml-1 whitespace-nowrap">
              {toolbarState.blockType === 'paragraph' ? 'Normal' : 
               toolbarState.blockType === 'bullet' ? 'Bulleted List' :
               toolbarState.blockType === 'number' ? 'Numbered List' :
               toolbarState.blockType === 'check' ? 'Check List' :
               toolbarState.blockType === 'quote' ? 'Quote' :
               toolbarState.blockType === 'code' ? 'Code Block' :
               toolbarState.blockType.toUpperCase()}
            </span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem
            onClick={() => convertToBlockType('paragraph')}
            className={toolbarState.blockType === 'paragraph' ? 'bg-accent' : ''}
          >
            <List className="mr-2 h-4 w-4" />
            Normal
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+0</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('h1')}
            className={toolbarState.blockType === 'h1' ? 'bg-accent' : ''}
          >
            <Type className="mr-2 h-4 w-4" />
            H1 Heading 1
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+1</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('h2')}
            className={toolbarState.blockType === 'h2' ? 'bg-accent' : ''}
          >
            <Type className="mr-2 h-4 w-4" />
            H2 Heading 2
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+2</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('h3')}
            className={toolbarState.blockType === 'h3' ? 'bg-accent' : ''}
          >
            <Type className="mr-2 h-4 w-4" />
            H3 Heading 3
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+3</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => convertToBlockType('number')}
            className={toolbarState.blockType === 'number' ? 'bg-accent' : ''}
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            Numbered List
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+7</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('bullet')}
            className={toolbarState.blockType === 'bullet' ? 'bg-accent' : ''}
          >
            <List className="mr-2 h-4 w-4" />
            Bullet List
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+8</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('check')}
            className={toolbarState.blockType === 'check' ? 'bg-accent' : ''}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Check List
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+9</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => convertToBlockType('quote')}
            className={toolbarState.blockType === 'quote' ? 'bg-accent' : ''}
          >
            <Quote className="mr-2 h-4 w-4" />
            Quote
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+Q</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => convertToBlockType('code')}
            className={toolbarState.blockType === 'code' ? 'bg-accent' : ''}
          >
            <FileCode className="mr-2 h-4 w-4" />
            Code Block
            <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+C</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className={dividerClass} />

      {/* Font Family - Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${toolbarItemBase} font-family`}
            aria-label="Formatting options for font family"
          >
            <Type className="w-4 h-4" />
            <span className="text dropdown-button-text text-xs ml-1">{toolbarState.fontFamily}</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          {['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Trebuchet MS', 'Verdana'].map((font) => (
            <DropdownMenuItem
              key={font}
              onClick={() => {
                // TODO: Apply font family to selection
                setToolbarState((prev) => ({ ...prev, fontFamily: font }));
              }}
              className={toolbarState.fontFamily === font ? 'bg-accent' : ''}
            >
              <span style={{ fontFamily: font }}>{font}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className={dividerClass} />

      {/* Font Size */}
      <button
        type="button"
        className={`${toolbarItemBase} font-decrement`}
        onClick={() => setToolbarState((prev) => ({ ...prev, fontSize: Math.max(8, prev.fontSize - 1) }))}
        aria-label="Decrease font size"
        title="Decrease font size (Ctrl+Shift+,)"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        className="toolbar-item font-size-input h-8 w-12 px-1 text-xs text-center border border-df-control-border rounded bg-df-control-bg text-df-text-primary"
        min="8"
        max="72"
        value={toolbarState.fontSize}
        onChange={(e) => setToolbarState((prev) => ({ ...prev, fontSize: Math.max(8, Math.min(72, parseInt(e.target.value) || 15)) }))}
        title="Font size"
      />
      <button
        type="button"
        className={`${toolbarItemBase} font-increment`}
        onClick={() => setToolbarState((prev) => ({ ...prev, fontSize: Math.min(72, prev.fontSize + 1) }))}
        aria-label="Increase font size"
        title="Increase font size (Ctrl+Shift+.)"
      >
        <Plus className="w-4 h-4" />
      </button>
      <div className={dividerClass} />

      {/* Text Formatting */}
      <button
        type="button"
        className={`${toolbarItemSpaced} ${toolbarState.isBold ? 'bg-df-control-active text-df-text-primary' : ''}`}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Bold (Ctrl+B)"
        aria-label="Format text as bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={`${toolbarItemSpaced} ${toolbarState.isItalic ? 'bg-df-control-active text-df-text-primary' : ''}`}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Italic (Ctrl+I)"
        aria-label="Format text as italics"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={`${toolbarItemSpaced} ${toolbarState.isUnderline ? 'bg-df-control-active text-df-text-primary' : ''}`}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        title="Underline (Ctrl+U)"
        aria-label="Format text to underlined"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={`${toolbarItemSpaced} ${toolbarState.isCode ? 'bg-df-control-active text-df-text-primary' : ''}`}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        title="Insert code block (Ctrl+Shift+C)"
        aria-label="Insert code block"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={toolbarItemSpaced}
        onClick={() => editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, { kind: WRITER_MEDIA_KIND.IMAGE })}
        aria-label="Insert link"
        title="Insert link (Ctrl+K)"
      >
        <Link className="w-4 h-4" />
      </button>
      
      {/* Color Pickers - Placeholder for now */}
      <button
        type="button"
        className={`${toolbarItemBase} color-picker`}
        aria-label="Formatting text color"
        title="Text color (coming soon)"
      >
        <Type className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      <button
        type="button"
        className={`${toolbarItemBase} color-picker`}
        aria-label="Formatting background color"
        title="Background color (coming soon)"
      >
        <Type className="w-4 h-4" />
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      <div className={dividerClass} />

      {/* Insert Menu */}
      <button
        type="button"
        className={`${toolbarItemSpaced}`}
        aria-label="Insert specialized editor node"
        onClick={() => {
          // Toggle insert menu - for now just insert image
          editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, { kind: WRITER_MEDIA_KIND.IMAGE });
        }}
      >
        <ImagePlus className="w-4 h-4" />
        <span className="text dropdown-button-text text-xs ml-1">Insert</span>
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      <div className={dividerClass} />

      {/* Alignment */}
      <button
        type="button"
        className={`${toolbarItemSpaced} alignment`}
        aria-label="Formatting options for text alignment"
        onClick={() => {
          // Cycle through alignments
          const nextAlignment = toolbarState.alignment === 'left' ? 'center' : 
                                toolbarState.alignment === 'center' ? 'right' :
                                toolbarState.alignment === 'right' ? 'justify' : 'left';
          setToolbarState((prev) => ({ ...prev, alignment: nextAlignment }));
        }}
      >
        <span className="flex items-center whitespace-nowrap">
          {toolbarState.alignment === 'left' && <AlignLeft className="w-4 h-4" />}
          {toolbarState.alignment === 'center' && <AlignCenter className="w-4 h-4" />}
          {toolbarState.alignment === 'right' && <AlignRight className="w-4 h-4" />}
          {toolbarState.alignment === 'justify' && <AlignJustify className="w-4 h-4" />}
          <span className="text dropdown-button-text text-xs ml-1">
            {toolbarState.alignment === 'left' ? 'Left' : toolbarState.alignment === 'center' ? 'Center' : toolbarState.alignment === 'right' ? 'Right' : 'Justify'}
          </span>
        </span>
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      <div className={dividerClass} />

      {/* Speech-to-Text */}
      <button
        type="button"
        className={`${toolbarItemSpaced} ${isRecording ? 'bg-df-error-bg text-df-error' : ''}`}
        onClick={toggleSpeechToText}
        aria-label="Speech to text"
        title="Speech to text"
        disabled={!recognitionRef.current}
      >
        <Mic className="w-4 h-4" />
      </button>
    </div>
  );
}
