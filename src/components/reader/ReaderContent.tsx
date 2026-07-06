'use client'

import { cn } from '@/lib/utils'
import { ReaderPreferences, readerThemeStyles } from '@/lib/readerPreferences'
import { fontOptions } from '@/hooks/useFonts'

interface ReaderContentProps {
  html: string
  prefs: ReaderPreferences
  className?: string
  /** When true, horizontal margins are omitted (paginated mode applies them on the wrapper). */
  noHorizontalPadding?: boolean
  onTextSelect?: (selection: { text: string; start: number; end: number }) => void
}

export function ReaderContent({
  html,
  prefs,
  className,
  noHorizontalPadding = false,
  onTextSelect,
}: ReaderContentProps) {
  const theme = readerThemeStyles[prefs.theme]
  const fontClass =
    fontOptions.find((f) => f.value === prefs.fontFamily)?.className ?? 'font-crimson'

  const handleMouseUp = () => {
    if (!onTextSelect) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return
    onTextSelect({
      text: sel.toString(),
      start: 0,
      end: sel.toString().length,
    })
  }

  return (
    <div
      className={cn(
        'reader-content prose prose-lg max-w-none',
        fontClass,
        className
      )}
      style={{
        fontSize: `${prefs.fontSize}px`,
        lineHeight: prefs.lineHeight,
        textAlign: prefs.textAlign,
        color: theme.text,
        paddingLeft: noHorizontalPadding ? 0 : `${prefs.margins}px`,
        paddingRight: noHorizontalPadding ? 0 : `${prefs.margins}px`,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    />
  )
}
