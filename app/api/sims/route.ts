import { NextRequest, NextResponse } from 'next/server'
import { getSimsList, upsertSim } from '@/services/sim.service'
import { SimListQuerySchema, CreateSimSchema } from '@/lib/validation'
import { ZodError } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/sims
 * List SIMs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryObject = Object.fromEntries(searchParams.entries())

    // Parse and validate query parameters
    const query = SimListQuerySchema.parse(queryObject)

    // Get SIMs list
    const result = await getSimsList(query)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching SIMs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sims
 * Create or update a SIM (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const data = CreateSimSchema.parse(body)

    // Upsert SIM
    const sim = await upsertSim(data)

    return NextResponse.json({ sim }, { status: 200 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error upserting SIM:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
