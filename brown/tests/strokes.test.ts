import { describe, it, expect } from 'vitest'
import { getSvgPathFromStroke, underlinePath } from '../src/render/strokes'

describe('strokes', () => {
  it('produces a non-empty SVG path for a stroke outline', () => {
    const path = getSvgPathFromStroke([[0, 0], [10, 0], [10, 10], [0, 10]])
    expect(path.startsWith('M')).toBe(true)
    expect(path.endsWith('Z')).toBe(true)
  })

  it('returns an empty string for an empty stroke', () => {
    expect(getSvgPathFromStroke([])).toBe('')
  })

  it('generates a deterministic underline path for a given seed', () => {
    const a = underlinePath(0, 100, 20, 1)
    const b = underlinePath(0, 100, 20, 1)
    const c = underlinePath(0, 100, 20, 2)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})
