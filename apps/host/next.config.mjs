import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

let withPayload = (config) => config;
try {
  const payloadModule = await import('@payloadcms/next/withPayload');
  withPayload = payloadModule.withPayload;
} catch {
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

  // Externalize server-only packages so webpack does not bundle them (avoids parsing README/LICENSE in libsql)
  serverExternalPackages: [
    'sharp',
    '@payloadcms/db-sqlite',
    'libsql',
    '@libsql/client',
    '@libsql/hrana-client',
    '@libsql/isomorphic-fetch',
    '@libsql/isomorphic-ws',
  ],

  // Silence Sass deprecation warnings from PayloadCMS node_modules and sass-loader
  sassOptions: {
    silenceDeprecations: ['import', 'legacy-js-api'],
  },

  // Transpile external packages that need to be processed by Next.js
  transpilePackages: ['@langchain/core', '@copilotkit/runtime'],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,

      // Tight boundary: import roots point to package source (not repo root).
      '@magicborn/dialogue-forge': path.resolve(__dirname, '../../packages/dialogue-forge/src'),
      '@magicborn/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@magicborn/runtime': path.resolve(__dirname, '../../packages/runtime/src'),
      '@magicborn/forge': path.resolve(__dirname, '../../packages/forge/src'),
      '@magicborn/writer': path.resolve(__dirname, '../../packages/writer/src'),
      '@magicborn/video': path.resolve(__dirname, '../../packages/video/src'),
      '@magicborn/characters': path.resolve(__dirname, '../../packages/characters/src'),
      '@magicborn/ai': path.resolve(__dirname, '../../packages/ai/src'),

      // Payload config alias (server-side usage)
      '@payload-config': path.resolve(__dirname, './app/payload.config.ts'),

      // Ensure nested @payloadcms packages resolve payload subpaths (Node resolution works with pnpm on Vercel)
      ...(function () {
        try {
          return {
            'payload/shared': require.resolve('payload/dist/exports/shared.js'),
            'payload/internal': require.resolve('payload/dist/exports/internal.js'),
          };
        } catch {
          return {};
        }
      })(),
    };

    // Silence webpack warnings from PayloadCMS node_modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/payload/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },

  turbopack: {
    resolveAlias: {
      '@magicborn/dialogue-forge': '../../packages/dialogue-forge/src',
      '@magicborn/shared': '../../packages/shared/src',
      '@magicborn/runtime': '../../packages/runtime/src',
      '@magicborn/forge': '../../packages/forge/src',
      '@magicborn/writer': '../../packages/writer/src',
      '@magicborn/video': '../../packages/video/src',
      '@magicborn/characters': '../../packages/characters/src',
      '@magicborn/ai': '../../packages/ai/src',
      '@payload-config': './app/payload.config.ts',
      // Relative paths so Turbopack does not use Windows absolute paths (not implemented)
      'payload/shared': '../../node_modules/payload/dist/exports/shared.js',
      'payload/internal': '../../node_modules/payload/dist/exports/internal.js',
    },
  },
};

export default withPayload(nextConfig);
