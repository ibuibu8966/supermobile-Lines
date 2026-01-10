import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { SimImportSchema, SimImportData } from '@/lib/validation'
import { SimStatus } from '@prisma/client'
import { ZodError } from 'zod'

interface ImportError {
  row: number
  iccid: string
  error: string
}

interface ImportResult {
  success: number
  errors: ImportError[]
  summary: {
    total: number
    created: number
    updated: number
    failed: number
  }
}

/**
 * Process CSV file and import SIMs
 */
export async function importSimsFromCsv(fileContent: string): Promise<ImportResult> {
  const errors: ImportError[] = []
  const validRecords: SimImportData[] = []

  // Parse CSV
  const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  })

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`)
  }

  // Validate each row
  parseResult.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2 // +2 because of header and 0-index

    try {
      const validatedRow = SimImportSchema.parse(row)
      validRecords.push(validatedRow)
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push({
          row: rowNumber,
          iccid: row.iccid || 'unknown',
          error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        })
      } else {
        errors.push({
          row: rowNumber,
          iccid: row.iccid || 'unknown',
          error: 'Unknown validation error',
        })
      }
    }
  })

  // If no valid records, return early
  if (validRecords.length === 0) {
    return {
      success: 0,
      errors,
      summary: {
        total: parseResult.data.length,
        created: 0,
        updated: 0,
        failed: errors.length,
      },
    }
  }

  // Import valid records
  let created = 0
  let updated = 0

  for (const record of validRecords) {
    try {
      // Check if SIM already exists
      const existing = await prisma.sim.findUnique({
        where: { iccid: record.iccid },
      })

      await prisma.sim.upsert({
        where: { iccid: record.iccid },
        update: {
          msisdn: record.msisdn,
          supplier: record.supplier,
          ownerCompany: record.ownerCompany,
          plan: record.plan,
          customerType: record.customerType,
          supplierServiceStartDate: record.supplierServiceStartDate,
          supplierServiceEndDate: record.supplierServiceEndDate,
          updatedAt: new Date(),
        },
        create: {
          iccid: record.iccid,
          msisdn: record.msisdn,
          supplier: record.supplier,
          ownerCompany: record.ownerCompany,
          plan: record.plan,
          customerType: record.customerType,
          supplierServiceStartDate: record.supplierServiceStartDate,
          supplierServiceEndDate: record.supplierServiceEndDate,
          status: SimStatus.IN_STOCK,
        },
      })

      if (existing) {
        updated++
      } else {
        created++
      }
    } catch (error) {
      errors.push({
        row: validRecords.indexOf(record) + 2,
        iccid: record.iccid,
        error: error instanceof Error ? error.message : 'Database error',
      })
    }
  }

  // Log import operation
  await prisma.syncLog.create({
    data: {
      operation: 'csv_import',
      status: errors.length === 0 ? 'completed' : 'partial_failure',
      recordsAffected: created + updated,
      metadata: {
        total: parseResult.data.length,
        created,
        updated,
        failed: errors.length,
      },
    },
  })

  return {
    success: created + updated,
    errors,
    summary: {
      total: parseResult.data.length,
      created,
      updated,
      failed: errors.length,
    },
  }
}
