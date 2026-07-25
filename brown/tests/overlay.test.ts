import { describe, it, expect } from 'vitest'
import { createOverlaySvg, removeOverlaySvg } from '../src/render/overlay'

describe('overlay', () => {
  it('appends an absolutely positioned svg into the container', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const svg = createOverlaySvg(container)
    expect(container.contains(svg)).toBe(true)
    expect(svg.style.position).toBe('absolute')
    removeOverlaySvg(svg)
    expect(container.contains(svg)).toBe(false)
  })
})
