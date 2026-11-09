import { describe, expect, it } from 'vitest'
import { columnCountForViewport, resolvePageTurn, spreadLabel, stepPage } from './pageLayout'

describe('spread layout', () => {
  it('uses two columns on a landscape tablet and one column on a phone', () => {
    expect(columnCountForViewport(1024, 768, 18, 'auto')).toBe(2)
    expect(columnCountForViewport(390, 844, 18, 'auto')).toBe(1)
    expect(columnCountForViewport(768, 1024, 18, 'auto')).toBe(1)
    expect(columnCountForViewport(1024, 768, 32, 'auto')).toBe(1)
    expect(columnCountForViewport(1400, 900, 18, 'single')).toBe(1)
    expect(columnCountForViewport(390, 844, 18, 'spread')).toBe(1)
  })

  it('advances a spread by the next pair and a single page by one', () => {
    expect(stepPage(0, 5, 1, 2)).toEqual({ page: 2, crossedEdge: false })
    expect(stepPage(1, 5, 1, 2)).toEqual({ page: 2, crossedEdge: false })
    expect(stepPage(3, 5, 1, 2)).toEqual({ page: 4, crossedEdge: false })
    expect(stepPage(4, 5, 1, 2)).toEqual({ page: 4, crossedEdge: true })
    expect(stepPage(2, 5, -1, 2)).toEqual({ page: 0, crossedEdge: false })
    expect(stepPage(0, 5, -1, 1)).toEqual({ page: 0, crossedEdge: true })
    expect(stepPage(2, 5, 1, 1)).toEqual({ page: 3, crossedEdge: false })
  })

  it('labels a spread without skipping the second page', () => {
    expect(spreadLabel(0, 5, 2)).toBe('1–2 / 5')
    expect(spreadLabel(4, 5, 2)).toBe('5 / 5')
    expect(spreadLabel(1, 4, 1)).toBe('2 / 4')
  })

  it('forces an instant turn when reduced motion is on', () => {
    expect(resolvePageTurn('paper', true)).toBe('none')
    expect(resolvePageTurn('slide', true)).toBe('none')
    expect(resolvePageTurn('paper', false)).toBe('paper')
  })
})
