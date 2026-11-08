'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Highlighter, List, StickyNote, Type, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  decorateSlice,
  readLocalAnnotations,
  toggleBookmark,
  writeLocalAnnotations,
  type LiteratureAnnotation,
} from '@/lib/literature/annotations'
import { blocksFromWork } from '@/lib/literature/blocks'
import {
  chapterPageStats,
  classifyDrag,
  createWidthMeasure,
  findPageIndex,
  paginateBlocks,
  progressForAnchor,
  resolvePageTurn,
  resolveReadingLayout,
  stepAnchor,
  visiblePages,
} from '@/lib/literature/paginate'
import {
  chooseFresherPosition,
  clampAnchor,
  parsePositionRecord,
  readLocalPosition,
  writeLocalPosition,
} from '@/lib/literature/position'
import type { ContentAnchor, LiteraturePage, PageSlice, PageTurnPreference, ReadingLayoutPreference } from '@/lib/literature/types'
import './reader.css'

export interface ReaderWork {
  title: string
  author: string
  year?: number | null
  description?: string
  chapters: Array<{ title?: string; content?: string | null }>
}

interface ReaderSettings {
  fontSize: number
  lineHeight: number
  fontKey: FontKey
  surface: SurfaceKey
  layout: ReadingLayoutPreference
  motion: PageTurnPreference
}

type FontKey = 'source-serif' | 'libre-baskerville' | 'eb-garamond' | 'lora'
type SurfaceKey = 'light' | 'warm' | 'sepia' | 'dark'

const SETTINGS_KEY = 'openbible-literature-reader-settings'
const FONTS: Record<FontKey, { label: string; className: string; css: string }> = {
  'source-serif': { label: 'Source Serif', className: 'font-source-serif', css: '"Source Serif 4", Georgia, serif' },
  'libre-baskerville': { label: 'Libre Baskerville', className: 'font-libre-baskerville', css: '"Libre Baskerville", Georgia, serif' },
  'eb-garamond': { label: 'EB Garamond', className: 'font-eb-garamond', css: '"EB Garamond", Georgia, serif' },
  lora: { label: 'Lora', className: 'font-lora', css: 'Lora, Georgia, serif' },
}

const SURFACES: Record<SurfaceKey, { bg: string; page: string; ink: string; muted: string; accent: string; rule: string; mark: string }> = {
  light: { bg: '#f7f4ee', page: '#fffdf8', ink: '#1c1915', muted: '#5c564c', accent: '#6d432b', rule: '#e4dccf', mark: '#f4e3b8' },
  warm: { bg: '#f3e6d4', page: '#fbf6ee', ink: '#291f16', muted: '#6a5340', accent: '#8a4b2f', rule: '#e3d2b6', mark: '#efd7a4' },
  sepia: { bg: '#ead7b2', page: '#f4e6c8', ink: '#342414', muted: '#684f32', accent: '#7a3e22', rule: '#d9c39a', mark: '#e8cb8d' },
  dark: { bg: '#14110e', page: '#221d17', ink: '#f4ecdf', muted: '#d4c6b0', accent: '#e2b57a', rule: '#3d342b', mark: '#5c4630' },
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 19,
  lineHeight: 1.65,
  fontKey: 'source-serif',
  surface: 'warm',
  layout: 'spread',
  motion: 'slide',
}

function readSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || 'null') as Partial<ReaderSettings> | null
    if (!parsed) return DEFAULT_SETTINGS
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      fontSize: clampNumber(parsed.fontSize, 15, 28, DEFAULT_SETTINGS.fontSize),
      lineHeight: clampNumber(parsed.lineHeight, 1.35, 2.1, DEFAULT_SETTINGS.lineHeight),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && value >= min && value <= max ? value : fallback
}

function measureCharWidth(fontCss: string, fontSize: number) {
  if (typeof document === 'undefined') return fontSize * 0.45
  const probe = document.createElement('span')
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${fontSize}px ${fontCss}`
  const sample = 'the treatise appears to have been written in a steady human hand'
  probe.textContent = sample
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width / sample.length
  probe.remove()
  return width > 0 ? width : fontSize * 0.45
}

function selectionIsActive() {
  const selection = typeof window === 'undefined' ? null : window.getSelection()
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim())
}

export function LiteratureReaderView({
  work,
  workId,
  onClose,
  previewLabel,
  accountPosition,
  accountAnnotations,
  onAccountPosition,
  onAccountAnnotations,
}: {
  work: ReaderWork
  workId: string
  onClose: () => void
  previewLabel?: string
  accountPosition?: unknown
  accountAnnotations?: LiteratureAnnotation[]
  onAccountPosition?: (position: NonNullable<ReturnType<typeof readLocalPosition>>) => void
  onAccountAnnotations?: (annotations: LiteratureAnnotation[]) => void
}) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const [anchor, setAnchor] = useState<ContentAnchor>({ chapterIndex: 0, charOffset: 0, atTitle: true })
  const [annotations, setAnnotations] = useState<LiteratureAnnotation[]>([])
  const [chrome, setChrome] = useState(true)
  const [panel, setPanel] = useState<'contents' | 'settings' | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [selectionRange, setSelectionRange] = useState<{ start: ContentAnchor; end: ContentAnchor } | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const [dragX, setDragX] = useState(0)
  const [turnClass, setTurnClass] = useState('')
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const scrollDriven = useRef(false)
  const turnLock = useRef(false)
  const restored = useRef(false)

  const surface = SURFACES[settings.surface]
  const font = FONTS[settings.fontKey]
  const chapterLengths = useMemo(
    () => work.chapters.map((chapter) => (chapter.content ?? '').length),
    [work.chapters]
  )
  const blocks = useMemo(() => blocksFromWork(work), [work])
  const layout = resolveReadingLayout(settings.layout, box.width, settings.fontSize)
  const columnWidth = layout === 'spread'
    ? Math.max(220, Math.floor((box.width - 36) / 2))
    : Math.max(220, Math.min(box.width - 8, 680))
  const pageHeight = Math.max(160, box.height - 80)
  const charWidth = useMemo(
    () => measureCharWidth(font.css, settings.fontSize),
    [font.css, settings.fontSize]
  )
  const measure = useMemo(
    () => createWidthMeasure({
      contentWidth: Math.max(180, columnWidth - 64),
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      charWidth,
    }),
    [charWidth, columnWidth, settings.fontSize, settings.lineHeight]
  )
  const pages = useMemo(() => {
    if (box.width < 80 || box.height < 80) return [] as LiteraturePage[]
    return paginateBlocks(blocks, { pageContentHeight: pageHeight, measure })
  }, [blocks, box.height, box.width, measure, pageHeight])

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    setSettings(readSettings())
    const lengths = work.chapters.map((chapter) => (chapter.content ?? '').length)
    const local = readLocalPosition(workId)
    const remoteParsed = parsePositionRecord(accountPosition)
    const remote = remoteParsed ? { workId, ...remoteParsed } : null
    const chosen = chooseFresherPosition(local, remote)
    setAnchor(chosen ? clampAnchor(chosen, lengths) : { chapterIndex: 0, charOffset: 0, atTitle: true })
    const localNotes = readLocalAnnotations().filter((item) => item.workId === workId)
    const remoteNotes = (accountAnnotations ?? []).filter((item) => item.workId === workId)
    const merged = new Map<string, LiteratureAnnotation>()
    remoteNotes.forEach((item) => merged.set(item.id, item))
    localNotes.forEach((item) => merged.set(item.id, item))
    setAnnotations([...merged.values()])
    setReady(true)
  }, [accountAnnotations, accountPosition, work.chapters, workId])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      setBox({ width: node.clientWidth, height: node.clientHeight })
    })
    observer.observe(node)
    setBox({ width: node.clientWidth, height: node.clientHeight })
    return () => observer.disconnect()
  }, [layout])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [ready, settings])

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      const position = {
        workId,
        chapterIndex: anchor.chapterIndex,
        charOffset: anchor.charOffset,
        atTitle: anchor.atTitle,
        chapterTitle: work.chapters[anchor.chapterIndex]?.title,
        updatedAt: new Date().toISOString(),
      }
      writeLocalPosition(position)
      onAccountPosition?.(position)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [anchor, onAccountPosition, ready, work.chapters, workId])

  useEffect(() => {
    if (!ready) return
    const others = readLocalAnnotations().filter((item) => item.workId !== workId)
    const next = [...others, ...annotations]
    writeLocalAnnotations(next)
    onAccountAnnotations?.(next)
  }, [annotations, onAccountAnnotations, ready, workId])

  const activeLayout = layout === 'scroll' ? 'single' : layout
  const pageIndex = pages.length ? findPageIndex(pages, anchor) : 0
  const spread = pages.length ? visiblePages(pages, anchor, activeLayout) : []
  const stats = pages.length ? chapterPageStats(pages, pageIndex) : null
  const chapterTitle = work.chapters[anchor.chapterIndex]?.title || `Chapter ${anchor.chapterIndex + 1}`
  const progress = progressForAnchor(chapterLengths, anchor)
  const motion = resolvePageTurn(settings.motion, reducedMotion)
  const canGoBack = Boolean(pages.length && stepAnchor(pages, anchor, -1, activeLayout))
  const canGoForward = Boolean(pages.length && stepAnchor(pages, anchor, 1, activeLayout))

  const go = useCallback((direction: 1 | -1) => {
    if (!pages.length || turnLock.current || layout === 'scroll') return
    const next = stepAnchor(pages, anchor, direction, activeLayout)
    if (!next) {
      setDragX(0)
      return
    }
    const activeMotion = resolvePageTurn(settings.motion, reducedMotion)
    if (activeMotion === 'none') {
      setAnchor(next)
      setDragX(0)
      setTurnClass('')
      return
    }
    turnLock.current = true
    setDragX(0)
    setTurnClass(activeMotion === 'paper'
      ? direction === 1 ? 'lit-leaf is-turning-next' : 'lit-leaf is-turning-prev'
      : direction === 1 ? 'lit-slide-next' : 'lit-slide-prev')
    window.setTimeout(() => {
      setAnchor(next)
      setTurnClass('')
      turnLock.current = false
    }, activeMotion === 'paper' ? 460 : 240)
  }, [activeLayout, anchor, layout, pages, reducedMotion, settings.motion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (layout !== 'scroll' && (event.key === 'ArrowRight' || event.key === 'PageDown')) {
        event.preventDefault()
        go(1)
      } else if (layout !== 'scroll' && (event.key === 'ArrowLeft' || event.key === 'PageUp')) {
        event.preventDefault()
        go(-1)
      } else if (event.key === 'Escape') {
        if (panel) setPanel(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, layout, onClose, panel])

  useEffect(() => {
    if (!chrome) return
    const timer = window.setTimeout(() => setChrome(false), 3200)
    return () => window.clearTimeout(timer)
  }, [chrome, anchor, panel])

  useEffect(() => {
    if (layout !== 'scroll' || scrollDriven.current) return
    const root = scrollRef.current
    if (!root) return
    const target = anchor.atTitle
      ? root.querySelector<HTMLElement>(`[data-title-chapter="${anchor.chapterIndex}"]`)
      : [...root.querySelectorAll<HTMLElement>('[data-char-start]')].find((node) => {
          const chapter = Number(node.dataset.chapter)
          const start = Number(node.dataset.charStart)
          const end = Number(node.dataset.charEnd)
          return chapter === anchor.chapterIndex && start <= anchor.charOffset && anchor.charOffset < end
        })
    target?.scrollIntoView({ block: 'start' })
  }, [anchor, layout, settings.fontSize, settings.lineHeight])

  const rememberScrollAnchor = () => {
    const root = scrollRef.current
    if (!root) return
    const edge = root.getBoundingClientRect().top + 24
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-char-start], [data-title-chapter]')]
    const current = nodes.find((node) => node.getBoundingClientRect().bottom >= edge) ?? nodes[0]
    if (!current) return
    scrollDriven.current = true
    if (current.dataset.titleChapter) {
      setAnchor({ chapterIndex: Number(current.dataset.titleChapter), charOffset: 0, atTitle: true })
    } else {
      setAnchor({
        chapterIndex: Number(current.dataset.chapter),
        charOffset: Number(current.dataset.charStart),
      })
    }
    window.setTimeout(() => {
      scrollDriven.current = false
    }, 80)
  }

  const captureSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setSelectionRange(null)
      return
    }
    const range = selection.getRangeAt(0)
    const frame = frameRef.current
    if (frame && !frame.contains(range.commonAncestorContainer)) return
    const start = offsetFromBoundary(range.startContainer, range.startOffset)
    const end = offsetFromBoundary(range.endContainer, range.endOffset)
    if (!start || !end || start.atTitle || end.atTitle || start.chapterIndex !== end.chapterIndex) {
      setSelectionRange(null)
      return
    }
    const ordered = start.charOffset <= end.charOffset ? { start, end } : { start: end, end: start }
    if (ordered.start.charOffset === ordered.end.charOffset) {
      setSelectionRange(null)
      return
    }
    setSelectionRange(ordered)
    setChrome(true)
  }, [])


  const addHighlight = () => {
    if (!selectionRange) return
    const item: LiteratureAnnotation = {
      id: `highlight-${workId}-${Date.now()}`,
      workId,
      kind: 'highlight',
      chapterIndex: selectionRange.start.chapterIndex,
      charOffset: selectionRange.start.charOffset,
      charEnd: selectionRange.end.charOffset,
      color: surface.mark,
      createdAt: new Date().toISOString(),
    }
    setAnnotations((current) => [...current, item])
    window.getSelection()?.removeAllRanges()
    setSelectionRange(null)
  }

  const addNote = () => {
    if (!selectionRange || !noteDraft.trim()) return
    const item: LiteratureAnnotation = {
      id: `note-${workId}-${Date.now()}`,
      workId,
      kind: 'note',
      chapterIndex: selectionRange.start.chapterIndex,
      charOffset: selectionRange.start.charOffset,
      charEnd: selectionRange.end.charOffset,
      note: noteDraft.trim(),
      createdAt: new Date().toISOString(),
    }
    setAnnotations((current) => [...current, item])
    setNoteDraft('')
    window.getSelection()?.removeAllRanges()
    setSelectionRange(null)
  }

  const bookmarked = annotations.some((item) =>
    item.kind === 'bookmark' && item.chapterIndex === anchor.chapterIndex && item.charOffset === anchor.charOffset && Boolean(item.atTitle) === Boolean(anchor.atTitle)
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (layout === 'scroll' || event.button !== 0) return
    if ((event.target as HTMLElement).closest('a, button, input, textarea')) return
    dragOrigin.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current
    if (!origin || layout === 'scroll' || turnLock.current) return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    const decision = classifyDrag({
      dx,
      dy,
      width: box.width || 1,
      selecting: selectionIsActive(),
      phase: 'move',
    })
    if (decision === 'pending') {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      setDragX(dx)
    }
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current
    dragOrigin.current = null
    if (!origin || layout === 'scroll') return
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    const decision = classifyDrag({
      dx,
      dy,
      width: box.width || 1,
      selecting: selectionIsActive(),
      phase: 'end',
    })
    if (decision === 'commit-next') go(1)
    else if (decision === 'commit-prev') go(-1)
    else setDragX(0)
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && !selectionIsActive()) {
      setChrome((current) => !current)
    }
  }

  const workAnnotations = annotations.filter((item) => item.workId === workId)
  const textMissing = work.chapters.every((chapter) => !(chapter.content || '').trim())

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: surface.bg, color: surface.ink }}>
      {previewLabel && (
        <p className="bg-[#6d432b] px-4 py-1 text-center text-xs tracking-wide text-[#fff8ee]">
          {previewLabel}
        </p>
      )}
      <header className={cn('flex items-center gap-2 border-b px-3 py-2 transition-opacity sm:px-5', chrome || panel ? 'opacity-100' : 'pointer-events-none opacity-0')} style={{ borderColor: surface.rule }}>
        <Button variant="ghost" className="min-h-11 min-w-11" onClick={onClose} aria-label="Close reader">
          <X className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-playfair text-lg leading-tight">{work.title}</p>
          <p className="truncate text-xs" style={{ color: surface.muted }}>
            {work.author}{work.year ? ` · ${work.year}` : ''}
          </p>
        </div>
        <Button variant="ghost" className="min-h-11 min-w-11" aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this page'} onClick={() => {
          setAnnotations((current) => toggleBookmark(current, {
            workId,
            chapterIndex: anchor.chapterIndex,
            charOffset: anchor.charOffset,
          }, new Date().toISOString()).map((item) => (
            item.kind === 'bookmark' && item.workId === workId && item.chapterIndex === anchor.chapterIndex && item.charOffset === anchor.charOffset
              ? { ...item, atTitle: anchor.atTitle }
              : item
          )))
        }}>
          <Bookmark className="h-5 w-5" fill={bookmarked ? surface.accent : 'none'} />
        </Button>
        <Button variant="ghost" className="min-h-11 min-w-11" aria-label="Contents" onClick={() => setPanel(panel === 'contents' ? null : 'contents')}>
          <List className="h-5 w-5" />
        </Button>
        <Button variant="ghost" className="min-h-11 min-w-11" aria-label="Reading settings" onClick={() => setPanel(panel === 'settings' ? null : 'settings')}>
          <Type className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        {panel && (
          <aside className="absolute inset-y-0 right-0 z-20 w-[min(100%,22rem)] overflow-y-auto border-l p-4 shadow-xl" style={{ background: surface.page, borderColor: surface.rule }}>
            {panel === 'settings' ? (
              <SettingsPanel settings={settings} reducedMotion={reducedMotion} layout={layout} onChange={setSettings} surface={surface} />
            ) : (
              <ContentsPanel
                work={work}
                anchor={anchor}
                annotations={workAnnotations}
                surface={surface}
                onJump={(next) => {
                  setAnchor(next)
                  setPanel(null)
                  setChrome(true)
                }}
              />
            )}
          </aside>
        )}

        <div
          ref={frameRef}
          className="h-full outline-none"
          tabIndex={0}
          aria-label="Literature pages"
          style={{ touchAction: layout === 'scroll' ? 'pan-y' : 'pan-y' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => {
            finishDrag(event)
            captureSelection()
          }}
          onKeyUp={(event) => {
            if (event.key === 'Shift' || event.key.startsWith('Arrow')) captureSelection()
          }}
          onPointerCancel={() => {
            dragOrigin.current = null
            setDragX(0)
          }}
        >
          {textMissing ? (
            <p className="mx-auto max-w-md px-6 pt-16 text-center font-source-serif text-xl" style={{ color: surface.muted }}>
              This copy does not include the text yet.
            </p>
          ) : layout === 'scroll' ? (
            <div ref={scrollRef} className="h-full overflow-y-auto px-5 py-8" onScroll={rememberScrollAnchor}>
              <article className={cn('mx-auto max-w-[66ch]', font.className)} style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
                {blocks.map((block) => (
                  <SliceBody
                    key={block.id}
                    slice={{ ...block, height: 0, blockId: block.id }}
                    annotations={workAnnotations}
                    surface={surface}
                    titleAttribute={block.source === 'title' ? block.chapterIndex : undefined}
                  />
                ))}
              </article>
            </div>
          ) : (
            <div
              className={cn('flex h-full gap-3 px-3 py-3 sm:px-5', turnClass)}
              style={{
                transform: dragX ? `translateX(${dragX}px)` : undefined,
                transition: dragX ? 'none' : motion === 'none' ? 'none' : undefined,
              }}
            >
              {spread.map((page) => (
                <article
                  key={page.index}
                  className="lit-page min-w-0 flex-1 rounded-sm px-5 py-6 sm:px-8"
                  style={{ background: surface.page, boxShadow: '0 10px 30px rgba(48, 32, 18, 0.08)' }}
                >
                  <div className={cn(font.className)} style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
                    {mergeContinuation(page.slices).map((slice, index) => (
                      <SliceBody key={`${slice.blockId}-${slice.charOffset}-${index}`} slice={slice} annotations={workAnnotations} surface={surface} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {selectionRange && (
          <div className="absolute bottom-3 left-1/2 z-30 flex w-[min(100%-1.5rem,28rem)] -translate-x-1/2 items-center gap-2 rounded-full border px-2 py-1 shadow-lg" style={{ background: surface.page, borderColor: surface.rule }}>
            <Button variant="ghost" className="min-h-11" onClick={addHighlight}>
              <Highlighter className="mr-1 h-4 w-4" /> Highlight
            </Button>
            <input
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Add a note"
              aria-label="Note"
              className="min-h-11 flex-1 bg-transparent px-2 text-sm outline-none"
              style={{ color: surface.ink }}
            />
            <Button variant="ghost" className="min-h-11" onClick={addNote} disabled={!noteDraft.trim()}>
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <footer className="flex items-center gap-2 border-t px-3 py-2 sm:px-5" style={{ borderColor: surface.rule, background: surface.bg }}>
        <Button variant="outline" className="min-h-11 min-w-11 border-transparent" style={{ color: surface.ink }} onClick={() => go(-1)} disabled={!canGoBack || layout === 'scroll'} aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="min-w-0 flex-1 text-center text-xs leading-5" style={{ color: surface.muted }} aria-live="polite">
          <span className="block truncate font-medium" style={{ color: surface.ink }}>{chapterTitle}</span>
          {layout === 'scroll'
            ? `${progress}% through the text`
            : stats
              ? `Page ${stats.overall} of ${stats.total} · ${progress}%`
              : 'Preparing pages'}
          {settings.layout === 'spread' && layout === 'single' ? ' · Single page, not enough room for a spread' : ''}
          {reducedMotion ? ' · Reduced motion' : ''}
        </p>
        <Button variant="outline" className="min-h-11 min-w-11 border-transparent" style={{ color: surface.ink }} onClick={() => go(1)} disabled={!canGoForward || layout === 'scroll'} aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </footer>
    </div>
  )
}

function offsetFromBoundary(node: Node, offset: number): ContentAnchor | null {
  const element = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) as HTMLElement | null
  const holder = element?.closest<HTMLElement>('[data-char-start], [data-title-chapter]')
  if (!holder) return null
  if (holder.dataset.titleChapter) {
    return { chapterIndex: Number(holder.dataset.titleChapter), charOffset: 0, atTitle: true }
  }
  return {
    chapterIndex: Number(holder.dataset.chapter),
    charOffset: Number(holder.dataset.charStart) + (node.nodeType === Node.TEXT_NODE ? offset : 0),
  }
}

function mergeContinuation(slices: PageSlice[]) {
  const merged: PageSlice[] = []
  for (const slice of slices) {
    const previous = merged[merged.length - 1]
    if (previous && previous.blockId === slice.blockId && previous.charEnd === slice.charOffset) {
      previous.text += slice.text
      previous.charEnd = slice.charEnd
      previous.height += slice.height
      continue
    }
    merged.push({ ...slice })
  }
  return merged
}

function SliceBody({
  slice,
  annotations,
  surface,
  titleAttribute,
}: {
  slice: PageSlice
  annotations: LiteratureAnnotation[]
  surface: (typeof SURFACES)[SurfaceKey]
  titleAttribute?: number
}) {
  const segments = decorateSlice(slice, annotations)
  let cursor = slice.source === 'title' ? 0 : slice.charOffset
  const body = segments.map((segment, index) => {
    const start = cursor
    cursor += segment.text.length
    return (
      <span
        key={`${segment.annotationId ?? 't'}-${index}`}
        data-chapter={slice.chapterIndex}
        data-char-start={slice.source === 'title' ? undefined : start}
        data-char-end={slice.source === 'title' ? undefined : start + segment.text.length}
        style={segment.annotationId ? { background: segment.color || surface.mark, borderRadius: 2 } : undefined}
        title={segment.note || undefined}
      >
        {segment.text}
      </span>
    )
  })
  const titleMarker = titleAttribute ?? (slice.source === 'title' ? slice.chapterIndex : undefined)

  if (slice.kind === 'heading' || slice.source === 'title') {
    return <h2 className="mb-4 font-playfair text-[1.35em] leading-tight" data-title-chapter={titleMarker}>{body}</h2>
  }
  if (slice.kind === 'scripture') {
    return <blockquote className="my-4 border-l-2 pl-4" style={{ borderColor: surface.accent }}>{body}</blockquote>
  }
  if (slice.kind === 'footnote') {
    return <p className="mb-3 text-[0.82em]" style={{ color: surface.muted }}>{body}</p>
  }
  if (slice.kind === 'link') {
    const href = slice.text.trim()
    return <p className="mb-4"><a className="underline" style={{ color: surface.accent }} href={href}>{body}</a></p>
  }
  return <p className="mb-4">{body}</p>
}

function SettingsPanel({
  settings,
  onChange,
  reducedMotion,
  layout,
  surface,
}: {
  settings: ReaderSettings
  onChange: (next: ReaderSettings) => void
  reducedMotion: boolean
  layout: string
  surface: (typeof SURFACES)[SurfaceKey]
}) {
  return (
    <div className="space-y-5 text-sm">
      <h2 className="font-playfair text-2xl">Reading</h2>
      <label className="block">
        Font size, {settings.fontSize}px
        <input className="mt-2 w-full" type="range" min={15} max={28} value={settings.fontSize} onChange={(event) => onChange({ ...settings, fontSize: Number(event.target.value) })} />
      </label>
      <label className="block">
        Line spacing, {settings.lineHeight.toFixed(2)}
        <input className="mt-2 w-full" type="range" min={135} max={210} value={Math.round(settings.lineHeight * 100)} onChange={(event) => onChange({ ...settings, lineHeight: Number(event.target.value) / 100 })} />
      </label>
      <label className="block">
        Typeface
        <select className="mt-2 min-h-11 w-full rounded border bg-transparent px-2" style={{ borderColor: surface.rule }} value={settings.fontKey} onChange={(event) => onChange({ ...settings, fontKey: event.target.value as FontKey })}>
          {Object.entries(FONTS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
      </label>
      <div>
        <p className="mb-2">Surface</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(SURFACES) as SurfaceKey[]).map((key) => (
            <button key={key} type="button" aria-pressed={settings.surface === key} className="min-h-11 rounded border text-xs capitalize" style={{ background: SURFACES[key].page, color: SURFACES[key].ink, borderColor: settings.surface === key ? SURFACES[key].accent : SURFACES[key].rule }} onClick={() => onChange({ ...settings, surface: key })}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        Pages
        <select className="mt-2 min-h-11 w-full rounded border bg-transparent px-2" style={{ borderColor: surface.rule }} value={settings.layout} onChange={(event) => onChange({ ...settings, layout: event.target.value as ReadingLayoutPreference })}>
          <option value="scroll">Scroll</option>
          <option value="single">Single page</option>
          <option value="spread">Two-page spread</option>
        </select>
        {settings.layout === 'spread' && layout === 'single' && <p className="mt-2" style={{ color: surface.muted }}>This width fits one page at the current type size.</p>}
      </label>
      <label className="block">
        Page turn
        <select className="mt-2 min-h-11 w-full rounded border bg-transparent px-2" style={{ borderColor: surface.rule }} value={settings.motion} onChange={(event) => onChange({ ...settings, motion: event.target.value as PageTurnPreference })}>
          <option value="none">None</option>
          <option value="slide">Slide</option>
          <option value="paper">Paper</option>
        </select>
        {reducedMotion && <p className="mt-2" style={{ color: surface.muted }}>Reduced motion is on, so page turns stay instant.</p>}
      </label>
    </div>
  )
}

function ContentsPanel({
  work,
  anchor,
  annotations,
  onJump,
  surface,
}: {
  work: ReaderWork
  anchor: ContentAnchor
  annotations: LiteratureAnnotation[]
  onJump: (next: ContentAnchor) => void
  surface: (typeof SURFACES)[SurfaceKey]
}) {
  const bookmarks = annotations.filter((item) => item.kind === 'bookmark')
  const notes = annotations.filter((item) => item.kind === 'note')
  return (
    <div className="space-y-6">
      <h2 className="font-playfair text-2xl">Contents</h2>
      <ol className="space-y-1">
        {work.chapters.map((chapter, index) => (
          <li key={`${chapter.title}-${index}`}>
            <button
              type="button"
              className="min-h-11 w-full rounded px-2 text-left text-sm"
              style={{ background: anchor.chapterIndex === index ? surface.mark : 'transparent' }}
              onClick={() => onJump({ chapterIndex: index, charOffset: 0, atTitle: true })}
            >
              {chapter.title || `Chapter ${index + 1}`}
            </button>
          </li>
        ))}
      </ol>
      {bookmarks.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.16em]" style={{ color: surface.muted }}>Bookmarks</h3>
          {bookmarks.map((item) => (
            <button key={item.id} type="button" className="mb-1 min-h-11 w-full rounded px-2 text-left text-sm" onClick={() => onJump({ chapterIndex: item.chapterIndex, charOffset: item.charOffset, atTitle: item.atTitle })}>
              {work.chapters[item.chapterIndex]?.title || `Chapter ${item.chapterIndex + 1}`}
            </button>
          ))}
        </section>
      )}
      {notes.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.16em]" style={{ color: surface.muted }}>Notes</h3>
          {notes.map((item) => (
            <button key={item.id} type="button" className="mb-2 block min-h-11 w-full rounded px-2 text-left text-sm" onClick={() => onJump({ chapterIndex: item.chapterIndex, charOffset: item.charOffset })}>
              <span className="block" style={{ color: surface.muted }}>{work.chapters[item.chapterIndex]?.title}</span>
              {item.note}
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
