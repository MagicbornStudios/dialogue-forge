'use client';

import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WriterDataAdapter } from '@magicborn/writer/lib/data-adapter/writer-adapter';
import {
  fetchWriterPages,
  fetchWriterPage,
  fetchWriterComments,
  useCreateWriterPage,
  useUpdateWriterPage,
  useDeleteWriterPage,
  useCreateWriterComment,
  useUpdateWriterComment,
  useDeleteWriterComment,
} from './writer-queries';
import { WriterDataContext } from '@magicborn/writer';

type Props = {
  children: React.ReactNode;
};

/**
 * Provides WriterDataAdapter implemented via React Query.
 * Use with ForgeDataProvider when WriterWorkspace needs narrative graph from forge.
 */
export function WriterDataProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const createPage = useCreateWriterPage();
  const updatePage = useUpdateWriterPage();
  const deletePage = useDeleteWriterPage();
  const createComment = useCreateWriterComment();
  const updateComment = useUpdateWriterComment();
  const deleteComment = useDeleteWriterComment();

  const adapter = useMemo<WriterDataAdapter>(
    () => ({
      listPages: (projectId, narrativeGraphId) =>
        fetchWriterPages(queryClient, projectId, narrativeGraphId),
      getPage: (pageId) => fetchWriterPage(queryClient, pageId),
      createPage: (input) => createPage.mutateAsync(input),
      updatePage: (pageId, patch) => updatePage.mutateAsync({ pageId, patch }),
      deletePage: (pageId) => deletePage.mutateAsync(pageId).then(() => undefined),

      listComments: (pageId) => fetchWriterComments(queryClient, pageId),
      createComment: (pageId, comment) =>
        createComment.mutateAsync({ pageId, input: comment }),
      updateComment: (pageId, commentId, patch) =>
        updateComment.mutateAsync({ pageId, commentId, patch }),
      deleteComment: (pageId, commentId) =>
        deleteComment.mutateAsync({ pageId, commentId }).then(() => undefined),
    }),
    [
      queryClient,
      createPage,
      updatePage,
      deletePage,
      createComment,
      updateComment,
      deleteComment,
    ]
  );

  return (
    <WriterDataContext.Provider value={adapter}>
      {children}
    </WriterDataContext.Provider>
  );
}
