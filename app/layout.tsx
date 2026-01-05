import type { Metadata } from 'next';
import 'reactflow/dist/style.css';
import 'react-tooltip/dist/react-tooltip.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Dialogue Forge - Visual Dialogue Editor',
  description: 'Interactive demo of Dialogue Forge - a visual node-based dialogue editor with Yarn Spinner support',
};

// Tell Next.js this layout is static (no dynamic params/searchParams)
export const dynamic = 'force-static';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

