import { NextRequest, NextResponse } from 'next/server'
import { calculateAvailability } from '@/services/availability.service'
import { AvailabilityQuerySchema } from '@/lib/validation'
import { ZodError } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/availability
 * Calculate available SIM count for a usage tag and date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryObject = Object.fromEntries(searchParams.entries())

    // Parse and validate query
    const query = AvailabilityQuerySchema.parse(queryObject)

    // Calculate availability
    const result = await calculateAvailability({
      usageTagId: query.usageTagId,
      startDate: query.startDate,
      endDate: query.endDate,
      excludeCurrentlyAssigned: query.excludeCurrentlyAssigned,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error calculating availability:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
