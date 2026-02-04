import type { LexicalEditor, NodeKey } from 'lexical';
import type { JSX } from 'react';

import { $getNodeByKey } from 'lexical';
import { $isMarkNode, MarkNode } from '@lexical/mark';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@magicborn/shared/ui/button';
import { Trash2 } from 'lucide-react';
import useModal from '../../hooks/useModal';
import { Comment, Comments, Thread } from '../../commenting';
import { CommentsPanelListComment } from './CommentsPanelListComment';
import { CommentsComposer } from './CommentsComposer';
import { ShowDeleteCommentOrThreadDialog } from './ShowDeleteCommentOrThreadDialog';

export function CommentsPanelList({
  activeIDs,
  comments,
  deleteCommentOrThread,
  listRef,
  submitAddComment,
  markNodeMap,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  listRef: { current: null | HTMLUListElement };
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [counter, setCounter] = useState(0);
  const [modal, showModal] = useModal();
  const rtf = useMemo(
    () =>
      new Intl.RelativeTimeFormat('en', {
        localeMatcher: 'best fit',
        numeric: 'auto',
        style: 'short',
      }),
    [],
  );

  useEffect(() => {
    // Used to keep the time stamp up to date
    const id = setTimeout(() => {
      setCounter(counter + 1);
    }, 10000);

    return () => {
      clearTimeout(id);
    };
  }, [counter]);

  return (
    <ul className="p-0 list-none m-0 w-full flex-1 overflow-y-auto overflow-x-hidden" ref={listRef}>
      {comments.map((commentOrThread) => {
        const id = commentOrThread.id;
        if (commentOrThread.type === 'thread') {
          const handleClickThread = () => {
            const markNodeKeys = markNodeMap.get(id);
            if (
              markNodeKeys !== undefined &&
              (activeIDs === null || activeIDs.indexOf(id) === -1)
            ) {
              const activeElement = document.activeElement;
              // Move selection to the start of the mark, so that we
              // update the UI with the selected thread.
              editor.update(
                () => {
                  const markNodeKey = Array.from(markNodeKeys)[0];
                  const markNode = $getNodeByKey<MarkNode>(markNodeKey);
                  if (markNode !== null && $isMarkNode(markNode)) {
                    markNode.selectStart();
                  }
                },
                {
                  onUpdate() {
                    // Restore selection to the previous element
                    if (activeElement !== null) {
                      (activeElement as HTMLElement).focus();
                    }
                  },
                },
              );
            }
          };

          const isInteractive = markNodeMap.has(id);
          const isActive = activeIDs.indexOf(id) !== -1;

          return (
            // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
            <li
              key={id}
              onClick={handleClickThread}
              className={`p-0 m-0 border-t border-b border-df-control-border relative transition-all duration-200 border-l-0 ${
                isInteractive ? 'cursor-pointer hover:bg-df-control-hover' : ''
              } ${
                isActive 
                  ? 'bg-df-control-hover border-l-[3px] border-l-df-node-selected cursor-default' 
                  : ''
              } first:border-t-0 [&+&]:border-t-0`}>
              <div className="pt-2.5 text-df-text-tertiary block relative group">
                <blockquote className="m-0 mx-2.5">
                  {'> '}
                  <span className="text-df-text-primary bg-df-node-selected opacity-30 py-px leading-[1.4] inline font-bold">
                    {commentOrThread.quote}
                  </span>
                </blockquote>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    showModal('Delete Thread', (onClose) => (
                      <ShowDeleteCommentOrThreadDialog
                        commentOrThread={commentOrThread}
                        deleteCommentOrThread={deleteCommentOrThread}
                        onClose={onClose}
                      />
                    ));
                  }}
                  className="absolute top-2.5 right-2.5 w-7.5 h-7.5 bg-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-60 hover:opacity-100">
                  <Trash2 size={14} className="text-df-text-muted" />
                </Button>
                {modal}
              </div>
              <ul className="pl-2.5 list-none">
                {commentOrThread.comments.map((comment, idx) => (
                  <li key={comment.id} className={idx === 0 ? 'border-none ml-0 pl-1.25' : 'pl-2.5 border-l-[3px] border-l-df-control-border ml-1.25'}>
                    <CommentsPanelListComment
                      comment={comment}
                      deleteComment={deleteCommentOrThread}
                      thread={commentOrThread}
                      rtf={rtf}
                    />
                  </li>
                ))}
              </ul>
              <div className="relative pt-px">
                <CommentsComposer
                  submitAddComment={submitAddComment}
                  thread={commentOrThread}
                  placeholder="Reply to comment..."
                />
              </div>
            </li>
          );
        }
        return (
          <CommentsPanelListComment
            key={id}
            comment={commentOrThread}
            deleteComment={deleteCommentOrThread}
            rtf={rtf}
          />
        );
      })}
    </ul>
  );
}
