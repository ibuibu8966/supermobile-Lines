import { prisma } from '@/lib/prisma'
import { SimStatus } from '@prisma/client'
import { daysBetween } from '@/lib/utils'

interface AvailabilityParams {
  usageTagId: number
  startDate: Date
  endDate: Date
  excludeCurrentlyAssigned: boolean
}

/**
 * Calculate available SIM count for a usage tag and date range
 */
export async function calculateAvailability(params: AvailabilityParams) {
  const { usageTagId, startDate, endDate, excludeCurrentlyAssigned } = params

  // Get usage tag
  const usageTag = await prisma.usageTag.findUnique({
    where: { id: usageTagId },
  })

  if (!usageTag) {
    throw new Error('Usage tag not found')
  }

  // Get usage rules for this tag (ordered by priority desc)
  const rules = await prisma.usageRule.findMany({
    where: { usageTagId },
    orderBy: { priority: 'desc' },
  })

  if (rules.length === 0) {
    throw new Error('No rules defined for this usage tag')
  }

  const requestedDays = daysBetween(startDate, endDate)

  // Try each rule by priority
  for (const rule of rules) {
    // Build where clause
    const where: any = {
      status: { in: [SimStatus.IN_STOCK, SimStatus.ACTIVE] },
    }

    if (rule.supplierFilter) {
      where.supplier = rule.supplierFilter
    }

    if (rule.planFilter) {
      where.plan = rule.planFilter
    }

    // Date range checks
    where.AND = [
      {
        OR: [
          { supplierServiceStartDate: null },
          { supplierServiceStartDate: { lte: startDate } },
        ],
      },
      {
        OR: [
          { supplierServiceEndDate: null },
          { supplierServiceEndDate: { gte: endDate } },
        ],
      },
    ]

    if (excludeCurrentlyAssigned) {
      where.AND.push({
        OR: [
          { currentServiceName: null },
          { currentContractEndDate: { lt: startDate } },
        ],
      })
    }

    // Get matching SIMs
    const matchingSims = await prisma.sim.findMany({ where })

    // Apply additional validations
    const availableSims = matchingSims.filter((sim) => {
      // Check minimum contract days from rule
      if (sim.supplierServiceStartDate && sim.supplierServiceEndDate) {
        const contractDays = daysBetween(
          sim.supplierServiceStartDate,
          sim.supplierServiceEndDate
        )
        if (contractDays < rule.minContractDays) {
          return false
        }
        if (contractDays < requestedDays) {
          return false
        }
      }

      return true
    })

    // If we found matches, return them (use first matching rule)
    if (availableSims.length > 0) {
      return {
        usageTagId,
        usageTagName: usageTag.name,
        requestedPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        availableCount: availableSims.length,
        sims: availableSims.map((sim) => ({
          iccid: sim.iccid,
          msisdn: sim.msisdn,
          supplier: sim.supplier,
          plan: sim.plan,
        })),
      }
    }
  }

  // No matching SIMs found
  return {
    usageTagId,
    usageTagName: usageTag.name,
    requestedPeriod: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    availableCount: 0,
    sims: [],
  }
}
