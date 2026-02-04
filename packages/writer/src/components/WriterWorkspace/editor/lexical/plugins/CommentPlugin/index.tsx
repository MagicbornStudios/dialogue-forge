/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Provider } from '@lexical/yjs';
import type { LexicalCommand, LexicalEditor, NodeKey, RangeSelection } from 'lexical';
import type { JSX } from 'react';
import type { Doc } from 'yjs';

import {
  $createMarkNode,
  $getMarkIDs,
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createDOMRange } from '@lexical/selection';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import {
  $addUpdateTag,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COLLABORATION_TAG,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  getDOMSelection,
} from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Comment,
  Comments,
  CommentStore,
  Thread,
  useCommentStore,
} from '../../commenting';
import { Button } from '@magicborn/shared/ui/button';
import { MessageSquare } from 'lucide-react';
import { useCommentContext } from '../../context/CommentContext';
import { AddCommentBox } from './AddCommentBox';
import { CommentInputBox } from './CommentInputBox';
import { CommentsPanel } from './CommentsPanel';
import { useCommentMode } from './useCommentMode';

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_INLINE_COMMAND',
);

export const COMMENT_DELETION_TAG = 'comment-deletion';

export default function CommentPlugin({
  providerFactory,
  commentsContainer,
  showCommentsButtonContainer,
}: {
  providerFactory?: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
  commentsContainer?: HTMLElement | null;
  showCommentsButtonContainer?: HTMLElement | null;
}): JSX.Element {
  const collabContext = useCollaborationContext();
  const { pageId, dataAdapter } = useCommentContext();
  const [editor] = useLexicalComposerContext();
  const commentStore = useMemo(() => new CommentStore(editor), [editor]);
  const comments = useCommentStore(commentStore);
  const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => {
    return new Map();
  }, []);
  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>();
  const [activeIDs, setActiveIDs] = useState<Array<string>>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showComments, setShowComments] = useState(
    commentsContainer !== null && commentsContainer !== undefined
  );
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentModeEnabled, setCommentModeEnabled] = useCommentMode();
  const { yjsDocMap } = collabContext;

  // Load comments from Payload on mount
  useEffect(() => {
    if (!pageId || !dataAdapter?.listComments) {
      return;
    }

    setIsLoadingComments(true);
    dataAdapter
      .listComments(pageId)
      .then((payloadComments) => {
        // Clear existing comments and load from Payload
        const currentComments = commentStore.getComments();
        currentComments.forEach((comment) => {
          if (comment.type === 'thread') {
            commentStore.deleteCommentOrThread(comment);
          } else {
            commentStore.deleteCommentOrThread(comment);
          }
        });

        // Add comments from Payload (preserve nodeKeys from Payload)
        payloadComments.forEach((comment) => {
          // nodeKey is already included in the comment from Payload
          commentStore.addComment(comment);
        });
      })
      .catch((error) => {
        console.error('Failed to load comments from Payload:', error);
      })
      .finally(() => {
        setIsLoadingComments(false);
      });
  }, [pageId, dataAdapter, commentStore]);

  useEffect(() => {
    if (providerFactory) {
      const provider = providerFactory('comments', yjsDocMap);
      return commentStore.registerCollaboration(provider);
    }
  }, [commentStore, providerFactory, yjsDocMap]);

  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      // Restore selection
      if (selection !== null) {
        selection.dirty = true;
      }
    });
    setShowCommentInput(false);
  }, [editor]);

  const deleteCommentOrThread = useCallback(
    async (comment: Comment | Thread, thread?: Thread) => {
      if (comment.type === 'comment') {
        const deletionInfo = commentStore.deleteCommentOrThread(comment, thread);
        if (!deletionInfo) {
          return;
        }
        const { markedComment, index } = deletionInfo;
        commentStore.addComment(markedComment, thread, index);

        // Persist to Payload
        if (pageId && dataAdapter?.updateComment) {
          try {
            await dataAdapter.updateComment(pageId, comment.id, {
              deleted: true,
              content: '[Deleted Comment]',
            });
          } catch (error) {
            console.error('Failed to delete comment in Payload:', error);
          }
        }
      } else {
        commentStore.deleteCommentOrThread(comment);

        // Remove ids from associated marks - do this synchronously to preserve text formatting
        const id = thread !== undefined ? thread.id : comment.id;
        const markNodeKeys = markNodeMap.get(id);
        if (markNodeKeys !== undefined) {
          editor.update(() => {
            $addUpdateTag(COMMENT_DELETION_TAG);
            for (const key of markNodeKeys) {
              const node: null | MarkNode = $getNodeByKey(key);
              if ($isMarkNode(node)) {
                node.deleteID(id);
                if (node.getIDs().length === 0) {
                  $unwrapMarkNode(node);
                }
              }
            }
          }, { tag: COMMENT_DELETION_TAG });
        }

        // Persist to Payload (fire and forget to avoid blocking)
        if (pageId && dataAdapter?.deleteComment) {
          dataAdapter.deleteComment(pageId, comment.id).catch((error) => {
            console.error('Failed to delete thread in Payload:', error);
          });
        }
      }
    },
    [commentStore, editor, markNodeMap, pageId, dataAdapter]
  );

  const submitAddComment = useCallback(
    async (
      commentOrThread: Comment | Thread,
      isInlineComment: boolean,
      thread?: Thread,
      selection?: RangeSelection | null
    ) => {
      commentStore.addComment(commentOrThread, thread);

      // Persist to Payload
      if (pageId && dataAdapter?.createComment) {
        try {
          if (commentOrThread.type === 'thread') {
            const thread = commentOrThread as Thread;
            await dataAdapter.createComment(pageId, {
              author: thread.comments[0]?.author || 'Unknown',
              content: thread.comments[0]?.content || '',
              quote: thread.quote,
              nodeKey: (thread as any).nodeKey,
            });
          } else {
            const comment = commentOrThread as Comment;
            await dataAdapter.createComment(pageId, {
              author: comment.author,
              content: comment.content,
              threadId: thread?.id || null,
              nodeKey: (comment as any).nodeKey,
            });
          }
        } catch (error) {
          console.error('Failed to save comment to Payload:', error);
        }
      }

      if (isInlineComment) {
        editor.update(() => {
          if ($isRangeSelection(selection)) {
            const isBackward = selection.isBackward();
            const id = commentOrThread.id;

            // Wrap content in a MarkNode
            $wrapSelectionInMarkNode(selection, isBackward, id);
          }
        });
        setShowCommentInput(false);
      }
    },
    [commentStore, editor, pageId, dataAdapter]
  );

  useEffect(() => {
    const changedElems: Array<HTMLElement> = [];
    for (let i = 0; i < activeIDs.length; i++) {
      const id = activeIDs[i];
      const keys = markNodeMap.get(id);
      if (keys !== undefined) {
        for (const key of keys) {
          const elem = editor.getElementByKey(key);
          if (elem !== null) {
            elem.classList.add('selected');
            changedElems.push(elem);
            setShowComments(true);
          }
        }
      }
    }
    return () => {
      for (let i = 0; i < changedElems.length; i++) {
        const changedElem = changedElems[i];
        changedElem.classList.remove('selected');
      }
    };
  }, [activeIDs, editor, markNodeMap]);

  useEffect(() => {
    const markNodeKeysToIDs: Map<NodeKey, Array<string>> = new Map();

    return mergeRegister(
      registerNestedElementResolver<MarkNode>(
        editor,
        MarkNode,
        (from: MarkNode) => {
          return $createMarkNode(from.getIDs());
        },
        (from: MarkNode, to: MarkNode) => {
          // Merge the IDs
          const ids = from.getIDs();
          ids.forEach((id) => {
            to.addID(id);
          });
        }
      ),
      editor.registerMutationListener(MarkNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            const node: null | MarkNode = $getNodeByKey(key);
            let ids: NodeKey[] = [];

            if (mutation === 'destroyed') {
              ids = markNodeKeysToIDs.get(key) || [];
            } else if ($isMarkNode(node)) {
              ids = node.getIDs();
            }

            for (let i = 0; i < ids.length; i++) {
              const id = ids[i];
              let markNodeKeys = markNodeMap.get(id);
              markNodeKeysToIDs.set(key, ids);

              if (mutation === 'destroyed') {
                if (markNodeKeys !== undefined) {
                  markNodeKeys.delete(key);
                  if (markNodeKeys.size === 0) {
                    markNodeMap.delete(id);
                  }
                }
              } else {
                if (markNodeKeys === undefined) {
                  markNodeKeys = new Set();
                  markNodeMap.set(id, markNodeKeys);
                }
                if (!markNodeKeys.has(key)) {
                  markNodeKeys.add(key);
                }
              }
            }
          }
        });
      }, { skipInitialization: false }),
      editor.registerUpdateListener(({ editorState, tags }) => {
        editorState.read(() => {
          const selection = $getSelection();
          let hasActiveIds = false;
          let hasAnchorKey = false;

          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              const commentIDs = $getMarkIDs(
                anchorNode,
                selection.anchor.offset
              );
              if (commentIDs !== null) {
                setActiveIDs(commentIDs);
                hasActiveIds = true;
              }
              if (!selection.isCollapsed()) {
                setActiveAnchorKey(anchorNode.getKey());
                hasAnchorKey = true;
              }
            }
          }
          if (!hasActiveIds) {
            setActiveIDs((_activeIds) =>
              _activeIds.length === 0 ? _activeIds : []
            );
          }
          if (!hasAnchorKey) {
            setActiveAnchorKey(null);
          }
          if (!tags.has(COLLABORATION_TAG) && $isRangeSelection(selection)) {
            setShowCommentInput(false);
          }
        });
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          const domSelection = getDOMSelection(editor._window);
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setShowCommentInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor, markNodeMap]);

  const onAddComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

  return (
    <>
      {commentModeEnabled && showCommentInput &&
        createPortal(
          <CommentInputBox
            editor={editor}
            cancelAddComment={cancelAddComment}
            submitAddComment={submitAddComment}
          />,
          document.body
        )}
      {commentModeEnabled &&
        activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        !showCommentInput &&
        createPortal(
          <AddCommentBox
            anchorKey={activeAnchorKey}
            editor={editor}
            onAddComment={onAddComment}
          />,
          document.body
        )}
      {createPortal(
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2.5 right-2.5 z-10 hidden sm:flex ${showComments ? 'bg-df-node-selected' : ''}`}
          onClick={() => setShowComments(!showComments)}
          title={showComments ? 'Hide Comments' : 'Show Comments'}>
          <MessageSquare size={16} className="text-df-text-primary" />
        </Button>,
        showCommentsButtonContainer || document.body
      )}
      {(showComments || commentsContainer) &&
        createPortal(
          <CommentsPanel
            comments={comments}
            submitAddComment={submitAddComment}
            deleteCommentOrThread={deleteCommentOrThread}
            activeIDs={activeIDs}
            markNodeMap={markNodeMap}
            commentModeEnabled={commentModeEnabled}
            onToggleCommentMode={() => setCommentModeEnabled(!commentModeEnabled)}
          />,
          commentsContainer || document.body
        )}
    </>
  );
}
