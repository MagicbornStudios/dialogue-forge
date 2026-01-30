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

  // Externalize sharp (native bindings) so Next resolves it from node_modules
  serverExternalPackages: ['sharp'],

  // Silence Sass deprecation warnings from PayloadCMS node_modules and sass-loader
  sassOptions: {
    silenceDeprecations: ['import', 'legacy-js-api'],
  },

  // Transpile external packages that need to be processed by Next.js
  transpilePackages: ['@langchain/core', '@copilotkit/runtime'],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,

      // Tight boundary: your import root points to source, not repo root.
      '@magicborn/dialogue-forge': path.resolve(__dirname, './src'),

      // Payload config alias (server-side usage)
      '@payload-config': path.resolve(__dirname, './app/payload.config.ts'),

      // Ensure nested @payloadcms packages resolve payload subpaths (e.g. payload/shared)
      'payload/shared': path.resolve(__dirname, 'node_modules/payload/dist/exports/shared.js'),
      'payload/internal': path.resolve(__dirname, 'node_modules/payload/dist/exports/internal.js'),
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
      '@magicborn/dialogue-forge': './src',
      '@payload-config': './app/payload.config.ts',
      // Relative paths so Turbopack does not use Windows absolute paths (not implemented)
      'payload/shared': './node_modules/payload/dist/exports/shared.js',
      'payload/internal': './node_modules/payload/dist/exports/internal.js',
    },
  },
};

export default withPayload(nextConfig);
