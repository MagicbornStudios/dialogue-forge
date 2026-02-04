/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {NodeKey} from 'lexical';
import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  ElementNode,
  LexicalNode,
} from 'lexical';
import {useCallback, useEffect, useMemo, useRef, useState, type RefObject} from 'react';
import * as ReactDOM from 'react-dom';
import {useDraggable} from '@neodrag/react';

import useModal from '../../hooks/useModal';
import {
  ComponentPickerMenuItem,
  ComponentPickerOption,
  getBaseOptions,
  getDynamicOptions,
} from '../ComponentPickerPlugin';
import { Input } from '@magicborn/shared/ui/input';
import { GripVertical, Plus } from 'lucide-react';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

type PickerState = {
  insertBefore: boolean;
  targetNodeKey: NodeKey;
};

type BlockHandle = {
  nodeKey: NodeKey;
  element: HTMLElement;
  menuElement: HTMLElement | null;
};

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

function isBlockNode(node: LexicalNode): boolean {
  return (
    $isElementNode(node) &&
    !node.isInline() &&
    node.getKey() !== 'root'
  );
}

function getTopLevelBlockNode(node: LexicalNode): ElementNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    if (isBlockNode(current)) {
      return current as ElementNode;
    }
    const parent: LexicalNode | null = current.getParent();
    if (parent && parent.getKey() === 'root') {
      break;
    }
    current = parent;
  }
  return null;
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [blockHandles, setBlockHandles] = useState<Map<NodeKey, BlockHandle>>(
    new Map(),
  );
  const [draggingNodeKey, setDraggingNodeKey] = useState<NodeKey | null>(null);
  const [dragOverNodeKey, setDragOverNodeKey] = useState<NodeKey | null>(null);
  const [targetLinePosition, setTargetLinePosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [queryString, setQueryString] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [pickerPosition, setPickerPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [currentDraggableElement, setCurrentDraggableElement] =
    useState<HTMLElement | null>(null);

  const options = useMemo(() => {
    const baseOptions = getBaseOptions(editor, showModal);

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, 'i');
    return [
      ...getDynamicOptions(editor, queryString),
      ...baseOptions.filter(
        (option) =>
          regex.test(option.title) ||
          option.keywords.some((keyword) => regex.test(keyword)),
      ),
    ];
  }, [editor, queryString, showModal]);

  // Track block nodes and their DOM elements
  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        const root = $getRoot();
        const newHandles = new Map<NodeKey, BlockHandle>();
        const rootElement = editor.getRootElement();

        if (!rootElement) return;

        // Get all block-level children
        const children = root.getChildren();
        children.forEach((child) => {
          if (isBlockNode(child)) {
            const nodeKey = child.getKey();
            const domNode = editor.getElementByKey(nodeKey);
            if (domNode) {
              newHandles.set(nodeKey, {
                nodeKey,
                element: domNode as HTMLElement,
                menuElement: null,
              });
            }
          }
        });

        setBlockHandles(newHandles);
      });
    });
  }, [editor]);

  useEffect(() => {
    if (isPickerOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isPickerOpen]);

  useEffect(() => {
    if (!isPickerOpen || !options.length) {
      return;
    }
    setHighlightedIndex((current) =>
      Math.min(current, Math.max(options.length - 1, 0)),
    );
  }, [isPickerOpen, options.length]);

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        (pickerRef.current && pickerRef.current.contains(target)) ||
        (target && isOnMenu(target as HTMLElement))
      ) {
        return;
      }
      setIsPickerOpen(false);
      setPickerState(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  const selectOption = useCallback(
    (option: ComponentPickerOption) => {
      if (!pickerState) {
        setIsPickerOpen(false);
        return;
      }
      setIsPickerOpen(false);
      editor.update(() => {
        const node = $getNodeByKey(pickerState.targetNodeKey);
        if (!node) {
          return;
        }
        const placeholder = $createParagraphNode();
        const textNode = $createTextNode('');
        placeholder.append(textNode);
        if (pickerState.insertBefore) {
          node.insertBefore(placeholder);
        } else {
          node.insertAfter(placeholder);
        }
        textNode.select();
        option.onSelect(queryString);
        const latestPlaceholder = placeholder.getLatest();
        if ($isParagraphNode(latestPlaceholder)) {
          const onlyChild = latestPlaceholder.getFirstChild();
          if (
            $isTextNode(onlyChild) &&
            onlyChild.getTextContent().length === 0 &&
            latestPlaceholder.getChildrenSize() === 1
          ) {
            latestPlaceholder.remove();
          }
        }
      });
    },
    [editor, pickerState, queryString],
  );

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPickerOpen || !options.length) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightedIndex((index) =>
          index + 1 >= options.length ? 0 : index + 1,
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightedIndex((index) =>
          index - 1 < 0 ? options.length - 1 : index - 1,
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const option = options[highlightedIndex];
        if (option) {
          selectOption(option);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsPickerOpen(false);
        setPickerState(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [highlightedIndex, isPickerOpen, options, selectOption]);

  function openComponentPicker(e: React.MouseEvent, nodeKey: NodeKey) {
    if (!editor) {
      return;
    }

    const insertBefore = e.altKey || e.ctrlKey;
    const handle = blockHandles.get(nodeKey);
    const rect = handle?.menuElement?.getBoundingClientRect();
    setPickerPosition(
      rect
        ? {
            left: rect.left + rect.width + window.scrollX + 8,
            top: rect.top + window.scrollY,
          }
        : null,
    );
    setPickerState({insertBefore, targetNodeKey: nodeKey});
    setQueryString('');
    setHighlightedIndex(0);
    setIsPickerOpen(true);
  }

  const handleDragStart = useCallback(
    (nodeKey: NodeKey) => {
      setDraggingNodeKey(nodeKey);
    },
    [],
  );

  const handleDrag = useCallback(
    (nodeKey: NodeKey, x: number, y: number) => {
      if (!draggingNodeKey || draggingNodeKey === nodeKey) {
        return;
      }

      // Find which block we're over
      editor.getEditorState().read(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return;

        const elementBelow = document.elementFromPoint(x, y);
        if (!elementBelow) return;

        // Find the block node for this element
        let current: Element | null = elementBelow as Element;
        let targetBlock: ElementNode | null = null;

        while (current && current !== rootElement) {
          const node = $getNearestNodeFromDOMNode(current as HTMLElement);
          if (node) {
            const blockNode = getTopLevelBlockNode(node);
            if (blockNode && blockNode.getKey() !== draggingNodeKey) {
              targetBlock = blockNode;
              break;
            }
          }
          current = current.parentElement;
        }

        if (targetBlock) {
          const targetKey = targetBlock.getKey();
          setDragOverNodeKey(targetKey);

          // Calculate target line position
          const handle = blockHandles.get(targetKey);
          if (handle?.element) {
            const rect = handle.element.getBoundingClientRect();
            const rootRect = rootElement.getBoundingClientRect();
            setTargetLinePosition({
              top: rect.top - rootRect.top + rootElement.scrollTop,
              left: 0,
              width: rootRect.width,
            });
          }
        } else {
          setDragOverNodeKey(null);
          setTargetLinePosition(null);
        }
      });
    },
    [draggingNodeKey, editor, blockHandles],
  );

  const handleDragEnd = useCallback(
    (draggedNodeKey: NodeKey) => {
      if (!draggingNodeKey || !dragOverNodeKey) {
        setDraggingNodeKey(null);
        setDragOverNodeKey(null);
        setTargetLinePosition(null);
        return;
      }

      if (draggedNodeKey === dragOverNodeKey) {
        setDraggingNodeKey(null);
        setDragOverNodeKey(null);
        setTargetLinePosition(null);
        return;
      }

      // Reorder the nodes
      editor.update(() => {
        const draggedNode = $getNodeByKey(draggedNodeKey);
        const targetNode = $getNodeByKey(dragOverNodeKey);

        if (!draggedNode || !targetNode) {
          return;
        }

        // Remove the dragged node first
        draggedNode.remove();

        // Insert before the target node
        targetNode.insertBefore(draggedNode);
      });

      setDraggingNodeKey(null);
      setDragOverNodeKey(null);
      setTargetLinePosition(null);
    },
    [draggingNodeKey, dragOverNodeKey, editor],
  );

  return (
    <>
      {modal}
      {isPickerOpen && pickerPosition
        ? ReactDOM.createPortal(
            <div
              className="bg-df-surface border border-df-control-border rounded-lg shadow-df-lg max-w-[260px] overflow-hidden z-50"
              ref={pickerRef}
              style={{
                left: pickerPosition.left,
                position: 'absolute',
                top: pickerPosition.top,
                zIndex: 50,
              }}>
              <Input
                className="w-full border-0 border-b border-df-control-border rounded-none rounded-t-lg bg-df-surface text-df-text-primary placeholder:text-df-text-tertiary focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Filter blocks..."
                value={queryString}
                ref={searchInputRef}
                onChange={(event) => setQueryString(event.target.value)}
              />
              <ul className="max-h-[300px] overflow-y-auto p-1">
                {options.map((option, i: number) => (
                  <ComponentPickerMenuItem
                    index={i}
                    isSelected={highlightedIndex === i}
                    onClick={() => {
                      setHighlightedIndex(i);
                      selectOption(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    key={option.key}
                    option={option}
                  />
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
      {targetLinePosition && (
        <div
          className="draggable-block-target-line pointer-events-none bg-df-node-selected h-1 absolute opacity-100 will-change-transform z-50"
          style={{
            top: targetLinePosition.top,
            left: targetLinePosition.left,
            width: targetLinePosition.width,
          }}
        />
      )}
      {Array.from(blockHandles.values()).map((handle) => (
        <BlockHandleComponent
          key={handle.nodeKey}
          handle={handle}
          editor={editor}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onOpenPicker={openComponentPicker}
          isDragging={draggingNodeKey === handle.nodeKey}
          setMenuElement={(element) => {
            const updated = new Map(blockHandles);
            const existing = updated.get(handle.nodeKey);
            if (existing) {
              updated.set(handle.nodeKey, {...existing, menuElement: element});
              setBlockHandles(updated);
            }
          }}
        />
      ))}
    </>
  );
}

function BlockHandleComponent({
  handle,
  editor,
  onDragStart,
  onDrag,
  onDragEnd,
  onOpenPicker,
  isDragging,
  setMenuElement,
}: {
  handle: BlockHandle;
  editor: any;
  onDragStart: (nodeKey: NodeKey) => void;
  onDrag: (nodeKey: NodeKey, x: number, y: number) => void;
  onDragEnd: (nodeKey: NodeKey) => void;
  onOpenPicker: (e: React.MouseEvent, nodeKey: NodeKey) => void;
  isDragging: boolean;
  setMenuElement: (element: HTMLElement | null) => void;
}): JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{x: number; y: number} | null>(
    null,
  );

  // Update position when element moves
  useEffect(() => {
    const updatePosition = () => {
      if (!handle.element || !menuRef.current) return;

      const rect = handle.element.getBoundingClientRect();
      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      const rootRect = rootElement.getBoundingClientRect();
      setPosition({
        x: -32, // Position to the left of the block
        y: rect.top - rootRect.top + rootElement.scrollTop,
      });
    };

    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(handle.element, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(handle.element);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [handle.element, editor]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuElement(menuRef.current);
    }
    return () => setMenuElement(null);
  }, [setMenuElement]);

  useDraggable(menuRef as RefObject<HTMLElement>, {
    onDragStart: () => {
      onDragStart(handle.nodeKey);
    },
    onDrag: (data: {offsetX: number; offsetY: number}) => {
      const rootElement = editor.getRootElement();
      if (!rootElement) return;
      const rect = rootElement.getBoundingClientRect();
      onDrag(handle.nodeKey, rect.left + data.offsetX, rect.top + data.offsetY);
    },
    onDragEnd: () => {
      onDragEnd(handle.nodeKey);
    },
    position: position ? {x: position.x, y: position.y} : undefined,
    bounds: editor.getRootElement() || undefined,
  });

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className={`draggable-block-menu rounded px-0.5 py-0.5 cursor-grab opacity-0 absolute left-0 top-0 will-change-[transform,opacity] flex gap-0.5 transition-[transform_140ms_ease-in-out,opacity_160ms_ease-in-out] hover:opacity-100 ${
        isDragging ? 'opacity-100 cursor-grabbing' : ''
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        pointerEvents: 'auto',
      }}>
      <button
        title="Click to add below"
        draggable={false}
        className="inline-block w-4 h-4 p-0 border-0 cursor-pointer bg-transparent hover:bg-df-control-hover rounded flex items-center justify-center flex-shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenPicker(e, handle.nodeKey);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}>
        <Plus size={16} className="opacity-30 pointer-events-none" />
      </button>
      <div className="w-4 h-4 opacity-30 flex items-center justify-center flex-shrink-0 cursor-grab">
        <GripVertical size={16} className="pointer-events-none" />
      </div>
    </div>
  );
}
