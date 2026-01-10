import { prisma } from '@/lib/prisma'
import { Sim, SimStatus, Prisma } from '@prisma/client'
import { SimListQuery } from '@/lib/validation'

/**
 * Get SIMs with filtering, pagination, and sorting
 */
export async function getSimsList(query: SimListQuery) {
  const {
    status,
    supplier,
    serviceName,
    usageTagId,
    msisdn,
    search,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = query

  // Build where clause
  const where: Prisma.SimWhereInput = {}

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status
  }

  if (supplier) {
    where.supplier = supplier
  }

  if (serviceName) {
    where.currentServiceName = serviceName
  }

  if (msisdn) {
    where.msisdn = { contains: msisdn }
  }

  if (search) {
    where.OR = [
      { iccid: { contains: search } },
      { msisdn: { contains: search } },
    ]
  }

  // Get total count
  const total = await prisma.sim.count({ where })

  // Get paginated results
  const skip = (page - 1) * pageSize
  const data = await prisma.sim.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      [sortBy]: sortOrder,
    },
  })

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/**
 * Get a single SIM by ICCID with history
 */
export async function getSimDetail(iccid: string) {
  const sim = await prisma.sim.findUnique({
    where: { iccid },
  })

  if (!sim) {
    return null
  }

  const history = await prisma.simHistory.findMany({
    where: { iccid },
    include: {
      usageTag: true,
    },
    orderBy: {
      contractStartDate: 'desc',
    },
  })

  return {
    sim,
    history,
  }
}

/**
 * Create or update a SIM (upsert)
 */
export async function upsertSim(data: {
  iccid: string
  msisdn?: string | null
  supplier: string
  ownerCompany?: string | null
  plan?: string | null
  customerType?: string | null
  supplierServiceStartDate?: Date | null
  supplierServiceEndDate?: Date | null
  status?: SimStatus
}) {
  return await prisma.sim.upsert({
    where: { iccid: data.iccid },
    update: {
      msisdn: data.msisdn,
      supplier: data.supplier,
      ownerCompany: data.ownerCompany,
      plan: data.plan,
      customerType: data.customerType,
      supplierServiceStartDate: data.supplierServiceStartDate,
      supplierServiceEndDate: data.supplierServiceEndDate,
      status: data.status,
      updatedAt: new Date(),
    },
    create: {
      iccid: data.iccid,
      msisdn: data.msisdn,
      supplier: data.supplier,
      ownerCompany: data.ownerCompany,
      plan: data.plan,
      customerType: data.customerType,
      supplierServiceStartDate: data.supplierServiceStartDate,
      supplierServiceEndDate: data.supplierServiceEndDate,
      status: data.status || SimStatus.IN_STOCK,
    },
  })
}

/**
 * Get SIM by ICCID (simple lookup)
 */
export async function getSimByIccid(iccid: string): Promise<Sim | null> {
  return await prisma.sim.findUnique({
    where: { iccid },
  })
}
