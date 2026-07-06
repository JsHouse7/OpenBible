'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [pageWidth, setPageWidth] = useState(0)
  const touchStartX = useRef(0)

  const recalculate = useCallback(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const width = container.clientWidth
    const height = container.clientHeight
    setPageWidth(width)

    const inner = content.querySelector('.reader-content') as HTMLElement
    if (!inner) return

    inner.style.columnWidth = `${width}px`
    inner.style.columnGap = '0px'
    inner.style.columnFill = 'auto'
    inner.style.height = `${height}px`
    inner.style.width = 'auto'

    const scrollW = inner.scrollWidth
    const pages = Math.max(1, Math.ceil(scrollW / width))
    setTotalPages(pages)
    setPage((p) => Math.min(p, pages - 1))
  }, [])

  useEffect(() => {
    recalculate()
    const ro = new ResizeObserver(recalculate)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [html, prefs, recalculate])

  useEffect(() => {
    onPageChange?.(page, totalPages, page * pageWidth)
  }, [page, totalPages, pageWidth, onPageChange])

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages - 1))
  const goPrev = () => setPage((p) => Math.max(p - 1, 0))

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
  }, [totalPages])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={contentRef}
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${page * pageWidth}px)` }}
      >
        <ReaderContent html={html} prefs={prefs} />
      </div>
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs opacity-60 pointer-events-none">
        {page + 1} / {totalPages}
      </div>
    </div>
  )
}
