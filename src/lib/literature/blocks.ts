import type { LiteratureBlock, LiteratureBlockKind } from './types'

export interface LiteratureWorkLike {
  chapters: Array<{ title?: string; content?: string | null }>
}

function classifyParagraph(text: string): LiteratureBlockKind {
  const trimmed = text.trim()
  if (/^https?:\/\/\S+$/i.test(trimmed)) return 'link'
  if (/^(\[\d+\]|†|\*\s)/.test(trimmed)) return 'footnote'
  if (/^(chapter|part|section|book|heading)\b/i.test(trimmed) && trimmed.length < 140) return 'heading'
  if (trimmed.includes('—') && /["“”]/.test(trimmed)) return 'scripture'
  return 'paragraph'
}

export function blocksFromWork(work: LiteratureWorkLike): LiteratureBlock[] {
  const blocks: LiteratureBlock[] = []

  work.chapters.forEach((chapter, chapterIndex) => {
    const title = (chapter.title || '').trim() || `Chapter ${chapterIndex + 1}`
    blocks.push({
      id: `c${chapterIndex}-title`,
      chapterIndex,
      kind: 'heading',
      source: 'title',
      text: title,
      charOffset: 0,
      charEnd: 0,
    })

    const content = chapter.content ?? ''
    let index = 0
    let blockIndex = 0
    let current: LiteratureBlock | null = null

    while (index < content.length) {
      let end = index
      while (end < content.length) {
        const newline = content.indexOf('\n', end)
        if (newline === -1) {
          end = content.length
          break
        }
        let after = newline + 1
        while (after < content.length && content[after] === '\n') after += 1
        if (after > newline + 1) {
          end = after
          break
        }
        end = newline + 1
      }
      const text = content.slice(index, end)
      if (text.trim()) {
        current = {
          id: `c${chapterIndex}-b${blockIndex}`,
          chapterIndex,
          kind: classifyParagraph(text),
          source: 'content',
          text,
          charOffset: index,
          charEnd: end,
        }
        blocks.push(current)
        blockIndex += 1
      } else if (current && current.chapterIndex === chapterIndex) {
        current.text += text
        current.charEnd = end
      }
      index = end
    }
  })

  return blocks
}
