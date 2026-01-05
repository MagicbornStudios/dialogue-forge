import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transpilePackages: ['@magicborn/dialogue-forge'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@magicborn/dialogue-forge': path.resolve(__dirname, '.'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@magicborn/dialogue-forge': path.resolve(__dirname, '.'),
    },
  },
};

export default nextConfig;

