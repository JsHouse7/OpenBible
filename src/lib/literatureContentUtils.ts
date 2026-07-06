/**
 * Helpers for literature chapter content (HTML vs plain text).
 */

export type ContentFormat = 'html' | 'text'

export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim()
  return /^<[a-z][\s\S]*>/i.test(trimmed)
}

export function stripHtmlToText(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
  }
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function textToHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return '<p></p>'
  }

  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p).replace(/\n/g, '<br>')
      return `<p>${escaped}</p>`
    })
    .join('\n')
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function countWords(text: string): number {
  const plain = isHtmlContent(text) ? stripHtmlToText(text) : text
  return plain.trim().split(/\s+/).filter((w) => w.length > 0).length
}

export function normalizeChapterContent(
  content: string,
  format?: ContentFormat
): { content: string; plainText: string; contentFormat: ContentFormat } {
  const detected: ContentFormat = format ?? (isHtmlContent(content) ? 'html' : 'text')
  if (detected === 'html') {
    return {
      content,
      plainText: stripHtmlToText(content),
      contentFormat: 'html',
    }
  }
  return {
    content: textToHtml(content),
    plainText: content.trim(),
    contentFormat: 'text',
  }
}

/** Repair common PDF extraction artifacts. */
export function cleanPdfText(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Remove form feeds used as page breaks
  text = text.replace(/\f/g, '\n\n')

  // Join hyphenated line breaks: "exam-\nple" -> "example"
  text = text.replace(/(\w)-\n(\w)/g, '$1$2')

  // Collapse single newlines within paragraphs (keep double newlines)
  const lines = text.split('\n')
  const merged: string[] = []
  let buffer = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (buffer) {
        merged.push(buffer.trim())
        buffer = ''
      }
      merged.push('')
      continue
    }

    const looksLikeHeader =
      trimmed.length < 80 &&
      (trimmed === trimmed.toUpperCase() ||
        /^(CHAPTER|Chapter|PART|Part|SECTION|Section)\s+/i.test(trimmed))

    if (looksLikeHeader) {
      if (buffer) {
        merged.push(buffer.trim())
        buffer = ''
      }
      merged.push(trimmed)
      continue
    }

    if (buffer && !buffer.endsWith('.') && !buffer.endsWith('?') && !buffer.endsWith('!') && !buffer.endsWith(':')) {
      buffer += ' ' + trimmed
    } else if (buffer) {
      merged.push(buffer.trim())
      buffer = trimmed
    } else {
      buffer = trimmed
    }
  }
  if (buffer) merged.push(buffer.trim())

  return merged.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Detect likely scanned PDF (very little text per page). */
export function isLikelyScannedPdf(text: string, pageCount?: number): boolean {
  const words = countWords(text)
  if (pageCount && pageCount > 2) {
    const wordsPerPage = words / pageCount
    if (wordsPerPage < 30) return true
  }
  return words < 50
}
