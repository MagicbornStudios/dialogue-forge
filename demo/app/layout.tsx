import type { Metadata } from 'next';
import '../styles/globals.css';
import { BrandedLayout } from '@portfolio/server-template/components/BrandedLayout';

export const metadata: Metadata = {
  title: 'Dialogue Forge - Visual Dialogue Editor',
  description: 'Interactive demo of Dialogue Forge - a visual node-based dialogue editor with Yarn Spinner support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BrandedLayout
          packageName="Dialogue Forge"
          packageDescription="Visual node-based dialogue editor with Yarn Spinner support"
          packageRepo="https://github.com/yourusername/dialogue-forge"
          portfolioUrl="https://your-portfolio.com"
        >
          {children}
        </BrandedLayout>
      </body>
    </html>
  );
}

