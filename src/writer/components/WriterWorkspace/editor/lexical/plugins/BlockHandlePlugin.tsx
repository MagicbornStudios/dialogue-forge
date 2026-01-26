import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  $createParagraphNode,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $isParagraphNode,
  $isTextNode,
  type NodeKey,
} from 'lexical';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Plus, GripVertical } from 'lucide-react';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export function BlockHandlePlugin({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(null);
  const [isBlockHovered, setIsBlockHovered] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Combined hover state - visible if hovering over block OR menu
  const isHovered = isBlockHovered || isMenuHovered;

  // Handle hover state when draggable element changes
  useEffect(() => {
    if (!draggableElement) {
      setIsBlockHovered(false);
      return;
    }

    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsBlockHovered(true);
    };
    
    const handleMouseLeave = () => {
      // Add a small delay before hiding to allow moving to the menu
      hoverTimeoutRef.current = setTimeout(() => {
        // Only hide if not hovering over menu
        if (!isMenuHovered) {
          setIsBlockHovered(false);
        }
      }, 100);
    };

    draggableElement.addEventListener('mouseenter', handleMouseEnter);
    draggableElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      draggableElement.removeEventListener('mouseenter', handleMouseEnter);
      draggableElement.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [draggableElement, isMenuHovered]);

  const handleInsertBlock = useCallback(() => {
    if (!draggableElement || !editor) {
      return;
    }

    let targetNodeKey: NodeKey | null = null;
    editor.getEditorState().read(() => {
      const resolvedNode = $getNearestNodeFromDOMNode(draggableElement);
      if (resolvedNode) {
        targetNodeKey = resolvedNode.getKey();
      }
    });

    if (!targetNodeKey) {
      return;
    }

    editor.update(() => {
      const node = $getNodeByKey(targetNodeKey);
      if (!node) {
        return;
      }
      const placeholder = $createParagraphNode();
      const textNode = $createTextNode('');
      placeholder.append(textNode);
      node.insertAfter(placeholder);
      textNode.select();
      
      // Insert slash to trigger command menu
      const latestPlaceholder = placeholder.getLatest();
      if ($isParagraphNode(latestPlaceholder)) {
        const onlyChild = latestPlaceholder.getFirstChild();
        if (
          $isTextNode(onlyChild) &&
          onlyChild.getTextContent().length === 0 &&
          latestPlaceholder.getChildrenSize() === 1
        ) {
          onlyChild.setTextContent('/');
        }
      }
    });
  }, [editor, draggableElement]);

  return (
    <>
      <DraggableBlockPlugin_EXPERIMENTAL
        anchorElem={anchorElem}
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={
          <div
            ref={menuRef}
            className={`${DRAGGABLE_BLOCK_MENU_CLASSNAME} absolute left-[-32px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-opacity`}
            style={{
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? 'auto' : 'none',
              visibility: isHovered ? 'visible' : 'hidden',
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
              }
              setIsMenuHovered(true);
            }}
            onMouseLeave={() => {
              setIsMenuHovered(false);
              // Hide after a delay if not hovering over block
              hoverTimeoutRef.current = setTimeout(() => {
                if (!isBlockHovered) {
                  setIsBlockHovered(false);
                }
              }, 100);
            }}
          >
            {/* Drag Handle */}
            <div
              className="flex h-5 w-5 cursor-grab items-center justify-center rounded text-df-text-tertiary hover:text-df-text-primary active:cursor-grabbing"
              aria-label="Drag block"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {/* Plus Button */}
            <button
              type="button"
              onClick={handleInsertBlock}
              className="flex h-5 w-5 items-center justify-center rounded border border-df-node-border bg-df-control-bg text-df-text-tertiary hover:border-df-node-border-hover hover:bg-df-control-hover hover:text-df-text-primary"
              aria-label="Insert block"
              title="Insert block below"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        }
        targetLineComponent={
          <div
            ref={targetLineRef}
            className="absolute left-0 right-0 h-0.5 bg-df-primary opacity-60 pointer-events-none z-10"
          />
        }
        isOnMenu={isOnMenu}
        onElementChanged={(element) => {
          setDraggableElement(element);
        }}
      />
    </>
  );
}
