export type LiteratureBlockKind = 'heading' | 'paragraph' | 'scripture' | 'footnote' | 'link'

export type LiteratureTextSource = 'title' | 'content'

export interface LiteratureBlock {
  id: string
  chapterIndex: number
  kind: LiteratureBlockKind
  source: LiteratureTextSource
  text: string
  charOffset: number
  charEnd: number
}

export interface ContentAnchor {
  chapterIndex: number
  charOffset: number
  /** Chapter title page, distinct from the first character of the chapter body. */
  atTitle?: boolean
}

export interface PageSlice {
  blockId: string
  chapterIndex: number
  kind: LiteratureBlockKind
  source: LiteratureTextSource
  text: string
  charOffset: number
  charEnd: number
  height: number
}

export interface LiteraturePage {
  index: number
  slices: PageSlice[]
  startAnchor: ContentAnchor
}

export type ReadingLayoutPreference = 'scroll' | 'single' | 'spread'
export type ActiveReadingLayout = 'scroll' | 'single' | 'spread'
export type PageTurnPreference = 'none' | 'slide' | 'paper'
export type ActivePageTurn = 'none' | 'slide' | 'paper'

export type DragPhase = 'move' | 'end'
export type DragDecision = 'ignore' | 'pending' | 'commit-next' | 'commit-prev' | 'cancel'

export interface StoredLiteraturePosition {
  workId: string
  chapterIndex: number
  charOffset: number
  updatedAt?: string
  chapterTitle?: string
  atTitle?: boolean
}
