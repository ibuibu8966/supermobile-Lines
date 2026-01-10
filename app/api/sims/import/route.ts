import { NextRequest, NextResponse } from 'next/server'
import { importSimsFromCsv } from '@/services/import.service'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * POST /api/sims/import
 * Import SIMs from CSV file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()

    // Process import
    const result = await importSimsFromCsv(fileContent)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
