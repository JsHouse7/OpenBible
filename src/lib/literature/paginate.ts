import type { LiteratureBlock, LiteratureBlockKind } from './types'
import type {
  ActivePageTurn,
  ActiveReadingLayout,
  ContentAnchor,
  DragDecision,
  DragPhase,
  LiteraturePage,
  PageSlice,
  PageTurnPreference,
  ReadingLayoutPreference,
} from './types'

export type MeasureFn = (value: string, blockKind: LiteratureBlockKind) => number

export function createWidthMeasure(options: {
  contentWidth: number
  fontSize: number
  lineHeight: number
  charWidth: number
}): MeasureFn {
  return (text, kind) =>
    estimateWrappedHeight(text, kind, {
      contentWidth: options.contentWidth,
      fontSize: options.fontSize,
      lineHeight: options.lineHeight,
      widthOf: (sample) => sample.length * options.charWidth * (kind === 'heading' ? 1.1 : 1),
    })
}

export function estimateWrappedHeight(
  text: string,
  kind: LiteratureBlockKind,
  options: {
    contentWidth: number
    fontSize: number
    lineHeight: number
    widthOf: (value: string) => number
  }
): number {
  const fontSize = kind === 'heading' ? options.fontSize * 1.35 : options.fontSize
  const plain = text.replace(/\s+/g, ' ').trim()
  const lines = countWrappedLines(plain.length > 0 ? plain : ' ', Math.max(1, options.contentWidth), options.widthOf)
  const gap = kind === 'heading' ? fontSize * 0.75 : kind === 'scripture' || kind === 'footnote' ? 22 : 18
  // Prose is a little wider than the probe, so keep a margin against clipped lines.
  return Math.ceil((lines * fontSize * options.lineHeight + gap) * 1.2)
}

function countWrappedLines(text: string, contentWidth: number, widthOf: (value: string) => number): number {
  const words = text.split(' ')
  let lines = 1
  let current = ''
  for (const word of words) {
    if (!word) continue
    const wordWidth = widthOf(word)
    if (wordWidth > contentWidth) {
      if (current) lines += 1
      lines += Math.max(0, Math.ceil(wordWidth / contentWidth) - 1)
      current = ''
      continue
    }
    const trial = current ? `${current} ${word}` : word
    if (widthOf(trial) <= contentWidth) {
      current = trial
    } else {
      lines += 1
      current = word
    }
  }
  return lines
}

function softBreak(text: string, max: number): number {
  if (max >= text.length) return text.length
  const limit = Math.max(1, max)
  const window = text.slice(0, limit)
  const space = Math.max(window.lastIndexOf(' '), window.lastIndexOf('\n'))
  if (space >= Math.floor(limit * 0.5)) return space + 1
  return limit
}

function makeSlice(block: LiteratureBlock, localStart: number, localEnd: number, height: number): PageSlice {
  const text = block.text.slice(localStart, localEnd)
  return {
    blockId: block.id,
    chapterIndex: block.chapterIndex,
    kind: block.kind,
    source: block.source,
    text,
    charOffset: block.source === 'title' ? 0 : block.charOffset + localStart,
    charEnd: block.source === 'title' ? 0 : block.charOffset + localEnd,
    height,
  }
}

function splitBlock(block: LiteratureBlock, pageContentHeight: number, measure: MeasureFn): PageSlice[] {
  if (!block.text) return []
  if (block.source === 'title') {
    return [makeSlice(block, 0, block.text.length, measure(block.text, block.kind))]
  }

  const slices: PageSlice[] = []
  let offset = 0
  while (offset < block.text.length) {
    const rest = block.text.slice(offset)
    const fullHeight = measure(rest, block.kind)
    if (fullHeight <= pageContentHeight || rest.length === 1) {
      slices.push(makeSlice(block, offset, block.text.length, fullHeight))
      break
    }

    let lo = 1
    let hi = rest.length - 1
    let best = 1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (measure(rest.slice(0, mid), block.kind) <= pageContentHeight) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    const snapped = softBreak(rest, best)
    const cut = Math.max(1, Math.min(snapped, rest.length))
    const height = measure(rest.slice(0, cut), block.kind)
    slices.push(makeSlice(block, offset, offset + cut, height))
    offset += cut
  }
  return slices
}

function cutPiece(piece: PageSlice, room: number, measure: MeasureFn): { fit: PageSlice; rest: PageSlice } | null {
  if (piece.source === 'title' || piece.text.length < 12 || room < 36) return null
  let lo = 1
  let hi = piece.text.length - 1
  let best = 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (measure(piece.text.slice(0, mid), piece.kind) <= room) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  const snapped = softBreak(piece.text, best)
  const cut = Math.min(snapped, piece.text.length - 1)
  if (cut < 8) return null
  const fitText = piece.text.slice(0, cut)
  const restText = piece.text.slice(cut)
  return {
    fit: { ...piece, text: fitText, charEnd: piece.charOffset + cut, height: measure(fitText, piece.kind) },
    rest: { ...piece, text: restText, charOffset: piece.charOffset + cut, height: measure(restText, piece.kind) },
  }
}

export function paginateBlocks(
  blocks: LiteratureBlock[],
  options: { pageContentHeight: number; measure: MeasureFn }
): LiteraturePage[] {
  const pageContentHeight = options.pageContentHeight
  const pieces = blocks.flatMap((block) => splitBlock(block, pageContentHeight, options.measure))
  if (pieces.length === 0) {
    return [{ index: 0, slices: [], startAnchor: { chapterIndex: 0, charOffset: 0 } }]
  }

  const groups: PageSlice[][] = []
  let current: PageSlice[] = []
  let used = 0
  const flush = () => {
    if (current.length === 0) return
    groups.push(current)
    current = []
    used = 0
  }

  let index = 0
  while (index < pieces.length) {
    const piece = pieces[index]
    const next = pieces[index + 1]
    if (piece.kind === 'heading' && next && current.length > 0) {
      const companion = Math.min(next.height, pageContentHeight)
      const together = piece.height + companion
      if (used + together > pageContentHeight && together <= pageContentHeight) {
        flush()
      }
    }
    if (current.length > 0 && used + piece.height > pageContentHeight) {
      const room = pageContentHeight - used
      const cut = cutPiece(piece, room, options.measure)
      if (cut) {
        current.push(cut.fit)
        used += cut.fit.height
        pieces.splice(index, 1, cut.rest)
        flush()
        continue
      }
      flush()
    }
    current.push(piece)
    used += piece.height
    index += 1
  }
  flush()

  return groups.map((slices, index) => {
    const first = slices[0]
    return {
      index,
      slices,
      startAnchor: first.source === 'title'
        ? { chapterIndex: first.chapterIndex, charOffset: 0, atTitle: true }
        : { chapterIndex: first.chapterIndex, charOffset: first.charOffset },
    }
  })
}

export function findPageIndex(pages: LiteraturePage[], anchor: ContentAnchor): number {
  if (pages.length === 0) return 0
  let fallback = pages.findIndex((page) => page.slices.some((slice) => slice.chapterIndex === anchor.chapterIndex))
  if (fallback < 0) fallback = 0

  if (anchor.atTitle) {
    const titlePage = pages.findIndex((page) =>
      page.slices.some((slice) => slice.source === 'title' && slice.chapterIndex === anchor.chapterIndex)
    )
    if (titlePage >= 0) return titlePage
  }

  for (let index = 0; index < pages.length; index += 1) {
    for (const slice of pages[index].slices) {
      if (slice.chapterIndex !== anchor.chapterIndex || slice.source === 'title') continue
      if (slice.charOffset <= anchor.charOffset && anchor.charOffset < slice.charEnd) return index
      if (slice.charOffset <= anchor.charOffset) fallback = index
    }
  }
  return fallback
}

export function stepAnchor(
  pages: LiteraturePage[],
  anchor: ContentAnchor,
  direction: 1 | -1,
  layout: 'single' | 'spread'
): ContentAnchor | null {
  if (pages.length === 0) return null
  const pageIndex = findPageIndex(pages, anchor)
  const stride = layout === 'spread' ? 2 : 1
  const origin = layout === 'spread' ? pageIndex - (pageIndex % 2) : pageIndex
  const nextIndex = origin + direction * stride
  if (nextIndex < 0 || nextIndex >= pages.length) return null
  return pages[nextIndex].startAnchor
}

export function visiblePages(
  pages: LiteraturePage[],
  anchor: ContentAnchor,
  layout: 'single' | 'spread'
): LiteraturePage[] {
  if (pages.length === 0) return []
  const index = findPageIndex(pages, anchor)
  if (layout === 'single') return [pages[index]]
  const start = index - (index % 2)
  return pages.slice(start, start + 2)
}

export function chapterPageStats(pages: LiteraturePage[], pageIndex: number) {
  const safeIndex = Math.min(Math.max(pageIndex, 0), Math.max(pages.length - 1, 0))
  const page = pages[safeIndex]
  const chapterIndex = page?.slices[0]?.chapterIndex ?? 0
  const inChapter = pages.filter((item) => (item.slices[0]?.chapterIndex ?? 0) === chapterIndex)
  const pageInChapter = Math.max(0, inChapter.findIndex((item) => item.index === page?.index))
  return {
    chapterIndex,
    pageInChapter: pageInChapter + 1,
    pagesInChapter: Math.max(inChapter.length, page ? 1 : 0),
    overall: safeIndex + 1,
    total: pages.length,
  }
}

export function spreadFits(viewportWidth: number, fontSize: number): boolean {
  const minColumn = Math.max(260, fontSize * 17)
  return viewportWidth >= minColumn * 2 + 72
}

export function resolveReadingLayout(
  preference: ReadingLayoutPreference,
  viewportWidth: number,
  fontSize: number
): ActiveReadingLayout {
  if (preference === 'scroll') return 'scroll'
  if (preference === 'single') return 'single'
  return spreadFits(viewportWidth, fontSize) ? 'spread' : 'single'
}

export function resolvePageTurn(preference: PageTurnPreference, reducedMotion: boolean): ActivePageTurn {
  if (reducedMotion) return 'none'
  return preference
}

export function classifyDrag(input: {
  dx: number
  dy: number
  width: number
  selecting: boolean
  phase: DragPhase
}): DragDecision {
  if (input.selecting) return 'ignore'
  const absX = Math.abs(input.dx)
  const absY = Math.abs(input.dy)
  if (absY > absX && absY > 12) return 'ignore'
  const horizontal = absX >= 16 && absX > absY * 1.2
  if (input.phase === 'move') return horizontal ? 'pending' : 'ignore'
  if (!horizontal && absX < 16) return 'ignore'
  const threshold = Math.max(48, input.width * 0.22)
  if (absX >= threshold) return input.dx < 0 ? 'commit-next' : 'commit-prev'
  if (horizontal) return 'cancel'
  return 'ignore'
}

export function progressForAnchor(chapterLengths: number[], anchor: ContentAnchor): number {
  const total = chapterLengths.reduce((sum, length) => sum + length, 0)
  if (total <= 0) return 0
  const prior = chapterLengths.slice(0, anchor.chapterIndex).reduce((sum, length) => sum + length, 0)
  const within = Math.min(Math.max(anchor.charOffset, 0), chapterLengths[anchor.chapterIndex] ?? 0)
  return Math.min(100, Math.round(((prior + within) / total) * 100))
}
