import { PrismaClient } from '@prisma/client'
import { logger } from '../src/shared'

const prisma = new PrismaClient()

async function main() {
  logger.info('Starting database seeding...')

  // Create admin user profile
  const adminUserProfile = await prisma.userProfile.upsert({
    where: { clerkUserId: 'admin-clerk-user-id' },
    update: {},
    create: {
      clerkUserId: 'admin-clerk-user-id',
      displayName: 'Admin User',
      email: 'admin@supastack.com',
      role: 'OWNER',
    },
  })

  // Create user settings for admin
  await prisma.userSettings.upsert({
    where: { userId: adminUserProfile.id },
    update: {},
    create: {
      userId: adminUserProfile.id,
      theme: 'dark',
      language: 'en',
      notifications: { email: true, push: false },
      preferences: { dashboard: 'default' },
    },
  })

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
    },
  })

  // Create admin membership
  await prisma.userTenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: adminUserProfile.id,
        tenantId: defaultTenant.id,
      },
    },
    update: {},
    create: {
      userId: adminUserProfile.id,
      tenantId: defaultTenant.id,
      role: 'OWNER',
    },
  })

  // Create some sample entities
  const sampleEntities = await Promise.all([
    prisma.entity.create({
      data: {
        tenantId: defaultTenant.id,
        kind: 'service',
        name: 'Web Application',
        slug: 'web-app',
        data: {
          description: 'Main web application',
          status: 'active',
          version: '1.0.0',
        },
      },
    }),
    prisma.entity.create({
      data: {
        tenantId: defaultTenant.id,
        kind: 'database',
        name: 'PostgreSQL Database',
        slug: 'postgres-db',
        data: {
          description: 'Primary database',
          status: 'active',
          version: '15.0',
        },
      },
    }),
  ])

  // Create relation between entities
  await prisma.relation.create({
    data: {
      tenantId: defaultTenant.id,
      fromId: sampleEntities[0].id,
      toId: sampleEntities[1].id,
      type: 'depends_on',
      data: {
        description: 'Web app depends on database',
      },
    },
  })

  logger.info('Database seeding completed', {
    adminUserId: adminUserProfile.id,
    tenantId: defaultTenant.id,
    entitiesCreated: sampleEntities.length,
  })
}

main()
  .catch((e) => {
    logger.error('Seeding failed', { error: e.message })
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
