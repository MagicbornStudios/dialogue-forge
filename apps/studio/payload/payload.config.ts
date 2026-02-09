import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync } from 'fs'

import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import type { Payload } from 'payload'
import { seedAdmin } from './seeds/payload-seed'
import {
  Projects,
  Media,
  Characters,
  Relationships,
  Pages,
  Blocks,
  ForgeGraphs,
  FlagSchemas,
  GameStates,
} from './collections'
import { seedProjectWithNarrativeGraph } from './seeds/graph-seeds'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Studio app root (parent of payload/)
const studioRoot = path.resolve(__dirname, '..')
const dataDir = path.resolve(studioRoot, 'data')
const migrationsDir = path.resolve(dataDir, 'migrations')

if (!existsSync(dataDir)) {
  try {
    mkdirSync(dataDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create data directory:', error)
  }
}

if (!existsSync(migrationsDir)) {
  try {
    mkdirSync(migrationsDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create migrations directory:', error)
  }
}

const dbPath = path.resolve(dataDir, 'payload.db')

// Generated types go to packages/types for consumption by studio and other packages
const typesOutputFile = path.resolve(__dirname, '../../../packages/types/src/payload-types.ts')

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',

  editor: lexicalEditor(),

  db: sqliteAdapter({
    client: {
      url: `file:${dbPath}`,
    },
    migrationDir: migrationsDir,
  }),

  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(__dirname),
    },
  },

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
    Projects,
    Media,
    Characters,
    Relationships,
    Pages,
    Blocks,
    ForgeGraphs,
    FlagSchemas,
    GameStates,
  ],

  sharp,

  typescript: {
    outputFile: typesOutputFile,
    autoGenerate: true,
  },

  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'schema.graphql'),
  },

  onInit: async (payload: Payload) => {
    if (process.env.NODE_ENV !== 'production') {
      await seedAdmin(payload).catch((error) => {
        console.error('Failed to seed admin user:', error)
      })
    }
    if (process.env.NODE_ENV !== 'production') {
      await seedProjectWithNarrativeGraph(payload).catch((error) => {
        console.error('Failed to seed project with narrative graph:', error)
      })
    }
  },
})
