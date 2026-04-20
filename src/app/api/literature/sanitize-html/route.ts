import { NextRequest, NextResponse } from 'next/server'
import { sanitizeLiteratureHtml } from '@/lib/sanitizeLiteratureHtml'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_BODY_CHARS = 6 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const html = typeof body?.html === 'string' ? body.html : ''

    if (!html.length) {
      return NextResponse.json({ error: 'html is required' }, { status: 400 })
    }
    if (html.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        { error: `HTML too large (max ${MAX_BODY_CHARS / (1024 * 1024)} MB of text)` },
        { status: 413 }
      )
    }

    const safe = sanitizeLiteratureHtml(html)
    return NextResponse.json({ html: safe })
  } catch (error) {
    console.error('sanitize-html:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sanitization failed' },
      { status: 500 }
    )
  }
}
