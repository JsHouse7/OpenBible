export type PageTurnStyle = 'none' | 'slide' | 'paper'
export type SpreadMode = 'auto' | 'single' | 'spread'

export function columnCountForViewport(
  width: number,
  height: number,
  fontSize: number,
  mode: SpreadMode
): 1 | 2 {
  if (mode === 'single') return 1
  const minColumn = Math.max(260, fontSize * 17)
  const fits = width >= minColumn * 2 + 72
  if (!fits) return 1
  if (mode === 'spread') return 2
  return width > height ? 2 : 1
}

export function resolvePageTurn(style: PageTurnStyle, reducedMotion: boolean): PageTurnStyle {
  if (reducedMotion) return 'none'
  return style
}

/** Move by a whole spread in two-column mode, and by one page otherwise. */
export function stepPage(
  current: number,
  total: number,
  direction: 1 | -1,
  columns: 1 | 2
): { page: number; crossedEdge: boolean } {
  if (total <= 0) return { page: 0, crossedEdge: true }
  const origin = current - (current % columns)
  const next = origin + direction * columns
  if (next < 0 || next >= total) return { page: origin, crossedEdge: true }
  return { page: next, crossedEdge: false }
}

export function spreadLabel(page: number, total: number, columns: 1 | 2): string {
  if (total <= 0) return '1 / 1'
  const origin = Math.min(page - (page % columns), Math.max(0, total - 1))
  const end = Math.min(total, origin + columns)
  if (columns === 1 || end - origin === 1) return `${origin + 1} / ${total}`
  return `${origin + 1}–${end} / ${total}`
}
