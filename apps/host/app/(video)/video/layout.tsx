import type { PropsWithChildren } from 'react';

export default function VideoLayout({ children }: PropsWithChildren) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
