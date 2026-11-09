'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ReaderContent } from './ReaderContent'
import { ReaderPreferences } from '@/lib/readerPreferences'
import { columnCountForViewport, resolvePageTurn, spreadLabel, stepPage } from '@/lib/reader/pageLayout'

const PAGE_COUNTER_RESERVE = 36

interface PaginatedViewProps {
  html: string
  prefs: ReaderPreferences
  /** Page index to open on chapter load. Use -1 for the last page. */
  initialPage?: number
  /**
   * Direction of a chapter-edge swipe that caused this view to open.
   * 1 = forward (next chapter), -1 = backward (previous chapter), 0 = no entry animation
   * (TOC, restore, resize, first open).
   */
  chapterEntryDirection?: 1 | -1 | 0
  onPageChange?: (page: number, totalPages: number, columns: 1 | 2) => void
  onReachChapterEnd?: () => void
  onReachChapterStart?: () => void
}

export function PaginatedView({
  html,
  prefs,
  initialPage = 0,
  chapterEntryDirection = 0,
  onPageChange,
  onReachChapterEnd,
  onReachChapterStart,
}: PaginatedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(initialPage < 0 ? 0 : initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [pageStride, setPageStride] = useState(0)
  const [columns, setColumns] = useState<1 | 2>(1)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tilt, setTilt] = useState(0)
  const [freezeTransform, setFreezeTransform] = useState(true)
  const [entryNudgePages, setEntryNudgePages] = useState(0)
  const touchStart = useRef({ x: 0, y: 0 })
  const ignoreClick = useRef(false)
  const prevHtmlRef = useRef<string | null>(null)
  const pageRef = useRef(page)
  const totalPagesRef = useRef(totalPages)
  const columnsRef = useRef<1 | 2>(1)
  const pendingEntryRef = useRef<1 | -1 | null>(null)
  const entryRanForHtmlRef = useRef<string | null>(null)

  pageRef.current = page
  totalPagesRef.current = totalPages
  columnsRef.current = columns

  const motion = resolvePageTurn(prefs.pageTurn ?? 'slide', reducedMotion)
  const motionRef = useRef(motion)
  motionRef.current = motion

  const snapWithoutTransition = useCallback((apply: () => void) => {
    setFreezeTransform(true)
    apply()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFreezeTransform(false)
      })
    })
  }, [])

  const playChapterEntry = useCallback((direction: 1 | -1, targetPage: number) => {
    const motionNow = motionRef.current
    if (motionNow === 'none') {
      setEntryNudgePages(0)
      setPage(targetPage)
      pageRef.current = targetPage
      setFreezeTransform(false)
      return
    }

    // Park one spread past the destination with transitions off, then ease in.
    setFreezeTransform(true)
    setEntryNudgePages(direction > 0 ? 1 : -1)
    setPage(targetPage)
    pageRef.current = targetPage

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (motionNow === 'paper') setTilt(direction > 0 ? -12 : 12)
        setFreezeTransform(false)
        setEntryNudgePages(0)
        if (motionNow === 'paper') {
          window.setTimeout(() => setTilt(0), 40)
        }
      })
    })
  }, [])

  const recalculate = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const margins = prefs.margins
    const height = Math.max(1, container.clientHeight - PAGE_COUNTER_RESERVE)
    const outerWidth = container.clientWidth
    const nextColumns = columnCountForViewport(
      outerWidth,
      container.clientHeight,
      prefs.fontSize,
      prefs.spread ?? 'auto'
    )
    const gap = Math.max(16, margins)
    const available = Math.max(1, outerWidth - margins * 2)
    const contentWidth = nextColumns === 2
      ? Math.max(1, (available - gap) / 2)
      : available
    const stride = contentWidth + (nextColumns === 2 ? gap : margins * 2)

    setColumns(nextColumns)
    columnsRef.current = nextColumns
    setPageStride(stride)

    const inner = content.querySelector('.reader-content') as HTMLElement
    if (!inner) return

    inner.style.columnWidth = `${contentWidth}px`
    inner.style.columnGap = `${nextColumns === 2 ? gap : margins * 2}px`
    inner.style.columnFill = 'auto'
    inner.style.height = `${height}px`
    inner.style.width = `${contentWidth}px`
    inner.style.boxSizing = 'border-box'

    const columnGap = nextColumns === 2 ? gap : margins * 2
    const scrollW = inner.scrollWidth
    const pages = Math.max(1, Math.round((scrollW + columnGap) / stride) || 1)

    const isChapterChange = prevHtmlRef.current !== html
    if (isChapterChange) {
      prevHtmlRef.current = html
      const requested = initialPage < 0 ? pages - 1 : Math.min(Math.max(0, initialPage), pages - 1)
      const snapped = requested - (requested % nextColumns)

      const fromTurn = pendingEntryRef.current
      pendingEntryRef.current = null
      const entryDir: 1 | -1 | 0 =
        fromTurn ??
        (chapterEntryDirection === 1 || chapterEntryDirection === -1
          ? chapterEntryDirection
          : initialPage < 0
            ? -1
            : 0)

      // Only run the entry once per chapter html (resize after entry must not re-animate).
      const alreadyEntered = entryRanForHtmlRef.current === html
      if (!alreadyEntered && entryDir !== 0) {
        entryRanForHtmlRef.current = html
        playChapterEntry(entryDir, snapped)
      } else {
        entryRanForHtmlRef.current = html
        snapWithoutTransition(() => {
          setEntryNudgePages(0)
          setPage(snapped)
          pageRef.current = snapped
        })
      }
    } else if (totalPagesRef.current > 1) {
      const fraction = pageRef.current / totalPagesRef.current
      const restored = Math.min(pages - 1, Math.max(0, Math.round(fraction * pages)))
      const snapped = restored - (restored % nextColumns)
      // Avoid freezing mid chapter-entry animation when layout merely remeasures.
      if (snapped !== pageRef.current) {
        snapWithoutTransition(() => {
          setPage(snapped)
          pageRef.current = snapped
        })
      }
    } else {
      const clamped = Math.min(pageRef.current, pages - 1)
      const next = clamped - (clamped % nextColumns)
      if (next !== pageRef.current) {
        snapWithoutTransition(() => {
          setPage(next)
          pageRef.current = next
        })
      }
    }

    setTotalPages(pages)
    totalPagesRef.current = pages
  }, [
    html,
    prefs.margins,
    prefs.fontSize,
    prefs.lineHeight,
    prefs.fontFamily,
    prefs.textAlign,
    prefs.spread,
    initialPage,
    chapterEntryDirection,
    playChapterEntry,
    snapWithoutTransition,
  ])

  useLayoutEffect(() => {
    recalculate()
  }, [recalculate])

  useEffect(() => {
    const observer = new ResizeObserver(() => recalculate())
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [recalculate])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    onPageChange?.(page, totalPages, columns)
  }, [page, totalPages, columns, onPageChange])

  const turn = useCallback((direction: 1 | -1) => {
    const result = stepPage(pageRef.current, totalPagesRef.current, direction, columnsRef.current)
    if (result.crossedEdge) {
      pendingEntryRef.current = direction
      if (direction > 0) onReachChapterEnd?.()
      else onReachChapterStart?.()
      return
    }
    if (motion === 'paper') setTilt(direction > 0 ? -12 : 12)
    setPage(result.page)
    pageRef.current = result.page
    if (motion === 'paper') {
      window.setTimeout(() => setTilt(0), 40)
    }
  }, [motion, onReachChapterEnd, onReachChapterStart])

  const handleClick = (event: React.MouseEvent) => {
    if (ignoreClick.current) {
      ignoreClick.current = false
      return
    }
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = event.clientX - rect.left
    if (x < rect.width * 0.28) {
      event.stopPropagation()
      turn(-1)
    } else if (x > rect.width * 0.72) {
      event.stopPropagation()
      turn(1)
    }
  }

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const dx = event.changedTouches[0].clientX - touchStart.current.x
    const dy = event.changedTouches[0].clientY - touchStart.current.y
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return
    if (Math.abs(dy) > Math.abs(dx)) return
    if (Math.abs(dx) < 48) return
    ignoreClick.current = true
    event.stopPropagation()
    turn(dx < 0 ? 1 : -1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault()
        turn(1)
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        turn(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn])

  const transition =
    freezeTransform || motion === 'none'
      ? 'none'
      : motion === 'paper'
        ? 'transform 480ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        : 'transform 260ms ease-out'

  const nudgePx = entryNudgePages * columns * pageStride
  const translateX = -(page * pageStride) + nudgePx

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        paddingLeft: prefs.margins,
        paddingRight: prefs.margins,
        boxSizing: 'border-box',
        perspective: motion === 'paper' ? '1400px' : undefined,
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={contentRef}
        className="h-full"
        data-page={page}
        style={{
          transform: `translateX(${translateX}px) rotateY(${tilt}deg)`,
          transformOrigin: tilt < 0 ? 'left center' : 'right center',
          transition,
        }}
      >
        <ReaderContent html={html} prefs={prefs} noHorizontalPadding />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center text-xs opacity-70 pointer-events-none z-10"
        style={{ height: PAGE_COUNTER_RESERVE }}
        aria-live="polite"
      >
        {spreadLabel(page, totalPages, columns)}
        {prefs.spread === 'spread' && columns === 1 ? ' · single page' : ''}
      </div>
    </div>
  )
}
