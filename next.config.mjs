import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const payloadPackagePath = path.resolve(
  __dirname,
  'node_modules/@payloadcms/next',
);

let withPayload = (config) => config;

if (fs.existsSync(payloadPackagePath)) {
  const payloadModule = await import('@payloadcms/next/withPayload');
  withPayload = payloadModule.withPayload;
} else {
  console.warn(
    '[next.config] Optional dependency @payloadcms/next is not installed; skipping withPayload.',
  );
}

/**
 * Next.js config notes:
 * - Do NOT use transpilePackages for the package that is the Next app itself.
 * - Keep aliases tight (./src) to avoid Next watching/transpiling the entire repo.
 * - Use Turbopack aliases separately via turbopack.resolveAlias.
 */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Remove this. Only use transpilePackages for *external* workspace packages.
  // transpilePackages: ['@magicborn/dialogue-forge'],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,

      // Tight boundary: your import root points to source, not repo root.
      '@magicborn/dialogue-forge': path.resolve(__dirname, './src'),

      // Payload config alias (server-side usage)
      '@payload-config': path.resolve(__dirname, './app/payload.config.ts'),
    };
    return config;
  },

  turbopack: {
    resolveAlias: {
      '@magicborn/dialogue-forge': './src',
      '@payload-config': './app/payload.config.ts',
    },
  },
};

export default withPayload(nextConfig);
