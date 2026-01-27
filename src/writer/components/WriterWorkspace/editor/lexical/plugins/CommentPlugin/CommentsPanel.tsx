import type { LexicalEditor, NodeKey } from 'lexical';
import type { JSX } from 'react';

import { useRef, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { MessageSquare, Network } from 'lucide-react';
import { Comment, Comments, Thread } from '../../commenting';
import { CommentsPanelList } from './CommentsPanelList';
import { NodesView } from './NodesView';

type ViewMode = 'comments' | 'nodes';

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
  const [viewMode, setViewMode] = useState<ViewMode>('comments');

  return (
    <div className="relative w-full h-full bg-df-surface text-df-text-primary flex flex-col overflow-hidden">
      <div className="px-4 py-3 m-0 min-h-[48px] border-b border-df-control-border flex items-center justify-between w-full text-df-text-primary overflow-hidden gap-2 bg-df-control-bg">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (value) setViewMode(value as ViewMode);
          }}
          className="flex-1">
          <ToggleGroupItem
            value="comments"
            aria-label="Comments view"
            className="data-[state=on]:bg-df-surface data-[state=on]:text-df-text-primary data-[state=on]:shadow-df-sm">
            <MessageSquare size={14} className="mr-2" />
            <span className="text-sm font-medium">Comments</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="nodes"
            aria-label="Nodes view"
            className="data-[state=on]:bg-df-surface data-[state=on]:text-df-text-primary data-[state=on]:shadow-df-sm">
            <Network size={14} className="mr-2" />
            <span className="text-sm font-medium">Nodes</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCommentMode}
          className={`ml-auto ${commentModeEnabled ? 'bg-df-node-selected text-df-text-primary hover:bg-df-control-hover' : 'text-df-text-muted hover:bg-df-control-hover'}`}
          title={commentModeEnabled ? 'Disable comment mode' : 'Enable comment mode'}>
          <MessageSquare size={14} />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        {viewMode === 'comments' ? (
          isEmpty ? (
            <div className="text-df-text-tertiary text-sm text-center m-auto p-8 w-full flex-1 flex items-center justify-center">No comments yet</div>
          ) : (
            <CommentsPanelList
              activeIDs={activeIDs}
              comments={comments}
              deleteCommentOrThread={deleteCommentOrThread}
              listRef={listRef}
              submitAddComment={submitAddComment}
              markNodeMap={markNodeMap}
            />
          )
        ) : (
          <NodesView />
        )}
      </div>
    </div>
  );
}
