import { z } from 'zod'
import { SimStatus } from '@prisma/client'

// ==================== SIM SCHEMAS ====================

export const SimImportSchema = z.object({
  iccid: z.string()
    .min(19, "ICCID must be at least 19 digits")
    .max(20, "ICCID must be at most 20 digits")
    .regex(/^\d+$/, "ICCID must contain only digits"),

  msisdn: z.string()
    .min(10, "MSISDN must be at least 10 digits")
    .max(11, "MSISDN must be at most 11 digits")
    .regex(/^\d+$/, "MSISDN must contain only digits")
    .optional()
    .nullable()
    .transform(val => val || null),

  supplier: z.string()
    .min(1, "Supplier is required"),

  ownerCompany: z.string().optional().nullable().transform(val => val || null),
  plan: z.string().optional().nullable().transform(val => val || null),
  customerType: z.string().optional().nullable().transform(val => val || null),

  supplierServiceStartDate: z.union([
    z.string().datetime({ message: "Invalid date format" }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, "Date must be YYYY/MM/DD")
  ])
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return null
      const normalized = val.replace(/\//g, '-')
      return new Date(normalized)
    }),

  supplierServiceEndDate: z.union([
    z.string().datetime({ message: "Invalid date format" }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, "Date must be YYYY/MM/DD")
  ])
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return null
      const normalized = val.replace(/\//g, '-')
      return new Date(normalized)
    }),
}).refine(
  data => {
    if (data.supplierServiceStartDate && data.supplierServiceEndDate) {
      return data.supplierServiceEndDate >= data.supplierServiceStartDate
    }
    return true
  },
  {
    message: "Service end date must be after or equal to start date",
    path: ["supplierServiceEndDate"]
  }
)

export type SimImportData = z.infer<typeof SimImportSchema>

export const CreateSimSchema = z.object({
  iccid: z.string()
    .min(19, "ICCID must be at least 19 digits")
    .max(20, "ICCID must be at most 20 digits")
    .regex(/^\d+$/, "ICCID must contain only digits"),

  msisdn: z.string()
    .min(10, "MSISDN must be at least 10 digits")
    .max(11, "MSISDN must be at most 11 digits")
    .regex(/^\d+$/, "MSISDN must contain only digits")
    .optional()
    .nullable(),

  supplier: z.string().min(1, "Supplier is required"),
  ownerCompany: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  customerType: z.string().optional().nullable(),

  supplierServiceStartDate: z.string().datetime().optional().nullable()
    .transform(val => val ? new Date(val) : null),
  supplierServiceEndDate: z.string().datetime().optional().nullable()
    .transform(val => val ? new Date(val) : null),

  status: z.nativeEnum(SimStatus).optional(),
}).refine(
  data => {
    if (data.supplierServiceStartDate && data.supplierServiceEndDate) {
      return data.supplierServiceEndDate >= data.supplierServiceStartDate
    }
    return true
  },
  {
    message: "Service end date must be after or equal to start date",
    path: ["supplierServiceEndDate"]
  }
)

export type CreateSimData = z.infer<typeof CreateSimSchema>

// ==================== QUERY SCHEMAS ====================

export const SimListQuerySchema = z.object({
  status: z.union([
    z.nativeEnum(SimStatus),
    z.array(z.nativeEnum(SimStatus))
  ]).optional(),
  supplier: z.string().optional(),
  serviceName: z.string().optional(),
  usageTagId: z.coerce.number().optional(),
  msisdn: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['iccid', 'updatedAt', 'supplier']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type SimListQuery = z.infer<typeof SimListQuerySchema>

export const AvailabilityQuerySchema = z.object({
  usageTagId: z.coerce.number().min(1, "Usage tag ID is required"),
  startDate: z.string().datetime().transform(val => new Date(val)),
  endDate: z.string().datetime().transform(val => new Date(val)),
  excludeCurrentlyAssigned: z.coerce.boolean().default(true),
}).refine(
  data => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
)

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>

export const PublicMsisdnQuerySchema = z.object({
  iccid: z.string()
    .min(19, "ICCID must be at least 19 digits")
    .max(20, "ICCID must be at least 20 digits")
    .regex(/^\d+$/, "ICCID must contain only digits"),
})

export type PublicMsisdnQuery = z.infer<typeof PublicMsisdnQuerySchema>

export const SyncQuerySchema = z.object({
  serviceName: z.string().optional(),
})

export type SyncQuery = z.infer<typeof SyncQuerySchema>

// ==================== USAGE TAG & RULE SCHEMAS ====================

export const CreateUsageTagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
})

export type CreateUsageTagData = z.infer<typeof CreateUsageTagSchema>

export const CreateUsageRuleSchema = z.object({
  usageTagId: z.number().min(1, "Usage tag ID is required"),
  supplierFilter: z.string().optional().nullable(),
  planFilter: z.string().optional().nullable(),
  minContractDays: z.number().min(0).default(0),
  conditions: z.record(z.any()).default({}),
  priority: z.number().default(0),
})

export type CreateUsageRuleData = z.infer<typeof CreateUsageRuleSchema>
