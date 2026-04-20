import sanitizeHtml from 'sanitize-html'

/**
 * Strip scripts, event handlers, and risky URLs from HTML before parsing or storing.
 * Suitable for literature import (readable subset of HTML).
 */
export function sanitizeLiteratureHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''

  return sanitizeHtml(trimmed, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'article',
      'section',
      'main',
      'header',
      'footer',
      'nav',
      'aside',
      'figure',
      'figcaption',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'colgroup',
      'col',
      'abbr',
      'cite',
      'dfn',
      'time',
      'mark',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      table: ['border'],
      '*': ['class', 'id', 'title', 'lang'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowProtocolRelative: false,
  })
}
