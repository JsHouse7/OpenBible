'use client'

import { useEffect, useRef } from 'react'
import { ReaderContent } from './ReaderContent'
import { ReaderPreferences } from '@/lib/readerPreferences'

interface ScrollViewProps {
  html: string
  prefs: ReaderPreferences
  initialAnchor?: number
  onScrollProgress?: (anchor: number, percent: number) => void
}

export function ScrollView({
  html,
  prefs,
  initialAnchor = 0,
  onScrollProgress,
}: ScrollViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialAnchor > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = initialAnchor
    }
  }, [initialAnchor, html])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || !onScrollProgress) return
    const max = el.scrollHeight - el.clientHeight
    const percent = max > 0 ? (el.scrollTop / max) * 100 : 0
    onScrollProgress(el.scrollTop, percent)
  }

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-y-auto overscroll-contain"
      onScroll={handleScroll}
    >
      <ReaderContent html={html} prefs={prefs} className="py-6" />
    </div>
  )
}
