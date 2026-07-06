'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ReaderContent } from './ReaderContent'
import { ReaderPreferences } from '@/lib/readerPreferences'

interface PaginatedViewProps {
  html: string
  prefs: ReaderPreferences
  initialPage?: number
  onPageChange?: (page: number, totalPages: number, anchor: number) => void
}

export function PaginatedView({
  html,
  prefs,
  initialPage = 0,
  onPageChange,
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
    const height = container.clientHeight
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
      setPage(initialPage)
      pageRef.current = initialPage
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
    onPageChange?.(page, totalPages, page * pageStride)
  }, [page, totalPages, pageStride, onPageChange])

  const goNext = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPagesRef.current - 1)),
    []
  )
  const goPrev = useCallback(() => setPage((p) => Math.max(p - 1, 0)), [])

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
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs opacity-60 pointer-events-none">
        {page + 1} / {totalPages}
      </div>
    </div>
  )
}
