import { SimStatus } from '@prisma/client'

// Types for mock data
export interface MockSim {
  iccid: string
  msisdn: string | null
  supplier: string
  ownerCompany: string
  plan: string
  customerType: string
  supplierServiceStartDate: Date
  supplierServiceEndDate: Date
  currentServiceName: string | null
  currentCustomerId: string | null
  currentUsageTagId: number | null
  currentContractStartDate: Date | null
  currentContractEndDate: Date | null
  status: SimStatus
  createdAt: Date
  updatedAt: Date
}

export interface MockSimHistory {
  id: number
  iccid: string
  serviceName: string
  customerId: string
  usageTagId: number
  contractStartDate: Date
  contractEndDate: Date
  shippedDate: Date | null
  arrivedDate: Date | null
  returnedDate: Date | null
  msisdnSnapshot: string | null
  createdAt: Date
}

export interface MockUsageTag {
  id: number
  name: string
  description: string | null
  createdAt: Date
}

export interface MockUsageRule {
  id: number
  usageTagId: number
  usageTag: MockUsageTag
  supplierFilter: string | null
  planFilter: string | null
  minContractDays: number
  priority: number
  conditions: any
  createdAt: Date
}

export interface MockServiceSyncStatus {
  serviceName: string
  displayName: string
  lastSyncAt: Date | null
  status: 'success' | 'error' | 'pending'
  recordCount: number
  errorCount: number
  errorMessage: string | null
}

export interface MockSyncLog {
  id: number
  serviceName: string
  operation: string
  status: 'success' | 'error'
  recordCount: number
  errorMessage: string | null
  timestamp: Date
}

// Helper functions
function generateICCID(): string {
  const prefix = '8981100'
  const randomDigits = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0')
  return prefix + randomDigits
}

function generateMSISDN(): string {
  return '0' + Math.floor(Math.random() * 9000000000 + 1000000000).toString()
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Usage Tags
const usageTags: MockUsageTag[] = [
  { id: 1, name: '物販', description: '物販サービス用SIM', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'バーサス', description: 'バーサスサービス用SIM', createdAt: new Date('2024-01-01') },
  { id: 3, name: 'Avaris', description: 'Avarisサービス用SIM', createdAt: new Date('2024-01-01') },
  { id: 4, name: 'ポケカ認証', description: 'ポケカ認証用SIM', createdAt: new Date('2024-01-01') },
  { id: 5, name: 'アダアフィ', description: 'アダアフィリエイト用SIM', createdAt: new Date('2024-01-01') },
  { id: 6, name: 'デモ用', description: 'デモンストレーション用SIM', createdAt: new Date('2024-01-01') },
  { id: 7, name: 'テスト', description: 'テスト環境用SIM', createdAt: new Date('2024-01-01') },
]

export function generateMockUsageTags(): MockUsageTag[] {
  return usageTags
}

// Usage Rules
export function generateMockUsageRules(): MockUsageRule[] {
  return [
    {
      id: 1,
      usageTagId: 1,
      usageTag: usageTags[0],
      supplierFilter: 'アーツ',
      planFilter: null,
      minContractDays: 30,
      priority: 10,
      conditions: {},
      createdAt: new Date('2024-01-01')
    },
    {
      id: 2,
      usageTagId: 2,
      usageTag: usageTags[1],
      supplierFilter: null,
      planFilter: 'データ専用プラン',
      minContractDays: 60,
      priority: 5,
      conditions: {},
      createdAt: new Date('2024-01-01')
    },
    {
      id: 3,
      usageTagId: 3,
      usageTag: usageTags[2],
      supplierFilter: 'ソフィア',
      planFilter: null,
      minContractDays: 90,
      priority: 8,
      conditions: {},
      createdAt: new Date('2024-01-01')
    },
    {
      id: 4,
      usageTagId: 4,
      usageTag: usageTags[3],
      supplierFilter: 'アーツ',
      planFilter: '音声通話プラン',
      minContractDays: 14,
      priority: 15,
      conditions: {},
      createdAt: new Date('2024-01-01')
    },
    {
      id: 5,
      usageTagId: 5,
      usageTag: usageTags[4],
      supplierFilter: null,
      planFilter: null,
      minContractDays: 30,
      priority: 3,
      conditions: {},
      createdAt: new Date('2024-01-01')
    },
    // デモ用とテストにはルールなし（警告表示のため）
  ]
}

// SIM History Generator
export function generateMockHistory(iccid: string, simStatus: SimStatus, currentUsageTagId: number | null): MockSimHistory[] {
  const history: MockSimHistory[] = []

  // IN_STOCKの場合は履歴なし、または過去の履歴のみ
  if (simStatus === 'IN_STOCK') {
    // 30%の確率で過去の履歴を持つ
    if (Math.random() < 0.3) {
      const count = Math.floor(Math.random() * 2) + 1 // 1-2 records
      for (let i = 0; i < count; i++) {
        const contractStart = randomDate(new Date('2023-01-01'), new Date('2024-06-30'))
        const contractEnd = addDays(contractStart, 90 + Math.floor(Math.random() * 180))
        const shipped = addDays(contractStart, -7)
        const arrived = addDays(shipped, 3 + Math.floor(Math.random() * 10))
        const returned = addDays(contractEnd, 1 + Math.floor(Math.random() * 14))

        history.push({
          id: Math.floor(Math.random() * 1000000),
          iccid,
          serviceName: randomItem(['物販', 'バーサス', 'Avaris']),
          customerId: 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          usageTagId: randomItem(usageTags).id,
          contractStartDate: contractStart,
          contractEndDate: contractEnd,
          shippedDate: shipped,
          arrivedDate: arrived,
          returnedDate: returned,
          msisdnSnapshot: generateMSISDN(),
          createdAt: contractStart
        })
      }
    }
  }

  // ACTIVEの場合は現在の契約 + 過去の履歴
  if (simStatus === 'ACTIVE') {
    // 現在の契約
    const contractStart = randomDate(new Date('2024-06-01'), new Date('2025-01-01'))
    const contractEnd = addDays(contractStart, 90 + Math.floor(Math.random() * 180))
    const shipped = addDays(contractStart, -7)
    const arrived = addDays(shipped, 3 + Math.floor(Math.random() * 10))

    history.push({
      id: Math.floor(Math.random() * 1000000),
      iccid,
      serviceName: randomItem(['物販', 'バーサス', 'Avaris']),
      customerId: 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      usageTagId: currentUsageTagId || randomItem(usageTags).id,
      contractStartDate: contractStart,
      contractEndDate: contractEnd,
      shippedDate: shipped,
      arrivedDate: arrived,
      returnedDate: null,
      msisdnSnapshot: generateMSISDN(),
      createdAt: contractStart
    })

    // 50%の確率で過去の履歴も持つ
    if (Math.random() < 0.5) {
      const count = Math.floor(Math.random() * 2) + 1 // 1-2 past records
      for (let i = 0; i < count; i++) {
        const pastContractStart = randomDate(new Date('2023-01-01'), new Date('2024-05-31'))
        const pastContractEnd = addDays(pastContractStart, 90 + Math.floor(Math.random() * 180))
        const pastShipped = addDays(pastContractStart, -7)
        const pastArrived = addDays(pastShipped, 3 + Math.floor(Math.random() * 10))
        const pastReturned = addDays(pastContractEnd, 1 + Math.floor(Math.random() * 14))

        history.push({
          id: Math.floor(Math.random() * 1000000),
          iccid,
          serviceName: randomItem(['物販', 'バーサス', 'Avaris']),
          customerId: 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
          usageTagId: randomItem(usageTags).id,
          contractStartDate: pastContractStart,
          contractEndDate: pastContractEnd,
          shippedDate: pastShipped,
          arrivedDate: pastArrived,
          returnedDate: pastReturned,
          msisdnSnapshot: generateMSISDN(),
          createdAt: pastContractStart
        })
      }
    }
  }

  // RETURNINGの場合は契約終了済み + 返却処理中
  if (simStatus === 'RETURNING') {
    const contractStart = randomDate(new Date('2024-03-01'), new Date('2024-10-01'))
    const contractEnd = addDays(contractStart, 90 + Math.floor(Math.random() * 180))
    const shipped = addDays(contractStart, -7)
    const arrived = addDays(shipped, 3 + Math.floor(Math.random() * 10))

    history.push({
      id: Math.floor(Math.random() * 1000000),
      iccid,
      serviceName: randomItem(['物販', 'バーサス', 'Avaris']),
      customerId: 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      usageTagId: currentUsageTagId || randomItem(usageTags).id,
      contractStartDate: contractStart,
      contractEndDate: contractEnd,
      shippedDate: shipped,
      arrivedDate: arrived,
      returnedDate: null, // 返却中なのでまだnull
      msisdnSnapshot: generateMSISDN(),
      createdAt: contractStart
    })
  }

  // RETIREDの場合は複数の履歴
  if (simStatus === 'RETIRED') {
    const count = Math.floor(Math.random() * 3) + 2 // 2-4 records
    for (let i = 0; i < count; i++) {
      const contractStart = randomDate(new Date('2022-01-01'), new Date('2024-06-30'))
      const contractEnd = addDays(contractStart, 90 + Math.floor(Math.random() * 180))
      const shipped = addDays(contractStart, -7)
      const arrived = addDays(shipped, 3 + Math.floor(Math.random() * 10))
      const returned = addDays(contractEnd, 1 + Math.floor(Math.random() * 14))

      history.push({
        id: Math.floor(Math.random() * 1000000),
        iccid,
        serviceName: randomItem(['物販', 'バーサス', 'Avaris']),
        customerId: 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        usageTagId: randomItem(usageTags).id,
        contractStartDate: contractStart,
        contractEndDate: contractEnd,
        shippedDate: shipped,
        arrivedDate: arrived,
        returnedDate: returned,
        msisdnSnapshot: generateMSISDN(),
        createdAt: contractStart
      })
    }
  }

  // Sort by contract start date (newest first)
  return history.sort((a, b) => b.contractStartDate.getTime() - a.contractStartDate.getTime())
}

// SIM Generator
export function generateMockSims(count: number = 200): MockSim[] {
  const sims: MockSim[] = []
  const suppliers = ['アーツ', 'ソフィア']
  const ownerCompanies = ['株式会社モバイルテック', '株式会社コネクト', '合同会社ネットワークス']
  const plans = ['データ専用プラン', '音声通話プラン', 'SMS付きプラン', '大容量プラン']
  const customerTypes = ['個人', '法人', 'テスト']
  const services = ['物販', 'バーサス', 'Avaris']

  // Status distribution: 40% IN_STOCK, 45% ACTIVE, 10% RETURNING, 5% RETIRED
  const statusDistribution: SimStatus[] = [
    ...Array(40).fill('IN_STOCK'),
    ...Array(45).fill('ACTIVE'),
    ...Array(10).fill('RETURNING'),
    ...Array(5).fill('RETIRED')
  ]

  for (let i = 0; i < count; i++) {
    const iccid = generateICCID()
    const status = randomItem(statusDistribution) as SimStatus
    const supplier = Math.random() < 0.6 ? 'アーツ' : 'ソフィア' // 60% アーツ
    const ownerCompany = randomItem(ownerCompanies)
    const plan = randomItem(plans)
    const customerType = randomItem(customerTypes)

    // 仕入れ先契約期間
    const supplierStart = randomDate(new Date('2024-01-01'), new Date('2025-01-01'))
    const supplierEnd = addDays(supplierStart, 365 + Math.floor(Math.random() * 365)) // 1-2 years

    // 30% missing MSISDN
    const msisdn = Math.random() < 0.7 ? generateMSISDN() : null

    // Current assignment (only for ACTIVE and RETURNING)
    let currentServiceName: string | null = null
    let currentCustomerId: string | null = null
    let currentUsageTagId: number | null = null
    let currentContractStartDate: Date | null = null
    let currentContractEndDate: Date | null = null

    if (status === 'ACTIVE' || status === 'RETURNING') {
      currentServiceName = randomItem(services)
      currentCustomerId = 'CUST-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      currentUsageTagId = randomItem(usageTags).id
      currentContractStartDate = randomDate(new Date('2024-06-01'), new Date('2025-01-01'))
      currentContractEndDate = addDays(currentContractStartDate, 90 + Math.floor(Math.random() * 180))
    }

    // IN_STOCKでも稀に用途タグが設定されている（次回販売予定など）
    if (status === 'IN_STOCK' && Math.random() < 0.3) {
      currentUsageTagId = randomItem(usageTags).id
    }

    const createdAt = randomDate(new Date('2023-01-01'), new Date('2024-12-31'))
    const updatedAt = randomDate(createdAt, new Date())

    sims.push({
      iccid,
      msisdn,
      supplier,
      ownerCompany,
      plan,
      customerType,
      supplierServiceStartDate: supplierStart,
      supplierServiceEndDate: supplierEnd,
      currentServiceName,
      currentCustomerId,
      currentUsageTagId,
      currentContractStartDate,
      currentContractEndDate,
      status,
      createdAt,
      updatedAt
    })
  }

  return sims
}

// Service Sync Status
export function generateMockSyncStatus(): MockServiceSyncStatus[] {
  const now = new Date()

  return [
    {
      serviceName: 'bussan',
      displayName: '物販',
      lastSyncAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'success',
      recordCount: 125,
      errorCount: 0,
      errorMessage: null
    },
    {
      serviceName: 'versus',
      displayName: 'バーサス',
      lastSyncAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      status: 'error',
      recordCount: 0,
      errorCount: 3,
      errorMessage: 'Connection timeout: Could not reach Supabase instance'
    },
    {
      serviceName: 'avaris',
      displayName: 'Avaris',
      lastSyncAt: null,
      status: 'pending',
      recordCount: 0,
      errorCount: 0,
      errorMessage: null
    }
  ]
}

// Sync Log History
export function generateMockSyncLogs(): MockSyncLog[] {
  const logs: MockSyncLog[] = []
  const services = ['物販', 'バーサス', 'Avaris']
  const operations = ['Auto Sync', 'Manual Sync', 'CSV Import', 'Bulk Update']
  const errorMessages = [
    'Connection timeout: Could not reach Supabase instance',
    'Invalid data format in row 45',
    'Duplicate ICCID detected',
    'Authentication failed',
    null
  ]

  const now = new Date()

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 3 * 60 * 60 * 1000) // Every 3 hours
    const status: 'success' | 'error' = Math.random() < 0.8 ? 'success' : 'error'
    const errorMessage = status === 'error' ? randomItem(errorMessages.filter(m => m !== null)) : null

    logs.push({
      id: i + 1,
      serviceName: randomItem(services),
      operation: randomItem(operations),
      status,
      recordCount: status === 'success' ? Math.floor(Math.random() * 100) + 10 : 0,
      errorMessage: errorMessage as string | null,
      timestamp
    })
  }

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Export combined data
export function generateAllMockData() {
  const sims = generateMockSims(200)
  const usageTags = generateMockUsageTags()
  const usageRules = generateMockUsageRules()
  const syncStatus = generateMockSyncStatus()
  const syncLogs = generateMockSyncLogs()

  // Generate history for each SIM
  const simsWithHistory = sims.map(sim => ({
    ...sim,
    history: generateMockHistory(sim.iccid, sim.status, sim.currentUsageTagId)
  }))

  return {
    sims: simsWithHistory,
    usageTags,
    usageRules,
    syncStatus,
    syncLogs
  }
}
