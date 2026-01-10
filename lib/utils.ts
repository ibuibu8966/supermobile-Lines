import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * Parse date from various formats (YYYY-MM-DD or YYYY/MM/DD)
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const normalized = dateString.replace(/\//g, '-')
  const date = new Date(normalized)

  return isNaN(date.getTime()) ? null : date
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((end.getTime() - start.getTime()) / msPerDay)
}
