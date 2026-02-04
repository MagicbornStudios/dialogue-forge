import type { Payload } from 'payload'

/**
 * Seed the database with admin user only
 */
export async function seedAdmin(payload: Payload): Promise<void> {
  const adminEmail = 'admin@local.com'
  const adminPassword = 'changethis'

  try {
    // ============================
    // 1. Create Admin User
    // ============================
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: adminEmail } },
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin',
        },
      })
      console.log('✅ Admin user created')
    }

    console.log('🎉 Admin user seeded successfully!')
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error)
    throw error
  }
}
