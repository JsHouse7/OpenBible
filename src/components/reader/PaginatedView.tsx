'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ReaderContent } from './ReaderContent'
import { ReaderPreferences } from '@/lib/readerPreferences'

const PAGE_COUNTER_RESERVE = 36

interface PaginatedViewProps {
  html: string
  prefs: ReaderPreferences
  /** Page index to open on chapter load. Use -1 for the last page. */
  initialPage?: number
  onPageChange?: (page: number, totalPages: number) => void
  onReachChapterEnd?: () => void
  onReachChapterStart?: () => void
}

export function PaginatedView({
  html,
  prefs,
  initialPage = 0,
  onPageChange,
  onReachChapterEnd,
  onReachChapterStart,
}: PaginatedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(1)
  const [pageStride, setPageStride] = useState(0)
  const touchStartX = useRef(0)
  const prevHtmlRef = useRef(html)
  const pageRef = useRef(page)
  const totalPagesRef = useRef(totalPages)

  pageRef.current = page
  totalPagesRef.current = totalPages

  const recalculate = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const margins = prefs.margins
    const height = Math.max(1, container.clientHeight - PAGE_COUNTER_RESERVE)
    const outerWidth = container.clientWidth
    const contentWidth = Math.max(1, outerWidth - margins * 2)
    const columnGap = margins * 2
    const stride = contentWidth + columnGap

    setPageStride(stride)

    const inner = content.querySelector('.reader-content') as HTMLElement
    if (!inner) return

    inner.style.columnWidth = `${contentWidth}px`
    inner.style.columnGap = `${columnGap}px`
    inner.style.columnFill = 'auto'
    inner.style.height = `${height}px`
    inner.style.width = `${contentWidth}px`
    inner.style.boxSizing = 'border-box'

    const scrollW = inner.scrollWidth
    const pages = Math.max(1, Math.round((scrollW + columnGap) / stride))

    const isChapterChange = prevHtmlRef.current !== html
    if (isChapterChange) {
      prevHtmlRef.current = html
      const targetPage =
        initialPage < 0 ? pages - 1 : Math.min(initialPage, pages - 1)
      setPage(Math.max(0, targetPage))
      pageRef.current = Math.max(0, targetPage)
    } else if (totalPagesRef.current > 0) {
      const fraction = pageRef.current / totalPagesRef.current
      const restored = Math.min(pages - 1, Math.max(0, Math.round(fraction * pages)))
      setPage(restored)
      pageRef.current = restored
    } else {
      setPage((p) => Math.min(p, pages - 1))
    }

    setTotalPages(pages)
    totalPagesRef.current = pages
  }, [html, prefs.margins, prefs.fontSize, prefs.lineHeight, prefs.fontFamily, prefs.textAlign, initialPage])

  useLayoutEffect(() => {
    recalculate()
  }, [recalculate])

  useEffect(() => {
    const ro = new ResizeObserver(() => recalculate())
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [recalculate])

  useEffect(() => {
    onPageChange?.(page, totalPages)
  }, [page, totalPages, onPageChange])

  const goNext = useCallback(() => {
    setPage((p) => {
      if (p >= totalPagesRef.current - 1) {
        onReachChapterEnd?.()
        return p
      }
      return p + 1
    })
  }, [onReachChapterEnd])

  const goPrev = useCallback(() => {
    setPage((p) => {
      if (p <= 0) {
        onReachChapterStart?.()
        return p
      }
      return p - 1
    })
  }, [onReachChapterStart])

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    if (x < rect.width * 0.3) goPrev()
    else if (x > rect.width * 0.7) goNext()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) < 50) return
    if (delta < 0) goNext()
    else goPrev()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{
        paddingLeft: prefs.margins,
        paddingRight: prefs.margins,
        boxSizing: 'border-box',
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={contentRef}
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${page * pageStride}px)` }}
      >
        <ReaderContent html={html} prefs={prefs} noHorizontalPadding />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center text-xs opacity-70 pointer-events-none z-10"
        style={{ height: PAGE_COUNTER_RESERVE }}
      >
        {page + 1} / {totalPages}
      </div>
    </div>
  )
}
