import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { LexicalDraggableBlockPlugin } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

type BlockHandleMenuProps = {
  anchorElem: HTMLElement;
  blockElement: HTMLElement;
  editor: LexicalEditor;
  onClose: () => void;
};

const getTopLevelBlocksFromSelection = () => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return [];
  }
  const seen = new Set<string>();
  const blocks: LexicalNode[] = [];
  for (const node of selection.getNodes()) {
    const block = node.getTopLevelElementOrThrow();
    const key = block.getKey();
    if (!seen.has(key)) {
      seen.add(key);
      blocks.push(block);
    }
  }
  return blocks;
};

const BlockHandleMenu = ({ anchorElem, blockElement, editor }: BlockHandleMenuProps) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const blockRect = blockElement.getBoundingClientRect();
    const anchorRect = anchorElem.getBoundingClientRect();
    const top = blockRect.top - anchorRect.top + blockRect.height / 2;
    setStyle({
      top,
      left: -28,
    });
  }, [anchorElem, blockElement]);

  useEffect(() => {
    updatePosition();
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    blockElement.addEventListener('mouseenter', handleMouseEnter);
    blockElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      blockElement.removeEventListener('mouseenter', handleMouseEnter);
      blockElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [blockElement, updatePosition]);

  const handleDragStart = () => {
    editor.focus();
  };

  return (
    <div
      ref={menuRef}
      className={`pointer-events-auto absolute flex h-6 w-6 items-center justify-center rounded-md border border-df-node-border bg-df-surface-2 text-df-text-secondary shadow-sm transition ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onMouseDown={handleDragStart}
        className="flex h-full w-full items-center justify-center text-xs"
        aria-label="Drag block"
      >
        ⋮⋮
      </button>
    </div>
  );
};

export function BlockHandlePlugin({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const draggingBlockKeys = useRef<string[]>([]);

  useEffect(() => {
    const removeDragStart = editor.registerCommand(
      DRAGSTART_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const blocks = getTopLevelBlocksFromSelection();
          draggingBlockKeys.current =
            blocks.length > 1 ? blocks.map((block) => block.getKey()) : [];
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeDrop = editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        if (draggingBlockKeys.current.length === 0) {
          return false;
        }
        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }
          const nodesToMove = draggingBlockKeys.current
            .map((key) => $getNodeByKey(key))
            .filter((node): node is LexicalNode => Boolean(node))
            .map((node) => node.getTopLevelElementOrThrow());
          nodesToMove.forEach((node) => node.remove());
          if (nodesToMove.length > 0) {
            selection.insertNodes(nodesToMove);
          }
        });
        draggingBlockKeys.current = [];
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeDragStart();
      removeDrop();
    };
  }, [editor]);

  const menuComponent = useMemo(() => {
    return (props: Omit<BlockHandleMenuProps, 'anchorElem'>) => (
      <BlockHandleMenu {...props} anchorElem={anchorElem} />
    );
  }, [anchorElem]);

  return (
    <LexicalDraggableBlockPlugin anchorElem={anchorElem} menuComponent={menuComponent} />
  );
}
