import type { LexicalEditor, NodeKey } from 'lexical';
import type { JSX } from 'react';

import { useRef } from 'react';

import { Button } from '@/shared/ui/button';
import { MessageSquare } from 'lucide-react';
import { Comment, Comments, Thread } from '../../commenting';
import { CommentsPanelList } from './CommentsPanelList';

export function CommentsPanel({
  activeIDs,
  deleteCommentOrThread,
  comments,
  submitAddComment,
  markNodeMap,
  commentModeEnabled,
  onToggleCommentMode,
}: {
  activeIDs: Array<string>;
  comments: Comments;
  deleteCommentOrThread: (
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ) => void;
  markNodeMap: Map<string, Set<NodeKey>>;
  submitAddComment: (
    commentOrThread: Comment | Thread,
    isInlineComment: boolean,
    thread?: Thread,
  ) => void;
  commentModeEnabled: boolean;
  onToggleCommentMode: () => void;
}): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);
  const isEmpty = comments.length === 0;

  return (
    <div className="relative w-full h-full bg-df-surface text-df-text-primary flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 m-0 min-h-[44px] border-b border-df-control-border text-lg font-semibold flex items-center justify-between w-full text-df-text-primary overflow-hidden">
        <h2 className="m-0 inline">Comments</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCommentMode}
          className="ml-auto"
          title={commentModeEnabled ? 'Disable comment mode' : 'Enable comment mode'}>
          <MessageSquare size={14} className={commentModeEnabled ? 'text-df-node-selected' : 'text-df-text-muted'} />
        </Button>
      </div>
      {isEmpty ? (
        <div className="text-df-text-tertiary text-sm text-center m-auto p-8 w-full flex-1 flex items-center justify-center">No Comments</div>
      ) : (
        <CommentsPanelList
          activeIDs={activeIDs}
          comments={comments}
          deleteCommentOrThread={deleteCommentOrThread}
          listRef={listRef}
          submitAddComment={submitAddComment}
          markNodeMap={markNodeMap}
        />
      )}
    </div>
  );
}
