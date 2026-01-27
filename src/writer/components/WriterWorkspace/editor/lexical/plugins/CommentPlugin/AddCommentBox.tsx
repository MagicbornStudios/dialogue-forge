import type { LexicalEditor, NodeKey } from 'lexical';
import type { JSX } from 'react';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { MessageSquare } from 'lucide-react';

export function AddCommentBox({
  anchorKey,
  editor,
  onAddComment,
}: {
  anchorKey: NodeKey;
  editor: LexicalEditor;
  onAddComment: () => void;
}): JSX.Element {
  const boxRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const boxElem = boxRef.current;
    const rootElement = editor.getRootElement();
    const anchorElement = editor.getElementByKey(anchorKey);

    if (boxElem !== null && rootElement !== null && anchorElement !== null) {
      const { right } = rootElement.getBoundingClientRect();
      const { top } = anchorElement.getBoundingClientRect();
      boxElem.style.left = `${right - 20}px`;
      boxElem.style.top = `${top - 30}px`;
    }
  }, [anchorKey, editor]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [editor, updatePosition]);

  useLayoutEffect(() => {
    updatePosition();
  }, [anchorKey, editor, updatePosition]);

  return (
    <div 
      className="block fixed rounded-[20px] bg-df-elevated border border-df-control-border w-10 h-[60px] shadow-df-sm z-10 hidden sm:block" 
      ref={boxRef}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-[20px] border-0 bg-transparent w-10 h-[60px] absolute top-0 left-0 cursor-pointer text-df-text-primary hover:bg-df-control-hover"
        onClick={onAddComment}
        title="Add comment">
        <MessageSquare size={18} className="text-df-text-primary" />
      </Button>
    </div>
  );
}
