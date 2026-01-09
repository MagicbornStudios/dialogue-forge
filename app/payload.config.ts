import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync } from 'fs'

import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import type { Payload } from 'payload'
import { seedAdmin } from './payload-seed'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure data directory exists
// Use absolute path from project root to avoid issues with spaces in Windows paths
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.resolve(projectRoot, 'app', 'data')

if (!existsSync(dataDir)) {
  try {
    mkdirSync(dataDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create data directory:', error)
  }
}

// SQLite adapter handles path normalization
const dbPath = path.resolve(dataDir, 'payload.db')

export default buildConfig({
  // ============================
  // Core
  // ============================
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',

  editor: lexicalEditor(),

  // ============================
  // Database
  // ============================
  db: sqliteAdapter({
    client: {
      url: `file:${dbPath}`,
    },
  }),

  // ============================
  // Admin
  // ============================
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(__dirname),
    },
  },

  // ============================
  // Collections
  // ============================
  collections: [
    {
      slug: 'users',
      auth: {
        tokenExpiration: 60 * 60 * 24 * 7, // 7 days
        verify: false,
        maxLoginAttempts: 10,
        lockTime: 600000, // 10 minutes
      },
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],

  // ============================
  // Media / Images
  // ============================
  sharp,

  // ============================
  // TypeScript
  // ============================
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // ============================
  // GraphQL
  // ============================
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'schema.graphql'),
  },

  // ============================
  // Hooks
  // ============================
  onInit: async (payload: Payload) => {
    // Seed admin user on initialization
    if (process.env.NODE_ENV !== 'production') {
      await seedAdmin(payload).catch((error) => {
        console.error('Failed to seed admin user:', error)
      })
    }
  },
})
