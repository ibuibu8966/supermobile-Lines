import { NextRequest, NextResponse } from 'next/server'
import { getSimDetail } from '@/services/sim.service'

/**
 * GET /api/sims/[iccid]
 * Get SIM detail with history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { iccid: string } }
) {
  try {
    const { iccid } = params

    if (!iccid || iccid.length < 19 || iccid.length > 20) {
      return NextResponse.json(
        { error: 'Invalid ICCID format' },
        { status: 400 }
      )
    }

    const result = await getSimDetail(iccid)

    if (!result) {
      return NextResponse.json(
        { error: 'SIM not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching SIM detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
