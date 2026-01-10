import { NextRequest, NextResponse } from 'next/server'
import { getSimByIccid } from '@/services/sim.service'
import { PublicMsisdnQuerySchema } from '@/lib/validation'
import { ZodError } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/public/msisdn
 * Public API for ICCID → MSISDN lookup
 * Requires X-API-KEY header
 */
export async function GET(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-KEY')
    const expectedApiKey = process.env.PUBLIC_API_KEY

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const query = PublicMsisdnQuerySchema.parse({
      iccid: searchParams.get('iccid'),
    })

    // Get SIM
    const sim = await getSimByIccid(query.iccid)

    if (!sim) {
      return NextResponse.json(
        { error: 'SIM not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      iccid: sim.iccid,
      msisdn: sim.msisdn,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in public MSISDN API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
