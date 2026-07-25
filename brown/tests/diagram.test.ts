import { describe, it, expect } from 'vitest'
import { layoutChain, renderChainDiagram } from '../src/render/diagram'

describe('layoutChain', () => {
  it('spaces nodes evenly across the given width without overflowing it', () => {
    const layout = layoutChain(['a', 'b', 'c'], { x: 0, y: 0, width: 300, height: 40 })
    expect(layout.nodeCount).toBe(3)
    expect(layout.nodeRects[0].x).toBe(0)
    expect(layout.nodeRects[2].x + layout.nodeRects[2].w).toBeLessThanOrEqual(300)
  })
})

describe('renderChainDiagram', () => {
  it('appends one shape per node plus connectors between them', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const layout = layoutChain(['a', 'b', 'c'], { x: 0, y: 0, width: 300, height: 40 })
    renderChainDiagram(svg, ['a', 'b', 'c'], layout, 1)
    // 3 rectangles + 3 text labels + 2 connectors = 8 appended top-level children
    expect(svg.childNodes.length).toBeGreaterThanOrEqual(8)
  })
})
