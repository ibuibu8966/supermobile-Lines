import { SimStatus } from '@prisma/client'

// Filter state for SIM list page
export interface FilterState {
  status: SimStatus[]
  supplier: string
  serviceName: string
  usageTags: number[]
  search: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

// Summary statistics for usage tags
export interface SummaryStats {
  tagId: number
  tagName: string
  availableCount: number  // IN_STOCK with this tag
  totalCount: number      // All SIMs with this tag
  inUseCount: number      // ACTIVE with this tag
}

// Service sync status
export interface ServiceSyncStatus {
  serviceName: string
  displayName: string
  lastSyncAt: Date | null
  status: 'success' | 'error' | 'pending'
  recordCount: number
  errorCount: number
  errorMessage: string | null
}

// Sync log entry
export interface SyncLog {
  id: number
  serviceName: string
  operation: string
  status: 'success' | 'error'
  recordCount: number
  errorMessage: string | null
  timestamp: Date
}

// Availability check result
export interface AvailabilityCheckResult {
  available: boolean
  message: string
  reason: string | null
  availableCount?: number
}

// CSV validation error
export interface CSVValidationError {
  row: number
  field: string
  message: string
}

// CSV import result (extended from existing)
export interface CSVImportResult {
  success: boolean
  created: number
  updated: number
  errors: CSVValidationError[]
  details?: Array<{
    iccid: string
    action: 'created' | 'updated'
    status: 'success' | 'error'
    errorMessage?: string
  }>
}

// Rule form data
export interface RuleFormData {
  usageTagId: number
  supplierFilter: string | null
  planFilter: string | null
  minContractDays: number
  priority: number
}

// Date range for filtering
export interface DateRange {
  start: Date | null
  end: Date | null
}

// Extended SIM with computed fields for UI
export interface SimWithComputedFields {
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
  currentUsageTagName?: string | null
  currentContractStartDate: Date | null
  currentContractEndDate: Date | null
  status: SimStatus
  mostRecentShippedDate?: Date | null
  mostRecentArrivedDate?: Date | null
  mostRecentReturnedDate?: Date | null
  updatedAt: Date
  historyCount: number
}
