import type { JSX } from 'react';

import { Button } from '@magicborn/shared/ui/button';
import { Trash2 } from 'lucide-react';
import useModal from '../../hooks/useModal';
import { Comment, Thread } from '../../commenting';
import { ShowDeleteCommentOrThreadDialog } from './ShowDeleteCommentOrThreadDialog';

export function CommentsPanelListComment({
  comment,
  deleteComment,
  thread,
  rtf,
}: {
  comment: Comment;
  deleteComment: (
    commentOrThread: Comment | Thread,
    // eslint-disable-next-line no-shadow
    thread?: Thread,
  ) => void;
  rtf: Intl.RelativeTimeFormat;
  thread?: Thread;
}): JSX.Element {
  const seconds = Math.round(
    (comment.timeStamp - (performance.timeOrigin + performance.now())) / 1000,
  );
  const minutes = Math.round(seconds / 60);
  const [modal, showModal] = useModal();

  return (
    <div className="p-3 m-0 text-sm relative transition-all duration-200 text-df-text-primary group">
      <div className="text-df-text-secondary pb-1.5 align-top">
        <span className="font-bold pr-1.5">
          {comment.author}
        </span>
        <span className="text-df-text-tertiary">
          · {seconds > -10 ? 'Just now' : rtf.format(minutes, 'minute')}
        </span>
      </div>
      <p className={`m-0 text-df-text-primary ${comment.deleted ? 'opacity-50' : ''}`}>
        {comment.content}
      </p>
      {!comment.deleted && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              showModal('Delete Comment', (onClose) => (
                <ShowDeleteCommentOrThreadDialog
                  commentOrThread={comment}
                  deleteCommentOrThread={deleteComment}
                  thread={thread}
                  onClose={onClose}
                />
              ));
            }}
            className="absolute top-2.5 right-2.5 w-[30px] h-[30px] bg-transparent opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity">
            <Trash2 size={14} className="text-df-text-muted" />
          </Button>
          {modal}
        </>
      )}
    </div>
  );
}
