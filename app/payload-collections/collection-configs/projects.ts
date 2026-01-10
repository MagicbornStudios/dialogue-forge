import type { CollectionConfig } from 'payload'
import { PAYLOAD_COLLECTIONS } from '../enums'

export const Projects: CollectionConfig = {
  slug: PAYLOAD_COLLECTIONS.PROJECTS,
  trash: true,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: false,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'settings',
      type: 'json',
    },
  ],
  versions: {
    drafts: false,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        // Auto-generate slug from name if slug is not provided
        if (operation === 'create' && data?.name && !data?.slug) {
          // Generate slug from name: lowercase, replace spaces with hyphens, remove special chars
          const slug = data.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Ensure slug is not empty
          if (slug) {
            data.slug = slug;
          } else {
            // Fallback: use a timestamp-based slug if name doesn't generate a valid slug
            data.slug = `project-${Date.now()}`;
          }
        }
      },
    ],
  },
}
