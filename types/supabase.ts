/**
 * External Supabase subscription record structure (ASSUMPTION)
 * TODO: Replace with actual table structure from each service (物販/バーサス/Avaris)
 */
export interface ExternalSubscription {
  iccid: string
  customer_id: string
  start_date: string      // 契約開始日
  end_date: string        // 契約終了日
  shipped_date?: string   // 発送日
  arrived_date?: string   // 到着日
  returned_date?: string  // 返却日
  // ... その他のフィールド（実際の構造に合わせて調整）
}

/**
 * Column mappings for ServiceSource
 */
export interface ColumnMappings {
  iccid: string
  customerId: string
  contractStartDate: string
  contractEndDate: string
  shippedDate?: string
  arrivedDate?: string
  returnedDate?: string
}
