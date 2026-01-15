import type { ReactNode } from 'react';

interface WriterLayoutProps {
  sidebar: ReactNode;
  editor: ReactNode;
  className?: string;
}

export function WriterLayout({ sidebar, editor, className }: WriterLayoutProps) {
  return (
    <div className={`flex min-h-0 flex-1 gap-2 p-2 ${className ?? ''}`}>
      <aside className="flex min-h-0 w-[320px] min-w-[260px] flex-col">
        {sidebar}
      </aside>
      <section className="flex min-h-0 flex-1 flex-col">
        {editor}
      </section>
    </div>
  );
}
