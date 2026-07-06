/**
 * Max upload size for literature extract routes (PDF, DOCX).
 * Default 8 MB balances usability with common serverless request body limits.
 * Set `LITERATURE_MAX_FILE_MB` (e.g. `20`) in production if your platform allows larger bodies.
 */
export function getLiteratureMaxUploadBytes(): number {
  const raw = process.env.LITERATURE_MAX_FILE_MB
  const mb = raw !== undefined ? Number(raw) : NaN
  if (Number.isFinite(mb) && mb > 0 && mb <= 31) {
    return Math.floor(mb * 1024 * 1024)
  }
  return 8 * 1024 * 1024
}
