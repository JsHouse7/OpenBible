import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { getLiteratureMaxUploadBytes } from '@/lib/literatureUploadLimits'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const maxBytes = getLiteratureMaxUploadBytes()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing DOCX file (field name: file)' }, { status: 400 })
    }

    const type = file.type?.toLowerCase() || ''
    const name = file.name?.toLowerCase() || ''
    if (
      !type.includes('wordprocessingml') &&
      !type.includes('officedocument') &&
      !name.endsWith('.docx')
    ) {
      return NextResponse.json({ error: 'File must be a .docx document' }, { status: 400 })
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))} MB). Set LITERATURE_MAX_FILE_MB if your host allows bigger requests.`,
        },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await mammoth.extractRawText({ buffer })
    const text = (result.value || '').trim()

    if (!text.length) {
      return NextResponse.json(
        { error: 'No text could be extracted from this DOCX (empty or unsupported structure).' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('extract-docx:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract DOCX text' },
      { status: 500 }
    )
  }
}
