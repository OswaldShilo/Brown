import { describe, it, expect } from 'vitest'
import { Margins } from '../src/annotate/margins'

const zones = {
  left: { x0: 0, y0: 0, x1: 100, y1: 500 },
  right: { x0: 400, y0: 0, x1: 500, y1: 500 },
}

describe('Margins', () => {
  it('places a note at the anchor y on an empty zone', () => {
    const m = new Margins(zones)
    const placed = m.place(50, 40)
    expect(placed).not.toBeNull()
    expect(placed!.rect.y0).toBe(50)
    expect(placed!.rect.y1).toBe(90)
  })

  it('does not overlap a previously committed note in the same zone', () => {
    const m = new Margins(zones)
    const first = m.place(50, 40)!
    m.commit(first.side, first.rect.y1)
    const second = m.place(60, 40, first.side)!
    expect(second.rect.y0).toBeGreaterThanOrEqual(first.rect.y1 + 9)
  })

  it('returns null when neither zone has room', () => {
    const m = new Margins(zones)
    const placed = m.place(480, 100)
    expect(placed).toBeNull()
  })
})
