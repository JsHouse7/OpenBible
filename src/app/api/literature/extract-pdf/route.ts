import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { getLiteratureMaxUploadBytes } from '@/lib/literatureUploadLimits'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const maxBytes = getLiteratureMaxUploadBytes()

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing PDF file (field name: file)' }, { status: 400 })
    }

    const type = file.type?.toLowerCase() || ''
    const name = file.name?.toLowerCase() || ''
    if (!type.includes('pdf') && !name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `PDF too large (max ${Math.floor(maxBytes / (1024 * 1024))} MB). Increase LITERATURE_MAX_FILE_MB if your host supports larger uploads.`,
        },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })

    try {
      const textResult = await parser.getText()
      const text = (textResult.text || '').trim()
      const pageCount = textResult.total

      if (!text.length) {
        return NextResponse.json(
          {
            error:
              'No extractable text found. Scanned PDFs (images only) need OCR; try a text-based PDF or paste text manually.',
          },
          { status: 422 }
        )
      }

      return NextResponse.json({
        text,
        pageCount,
      })
    } finally {
      await parser.destroy()
    }
  } catch (error) {
    console.error('extract-pdf:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract PDF text' },
      { status: 500 }
    )
  }
}
