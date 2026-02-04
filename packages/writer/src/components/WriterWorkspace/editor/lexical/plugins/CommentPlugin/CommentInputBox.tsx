import type { LexicalEditor, RangeSelection } from 'lexical';
import type { JSX } from 'react';

import { createDOMRange, createRectsFromDOMRange } from '@lexical/selection';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@magicborn/shared/ui/button';
import { X, MessageSquare } from 'lucide-react';
import { PlainTextEditor } from './PlainTextEditor';
import { useOnChange } from './useOnChange';
import { useCollabAuthorName } from './useCollabAuthorName';
import { Comment, Thread, createComment, createThread } from '../../commenting';

export function CommentInputBox({
  editor,
  cancelAddComment,
  submitAddComment,
}: {
  cancelAddComment: () => void;
  editor: LexicalEditor;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
    selection?: RangeSelection | null,
  ) => void;
}): JSX.Element {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selectionState = useMemo(
    () => ({
      container: document.createElement('div'),
      elements: [] as Array<HTMLSpanElement>,
    }),
    [],
  );
  const selectionRef = useRef<RangeSelection | null>(null);
  const author = useCollabAuthorName();

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone();
        const anchor = selection.anchor;
        const focus = selection.focus;
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset,
        );
        const boxElem = boxRef.current;
        if (range !== null && boxElem !== null) {
          const { left, bottom, width } = range.getBoundingClientRect();
          const selectionRects = createRectsFromDOMRange(editor, range);
          let correctedLeft =
            selectionRects.length === 1 ? left + width / 2 - 125 : left - 125;
          if (correctedLeft < 10) {
            correctedLeft = 10;
          }
          boxElem.style.left = `${correctedLeft}px`;
          boxElem.style.top = `${
            bottom +
            20 +
            (window.pageYOffset || document.documentElement.scrollTop)
          }px`;
          const selectionRectsLength = selectionRects.length;
          const { container } = selectionState;
          const elements: Array<HTMLSpanElement> = selectionState.elements;
          const elementsLength = elements.length;

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i];
            let elem: HTMLSpanElement = elements[i];
            if (elem === undefined) {
              elem = document.createElement('span');
              elements[i] = elem;
              container.appendChild(elem);
            }
            const color = '251, 188, 5'; // Google Docs yellow
            const style = `position:absolute;top:${
              selectionRect.top +
              (window.pageYOffset || document.documentElement.scrollTop)
            }px;left:${selectionRect.left}px;height:${
              selectionRect.height
            }px;width:${
              selectionRect.width
            }px;background-color:rgba(${color}, 0.4);pointer-events:none;z-index:5;`;
            elem.style.cssText = style;
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i];
            container.removeChild(elem);
            elements.pop();
          }
        }
      }
    });
  }, [editor, selectionState]);

  useLayoutEffect(() => {
    updateLocation();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [selectionState.container, updateLocation]);

  useEffect(() => {
    window.addEventListener('resize', updateLocation);

    return () => {
      window.removeEventListener('resize', updateLocation);
    };
  }, [updateLocation]);

  const onEscape = (event: KeyboardEvent): boolean => {
    event.preventDefault();
    cancelAddComment();
    return true;
  };

  const submitComment = () => {
    if (canSubmit) {
      let quote = editor.getEditorState().read(() => {
        const selection = selectionRef.current;
        return selection ? selection.getTextContent() : '';
      });
      if (quote.length > 100) {
        quote = quote.slice(0, 99) + '…';
      }
      submitAddComment(
        createThread(quote, [createComment(content, author)]),
        true,
        undefined,
        selectionRef.current,
      );
      selectionRef.current = null;
    }
  };

  const onChange = useOnChange(setContent, setCanSubmit);

  return (
    <div 
      className="absolute w-[320px] bg-df-elevated border border-df-control-border shadow-df-lg rounded-lg z-[24] animate-in fade-in slide-in-from-bottom-2 duration-200"
      ref={boxRef}>
      <div className="p-3 border-b border-df-control-border">
        <PlainTextEditor
          className="w-full text-sm text-df-text-primary placeholder:text-df-text-tertiary bg-transparent border-0 outline-none resize-none min-h-[60px] max-h-[200px] overflow-y-auto"
          placeholder="Add a comment..."
          onEscape={onEscape}
          onChange={onChange}
        />
      </div>
      <div className="flex flex-row justify-end px-3 py-2 gap-2 bg-df-control-bg rounded-b-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelAddComment}
          className="text-df-text-secondary hover:bg-df-control-hover">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={submitComment}
          disabled={!canSubmit}
          className="bg-df-node-selected text-df-text-primary hover:bg-df-control-hover disabled:bg-df-control-bg disabled:text-df-text-muted disabled:cursor-not-allowed px-4">
          Comment
        </Button>
      </div>
    </div>
  );
}
