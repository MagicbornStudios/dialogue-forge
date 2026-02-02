import React from 'react';
import type { ForgeNode } from '@/forge/types/forge-graph';
import type { ForgePage } from '@/forge/types/narrative';

interface PageNodeFieldsProps {
  node: ForgeNode;
  pages: ForgePage[];
  isLoading?: boolean;
  onUpdate: (updates: Partial<ForgeNode>) => void;
}

export function PageNodeFields({ node, pages, isLoading = false, onUpdate }: PageNodeFieldsProps) {
  const selectedPageId = node.pageId ?? '';

  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Page</label>
        <select
          value={selectedPageId}
          onChange={(event) => {
            const nextId = event.target.value ? Number(event.target.value) : undefined;
            onUpdate({ pageId: nextId });
          }}
          disabled={isLoading}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none"
        >
          <option value="">{isLoading ? 'Loading pages...' : 'Select a page...'}</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title || `Page ${page.id}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Node Title</label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(event) => onUpdate({ label: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none"
          placeholder="Page node title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Node Summary</label>
        <textarea
          value={node.content || ''}
          onChange={(event) => onUpdate({ content: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none min-h-[100px] resize-y"
          placeholder="Page node summary"
        />
      </div>
    </>
  );
}
