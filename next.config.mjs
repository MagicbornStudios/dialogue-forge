import path from 'path';
import { fileURLToPath } from 'url';
import { withPayload } from '@payloadcms/next/withPayload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transpilePackages: ['@magicborn/dialogue-forge'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@magicborn/dialogue-forge': path.resolve(__dirname, '.'),
      '@payload-config': path.resolve(__dirname, './app/payload.config.ts'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      // Use relative path for Turbopack on Windows compatibility
      '@magicborn/dialogue-forge': './',
      '@magicborn/dialogue-forge/*': './*',
      '@payload-config': './app/payload.config.ts',
    },
  },
};

export default withPayload(nextConfig);

