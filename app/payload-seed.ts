import type { Payload } from 'payload'
import config from './payload.config'

/**
 * Seed the database with an admin user if it doesn't exist
 */
export async function seedAdmin(payload: Payload): Promise<void> {
  const adminEmail = 'admin@local.com'
  const adminPassword = 'changethis'

  try {
    // Check if admin user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: adminEmail,
        },
      },
      limit: 1,
    })

    if (existingUsers.docs.length > 0) {
      console.log('Admin user already exists, skipping seed')
      return
    }

    // Create admin user
    await payload.create({
      collection: 'users',
      data: {
        email: adminEmail,
        password: adminPassword,
        name: 'Admin',
      },
    })

    console.log('✅ Admin user created successfully')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error)
    throw error
  }
}
