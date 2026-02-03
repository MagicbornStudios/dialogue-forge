import type { Metadata } from 'next';
import { headers } from 'next/headers';
import 'reactflow/dist/style.css';
import 'react-tooltip/dist/react-tooltip.css';
import '@twick/studio/dist/studio.css';
import '@/styles/globals.css';
import { QueryClientProvider } from './lib/providers/query-provider';

export const metadata: Metadata = {
  title: 'Dialogue Forge - Visual Dialogue Editor',
  description: 'Interactive demo of Dialogue Forge - a visual node-based dialogue editor with Yarn Spinner support',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const isPayloadRoute = headersList.get('x-is-payload-route') === 'true';
  
  // Payload routes handle their own HTML structure via RootLayout
  // Skip HTML wrapper for Payload admin and API routes
  if (isPayloadRoute) {
    // For Payload routes, just pass through children (Payload's RootLayout will handle HTML)
    return <>{children}</>;
  }
  
  // For regular routes, render HTML structure
  return (
    <html lang="en">
      <body>
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}

