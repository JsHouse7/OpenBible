import { NextRequest, NextResponse } from 'next/server'
import { assertPublicHttpUrl } from '@/lib/urlSafety'
import { sanitizeLiteratureHtml } from '@/lib/sanitizeLiteratureHtml'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_HTML_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 30_000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawUrl = typeof body?.url === 'string' ? body.url : ''
    if (!rawUrl.trim()) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const url = assertPublicHttpUrl(rawUrl)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent':
            'OpenBibleLiteratureBot/1.0 (+https://github.com) literature page import',
        },
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Page returned ${res.status} ${res.statusText}` },
        { status: 502 }
      )
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: `Page too large (max ${MAX_HTML_BYTES / (1024 * 1024)} MB)` },
        { status: 413 }
      )
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    const head = html.slice(0, 800).trimStart().toLowerCase()
    const type = res.headers.get('content-type') || ''
    const looksHtml =
      type.includes('text/html') ||
      type.includes('application/xhtml') ||
      type.includes('xml') ||
      /<html[\s>]/.test(head) ||
      /<!doctype\s+html/.test(head)

    if (!looksHtml) {
      return NextResponse.json(
        {
          error:
            'Response did not look like HTML. Try downloading the page and uploading an .html file.',
        },
        { status: 415 }
      )
    }

    const safeHtml = sanitizeLiteratureHtml(html)

    return NextResponse.json({
      html: safeHtml,
      finalUrl: res.url,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    console.error('fetch-html:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch URL'
    const status = message.includes('not allowed') || message.includes('Invalid') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
