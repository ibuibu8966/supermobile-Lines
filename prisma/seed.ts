import { PrismaClient, SimStatus } from '@prisma/client'
import { encrypt } from '../lib/encryption'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create usage tags
  console.log('Creating usage tags...')
  const usageTags = await Promise.all([
    prisma.usageTag.upsert({
      where: { name: 'ポケカ認証' },
      update: {},
      create: {
        name: 'ポケカ認証',
        description: 'ポケモンカード認証用SIM',
      },
    }),
    prisma.usageTag.upsert({
      where: { name: '物販' },
      update: {},
      create: {
        name: '物販',
        description: '物販サービス用SIM',
      },
    }),
    prisma.usageTag.upsert({
      where: { name: 'アダアフィ' },
      update: {},
      create: {
        name: 'アダアフィ',
        description: 'アダルトアフィリエイト用SIM',
      },
    }),
  ])

  console.log(`✅ Created ${usageTags.length} usage tags`)

  // Create usage rules (example)
  console.log('Creating usage rules...')
  const rules = await Promise.all([
    prisma.usageRule.create({
      data: {
        usageTagId: usageTags[0].id, // ポケカ認証
        minContractDays: 30,
        priority: 1,
      },
    }),
    prisma.usageRule.create({
      data: {
        usageTagId: usageTags[1].id, // 物販
        supplierFilter: 'アーツ',
        minContractDays: 90,
        priority: 1,
      },
    }),
    prisma.usageRule.create({
      data: {
        usageTagId: usageTags[2].id, // アダアフィ
        minContractDays: 60,
        priority: 1,
      },
    }),
  ])

  console.log(`✅ Created ${rules.length} usage rules`)

  // Create service sources (placeholders - need to be configured with real values)
  console.log('Creating service sources...')

  // TODO: Replace with actual Supabase credentials before enabling
  const serviceSources = await Promise.all([
    prisma.serviceSource.upsert({
      where: { name: 'buppan' },
      update: {},
      create: {
        name: 'buppan',
        displayName: '物販',
        supabaseUrl: 'https://your-buppan-project.supabase.co',
        serviceRoleKey: encrypt('your-service-role-key-here'), // TODO: Replace with real key
        tableName: 'subscriptions', // TODO: Verify actual table name
        columnMappings: {
          iccid: 'iccid',
          customerId: 'customer_id',
          contractStartDate: 'start_date',
          contractEndDate: 'end_date',
          shippedDate: 'shipped_date',
          arrivedDate: 'arrived_date',
          returnedDate: 'returned_date',
        },
        enabled: false, // Disabled until configured with real credentials
      },
    }),
    prisma.serviceSource.upsert({
      where: { name: 'versus' },
      update: {},
      create: {
        name: 'versus',
        displayName: 'バーサス',
        supabaseUrl: 'https://your-versus-project.supabase.co',
        serviceRoleKey: encrypt('your-service-role-key-here'), // TODO: Replace with real key
        tableName: 'subscriptions', // TODO: Verify actual table name
        columnMappings: {
          iccid: 'iccid',
          customerId: 'customer_id',
          contractStartDate: 'start_date',
          contractEndDate: 'end_date',
          shippedDate: 'shipped_date',
          arrivedDate: 'arrived_date',
          returnedDate: 'returned_date',
        },
        enabled: false, // Disabled until configured with real credentials
      },
    }),
    prisma.serviceSource.upsert({
      where: { name: 'avaris' },
      update: {},
      create: {
        name: 'avaris',
        displayName: 'Avaris',
        supabaseUrl: 'https://your-avaris-project.supabase.co',
        serviceRoleKey: encrypt('your-service-role-key-here'), // TODO: Replace with real key
        tableName: 'subscriptions', // TODO: Verify actual table name
        columnMappings: {
          iccid: 'iccid',
          customerId: 'customer_id',
          contractStartDate: 'start_date',
          contractEndDate: 'end_date',
          shippedDate: 'shipped_date',
          arrivedDate: 'arrived_date',
          returnedDate: 'returned_date',
        },
        enabled: false, // Disabled until configured with real credentials
      },
    }),
  ])

  console.log(`✅ Created ${serviceSources.length} service sources (disabled - need configuration)`)

  // Create sample SIMs for testing
  console.log('Creating sample SIMs...')
  const sampleSims = await Promise.all([
    prisma.sim.upsert({
      where: { iccid: '8981100001234567890' },
      update: {},
      create: {
        iccid: '8981100001234567890',
        msisdn: '09012345678',
        supplier: 'アーツ',
        ownerCompany: 'Test Company A',
        plan: 'Plan A',
        customerType: 'Standard',
        supplierServiceStartDate: new Date('2024-01-01'),
        supplierServiceEndDate: new Date('2025-12-31'),
        status: SimStatus.IN_STOCK,
      },
    }),
    prisma.sim.upsert({
      where: { iccid: '8981100001234567891' },
      update: {},
      create: {
        iccid: '8981100001234567891',
        msisdn: '09012345679',
        supplier: 'ソフィア',
        ownerCompany: 'Test Company B',
        plan: 'Plan B',
        customerType: 'Premium',
        supplierServiceStartDate: new Date('2024-03-01'),
        supplierServiceEndDate: new Date('2026-02-28'),
        status: SimStatus.IN_STOCK,
      },
    }),
    prisma.sim.upsert({
      where: { iccid: '8981100001234567892' },
      update: {},
      create: {
        iccid: '8981100001234567892',
        msisdn: '09012345680',
        supplier: 'アーツ',
        ownerCompany: 'Test Company A',
        plan: 'Plan C',
        customerType: 'Standard',
        supplierServiceStartDate: new Date('2024-06-01'),
        supplierServiceEndDate: new Date('2025-05-31'),
        status: SimStatus.ACTIVE,
        currentServiceName: '物販',
        currentCustomerId: 'cust_001',
        currentContractStartDate: new Date('2024-06-15'),
        currentContractEndDate: new Date('2025-06-14'),
      },
    }),
  ])

  console.log(`✅ Created ${sampleSims.length} sample SIMs`)

  // Create sample history for the active SIM
  console.log('Creating sample history...')
  await prisma.simHistory.create({
    data: {
      iccid: '8981100001234567892',
      serviceName: '物販',
      customerId: 'cust_001',
      contractStartDate: new Date('2024-06-15'),
      contractEndDate: new Date('2025-06-14'),
      shippedDate: new Date('2024-06-10'),
      arrivedDate: new Date('2024-06-12'),
      usageTagId: usageTags[1].id, // 物販
      msisdnSnapshot: '09012345680',
    },
  })

  console.log('✅ Created sample history')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
