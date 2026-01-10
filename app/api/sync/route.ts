import { NextRequest, NextResponse } from 'next/server'
import { syncAllServices } from '@/services/sync.service'
import { SyncQuerySchema } from '@/lib/validation'
import { ZodError } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * POST /api/sync
 * Trigger sync from external Supabase services
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryObject = Object.fromEntries(searchParams.entries())

    // Parse and validate query
    const query = SyncQuerySchema.parse(queryObject)

    // Perform sync
    const results = await syncAllServices(query.serviceName)

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error during sync:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
