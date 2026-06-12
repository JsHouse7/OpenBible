import type { BibleVerse } from '@/data/completeBible'

export function sortVersesByNumber(verses: BibleVerse[]): BibleVerse[] {
  return [...verses].sort((a, b) => a.verse - b.verse)
}

export function getVerseRangeBetween(
  from: BibleVerse,
  to: BibleVerse,
  chapterVerses: BibleVerse[]
): BibleVerse[] {
  const min = Math.min(from.verse, to.verse)
  const max = Math.max(from.verse, to.verse)
  return sortVersesByNumber(chapterVerses.filter((v) => v.verse >= min && v.verse <= max))
}

export function isVerseInSelection(verse: BibleVerse, selection: BibleVerse[]): boolean {
  return selection.some((v) => v.id === verse.id)
}

export function formatVerseRangeLabel(verses: BibleVerse[]): string {
  const sorted = sortVersesByNumber(verses)
  if (sorted.length === 0) return ''
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (sorted.length === 1 || first.verse === last.verse) {
    return `${first.book} ${first.chapter}:${first.verse}`
  }
  return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`
}

export function formatVersesForCopy(verses: BibleVerse[], version?: string): string {
  const sorted = sortVersesByNumber(verses)
  const text = sorted.map((v) => v.text).join(' ')
  const label = formatVerseRangeLabel(sorted)
  return version ? `${text} — ${label} (${version})` : `${text} — ${label}`
}

export function getCombinedVerseText(verses: BibleVerse[]): string {
  return sortVersesByNumber(verses)
    .map((v) => v.text)
    .join(' ')
}

interface UpdateVerseSelectionOptions {
  verse: BibleVerse
  chapterVerses: BibleVerse[]
  currentSelection: BibleVerse[]
  selectionAnchor: BibleVerse | null
  shiftKey: boolean
  multiSelectKey: boolean
}

export function updateVerseSelection({
  verse,
  chapterVerses,
  currentSelection,
  selectionAnchor,
  shiftKey,
  multiSelectKey,
}: UpdateVerseSelectionOptions): { selection: BibleVerse[]; anchor: BibleVerse } {
  if (shiftKey) {
    const anchor = selectionAnchor ?? currentSelection[0] ?? verse
    return {
      selection: getVerseRangeBetween(anchor, verse, chapterVerses),
      anchor,
    }
  }

  if (multiSelectKey) {
    const isSelected = isVerseInSelection(verse, currentSelection)
    const nextSelection = isSelected
      ? currentSelection.filter((v) => v.id !== verse.id)
      : sortVersesByNumber([...currentSelection, verse])
    return {
      selection: nextSelection,
      anchor: verse,
    }
  }

  return {
    selection: [verse],
    anchor: verse,
  }
}
