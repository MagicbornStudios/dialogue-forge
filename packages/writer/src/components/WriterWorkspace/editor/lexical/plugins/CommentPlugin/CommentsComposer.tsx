import type { LexicalEditor } from 'lexical';
import type { JSX } from 'react';

import { CLEAR_EDITOR_COMMAND } from 'lexical';
import { useRef, useState } from 'react';

import { Button } from '@magicborn/shared/ui/button';
import { Send } from 'lucide-react';
import { PlainTextEditor } from './PlainTextEditor';
import { useOnChange } from './useOnChange';
import { useCollabAuthorName } from './useCollabAuthorName';
import { Comment, Thread, createComment } from '../../commenting';

export function CommentsComposer({
  submitAddComment,
  thread,
  placeholder,
}: {
  placeholder?: string;
  submitAddComment: (
    commentOrThread: Comment,
    isInlineComment: boolean,
    // eslint-disable-next-line no-shadow
    thread?: Thread,
  ) => void;
  thread?: Thread;
}): JSX.Element {
  const [content, setContent] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const editorRef = useRef<LexicalEditor>(null);
  const author = useCollabAuthorName();

  const onChange = useOnChange(setContent, setCanSubmit);

  const submitComment = () => {
    if (canSubmit) {
      submitAddComment(createComment(content, author), false, thread);
      const editor = editorRef.current;
      if (editor !== null) {
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      }
    }
  };

  return (
    <div className="relative">
      <PlainTextEditor
        className="relative border border-df-control-border bg-df-editor-bg rounded-md text-[15px] caret-df-text-primary text-df-text-primary block py-2.5 px-2.5 min-h-5 before:content-[''] before:w-7.5 before:h-5 before:float-right"
        autoFocus={false}
        onEscape={() => {
          return true;
        }}
        onChange={onChange}
        editorRef={editorRef}
        placeholder={placeholder}
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2.5 top-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={submitComment}
        disabled={!canSubmit}>
        <Send size={16} className="text-df-text-primary" />
      </Button>
    </div>
  );
}
