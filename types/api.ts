export interface ApiError {
  error: string
  details?: any
}

export interface ImportResult {
  success: number
  errors: Array<{
    row: number
    iccid: string
    error: string
  }>
  summary: {
    total: number
    created: number
    updated: number
    failed: number
  }
}

export interface SyncResult {
  serviceName: string
  status: 'success' | 'failed'
  recordsChecked: number
  recordsUpdated: number
  historyCreated: number
  error?: string
}

export interface SyncResponse {
  results: SyncResult[]
}

export interface AvailabilityResult {
  usageTagId: number
  usageTagName: string
  requestedPeriod: {
    startDate: string
    endDate: string
  }
  availableCount: number
  sims: Array<{
    iccid: string
    msisdn: string | null
    supplier: string
    plan: string | null
  }>
}

export interface PublicMsisdnResponse {
  iccid: string
  msisdn: string | null
}
