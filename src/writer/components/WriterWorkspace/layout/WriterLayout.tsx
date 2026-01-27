import * as React from 'react';
import type { ReactNode } from 'react';
import { FORGE_NODE_TYPE } from '@/shared/types/forge-graph';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';

interface WriterLayoutProps {
  sidebar: ReactNode;
  editor: ReactNode;
  className?: string;
}

export function WriterLayout({ sidebar, editor, className }: WriterLayoutProps) {
  const activePageId = useWriterWorkspaceStore((state) => state.activePageId);
  const pageLayout = useWriterWorkspaceStore((state) => state.pageLayout);
  const hasActivePage = activePageId !== null;
  const contextNodeType = hasActivePage ? FORGE_NODE_TYPE.PAGE : null;
  const isFullWidth = activePageId
    ? pageLayout.fullWidthByPageId[activePageId] ?? true // Default to full-width for playground-style editor
    : true;
  const contentClassName = isFullWidth
    ? 'w-full'
    : 'mx-auto w-full max-w-4xl';

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${className ?? ''}`}
      data-domain="writer"
      data-editor-scope="writer"
      data-context-node-type={contextNodeType ?? undefined}
      data-focused={hasActivePage ? 'true' : 'false'}
    >
      <div className="flex min-h-0 flex-1">
        <aside className="flex min-h-0 w-[320px] min-w-[260px] flex-col border-r border-df-node-border pr-2">
          {sidebar}
        </aside>
        <section className="flex min-h-0 flex-1 flex-col pl-2">
          <div className={`flex min-h-0 flex-1 flex-col ${contentClassName}`}>
            <div className="flex min-h-0 flex-1 flex-col">
              {editor}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
