import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateUsageRuleSchema } from '@/lib/validation'
import { ZodError } from 'zod'

/**
 * GET /api/usage-rules
 * Get all usage rules (optionally filtered by usageTagId)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const usageTagId = searchParams.get('usageTagId')

    const where = usageTagId ? { usageTagId: parseInt(usageTagId) } : {}

    const rules = await prisma.usageRule.findMany({
      where,
      include: {
        usageTag: true,
      },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching usage rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/usage-rules
 * Create a new usage rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = CreateUsageRuleSchema.parse(body)

    const rule = await prisma.usageRule.create({
      data: {
        usageTagId: data.usageTagId,
        supplierFilter: data.supplierFilter,
        planFilter: data.planFilter,
        minContractDays: data.minContractDays,
        conditions: data.conditions,
        priority: data.priority,
      },
      include: {
        usageTag: true,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating usage rule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
