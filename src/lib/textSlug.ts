import slugify from 'slugify'

/** URL/database-safe slug for titles and names (consistent across routes). */
export function toSlug(text: string): string {
  const s = slugify(String(text ?? ''), {
    lower: true,
    strict: true,
    trim: true,
  })
  return s || 'unnamed'
}
