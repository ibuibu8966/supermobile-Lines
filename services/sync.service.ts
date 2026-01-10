import { prisma } from '@/lib/prisma'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { SimStatus } from '@prisma/client'
import { ColumnMappings } from '@/types/supabase'

interface SyncResult {
  serviceName: string
  status: 'success' | 'failed'
  recordsChecked: number
  recordsUpdated: number
  historyCreated: number
  error?: string
}

/**
 * Sync all enabled services
 */
export async function syncAllServices(serviceNameFilter?: string): Promise<SyncResult[]> {
  const where = serviceNameFilter ? { name: serviceNameFilter, enabled: true } : { enabled: true }

  const serviceSources = await prisma.serviceSource.findMany({ where })

  const results: SyncResult[] = []

  for (const source of serviceSources) {
    try {
      const result = await syncService(source)
      results.push(result)
    } catch (error) {
      results.push({
        serviceName: source.name,
        status: 'failed',
        recordsChecked: 0,
        recordsUpdated: 0,
        historyCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Sync a single service
 */
async function syncService(source: any): Promise<SyncResult> {
  let recordsChecked = 0
  let recordsUpdated = 0
  let historyCreated = 0

  try {
    // Create Supabase client
    const supabase = createServiceSupabaseClient(source.supabaseUrl, source.serviceRoleKey)

    // Parse column mappings
    const mappings: ColumnMappings = source.columnMappings as ColumnMappings

    // TODO: Query external service table
    // For now, this is a placeholder since we don't have actual Supabase instances configured
    // In real implementation, you would do:
    // const { data: externalRecords, error } = await supabase
    //   .from(source.tableName)
    //   .select('*')
    //
    // if (error) throw error

    // Placeholder: simulate no data for now
    const externalRecords: any[] = []

    for (const externalRecord of externalRecords) {
      recordsChecked++

      const iccid = externalRecord[mappings.iccid]
      const customerId = externalRecord[mappings.customerId]
      const contractStartDate = externalRecord[mappings.contractStartDate]
        ? new Date(externalRecord[mappings.contractStartDate])
        : null
      const contractEndDate = externalRecord[mappings.contractEndDate]
        ? new Date(externalRecord[mappings.contractEndDate])
        : null

      // Get SIM from central DB
      const sim = await prisma.sim.findUnique({
        where: { iccid },
      })

      if (!sim) {
        // Skip if SIM doesn't exist in central DB
        continue
      }

      // Check if current state has changed
      const hasChanged =
        sim.currentServiceName !== source.name ||
        sim.currentCustomerId !== customerId ||
        sim.currentContractStartDate?.getTime() !== contractStartDate?.getTime() ||
        sim.currentContractEndDate?.getTime() !== contractEndDate?.getTime()

      if (hasChanged) {
        // Update SIM current state
        const now = new Date()
        const isActive = customerId && contractEndDate && contractEndDate > now

        await prisma.sim.update({
          where: { iccid },
          data: {
            currentServiceName: source.name,
            currentCustomerId: customerId,
            currentContractStartDate: contractStartDate,
            currentContractEndDate: contractEndDate,
            status: isActive ? SimStatus.ACTIVE : SimStatus.IN_STOCK,
            updatedAt: new Date(),
          },
        })

        recordsUpdated++

        // Create history record
        await prisma.simHistory.create({
          data: {
            iccid,
            serviceName: source.name,
            customerId,
            contractStartDate,
            contractEndDate,
            shippedDate: mappings.shippedDate
              ? externalRecord[mappings.shippedDate]
                ? new Date(externalRecord[mappings.shippedDate])
                : null
              : null,
            arrivedDate: mappings.arrivedDate
              ? externalRecord[mappings.arrivedDate]
                ? new Date(externalRecord[mappings.arrivedDate])
                : null
              : null,
            returnedDate: mappings.returnedDate
              ? externalRecord[mappings.returnedDate]
                ? new Date(externalRecord[mappings.returnedDate])
                : null
              : null,
            msisdnSnapshot: sim.msisdn,
            usageTagId: await detectUsageTagId(source.name),
          },
        })

        historyCreated++
      }
    }

    // Update service source sync status
    await prisma.serviceSource.update({
      where: { id: source.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      },
    })

    // Log sync operation
    await prisma.syncLog.create({
      data: {
        serviceName: source.name,
        operation: 'sync',
        status: 'completed',
        recordsAffected: recordsUpdated,
        metadata: {
          recordsChecked,
          recordsUpdated,
          historyCreated,
        },
      },
    })

    return {
      serviceName: source.name,
      status: 'success',
      recordsChecked,
      recordsUpdated,
      historyCreated,
    }
  } catch (error) {
    // Update service source with error
    await prisma.serviceSource.update({
      where: { id: source.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    // Log failed sync
    await prisma.syncLog.create({
      data: {
        serviceName: source.name,
        operation: 'sync',
        status: 'failed',
        recordsAffected: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}

/**
 * Auto-detect usage tag ID based on service name
 */
async function detectUsageTagId(serviceName: string): Promise<number | null> {
  // Simple heuristic mapping
  const tagNameMap: Record<string, string> = {
    buppan: '物販',
    versus: 'ポケカ認証',
    avaris: 'アダアフィ',
  }

  const tagName = tagNameMap[serviceName]
  if (!tagName) return null

  const tag = await prisma.usageTag.findUnique({
    where: { name: tagName },
  })

  return tag?.id || null
}
