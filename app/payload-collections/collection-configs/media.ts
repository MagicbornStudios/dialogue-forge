import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { PAYLOAD_COLLECTIONS } from '../enums'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

export const Media: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.MEDIA,
  trash: true,
  upload: {
    staticDir: path.resolve(projectRoot, 'media'),
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        crop: 'center',
      },
      {
        name: 'medium',
        width: 600,
        height: 600,
        crop: 'center',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'externalProvider',
      type: 'text',
    },
    {
      name: 'externalId',
      type: 'text',
    },
    {
      name: 'externalUrl',
      type: 'text',
    },
    {
      name: 'secureUrl',
      type: 'text',
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
    {
      name: 'format',
      type: 'text',
    },
    {
      name: 'resourceType',
      type: 'text',
    },
  ],
}
