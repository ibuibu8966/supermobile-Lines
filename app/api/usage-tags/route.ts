import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateUsageTagSchema } from '@/lib/validation'
import { ZodError } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/usage-tags
 * Get all usage tags
 */
export async function GET() {
  try {
    const tags = await prisma.usageTag.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching usage tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/usage-tags
 * Create a new usage tag
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = CreateUsageTagSchema.parse(body)

    const tag = await prisma.usageTag.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating usage tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
