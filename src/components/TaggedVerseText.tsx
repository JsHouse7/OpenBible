"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import type { TaggedToken } from "@/types/lexicon"

interface TaggedVerseTextProps {
  tokens: TaggedToken[]
  /** Invoked when a Strong's-tagged word/phrase is activated. */
  onWordSelect: (strongsIds: string[], surface: string) => void
  className?: string
}

const LEADING_PUNCT_RE = /^[.,;:!?')\]]/

/**
 * Renders a Strong's-tagged verse as inline tokens. Tagged words/phrases are
 * focusable and clickable (opening the word-study panel); untagged tokens and
 * translator-supplied italics render as plain text. Word activation stops
 * propagation so the surrounding verse click/selection behavior is preserved.
 */
export const TaggedVerseText = memo(function TaggedVerseText({
  tokens,
  onWordSelect,
  className,
}: TaggedVerseTextProps) {
  return (
    <span className={className}>
      {tokens.map((token, index) => {
        const separator = index === 0 || LEADING_PUNCT_RE.test(token.t) ? "" : " "
        const text = token.i ? <i>{token.t}</i> : token.t

        if (!token.s || token.s.length === 0) {
          return (
            <span key={index}>
              {separator}
              {text}
            </span>
          )
        }

        const strongsIds = token.s
        return (
          <span key={index}>
            {separator}
            <span
              role="button"
              tabIndex={0}
              aria-label={`Study word: ${token.t} (Strong's ${strongsIds.join(", ")})`}
              className={cn(
                "cursor-pointer rounded-sm underline-offset-4",
                "hover:underline hover:decoration-dotted hover:decoration-primary/60 hover:text-primary",
                "focus-visible:underline focus-visible:decoration-dotted focus-visible:outline-none focus-visible:text-primary"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onWordSelect(strongsIds, token.t)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  onWordSelect(strongsIds, token.t)
                }
              }}
            >
              {text}
            </span>
          </span>
        )
      })}
    </span>
  )
})
