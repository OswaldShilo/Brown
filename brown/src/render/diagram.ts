import rough from 'roughjs'

export interface DiagramLayout {
  nodeCount: number
  nodeRects: { x: number; y: number; w: number; h: number }[]
}

export function layoutChain(
  labels: string[],
  area: { x: number; y: number; width: number; height: number },
): DiagramLayout {
  const gap = 12
  const nodeWidth = (area.width - gap * (labels.length - 1)) / labels.length
  const nodeHeight = Math.min(area.height, 40)
  const nodeRects = labels.map((_, i) => ({
    x: area.x + i * (nodeWidth + gap),
    y: area.y,
    w: nodeWidth,
    h: nodeHeight,
  }))
  return { nodeCount: labels.length, nodeRects }
}

export function renderChainDiagram(
  svg: SVGSVGElement,
  labels: string[],
  layout: DiagramLayout,
  seed: number,
): void {
  // NOTE: verify the `rough.svg(...)` signature and its TS types against the
  // installed roughjs version (Task 1's dependency) before relying on this —
  // the drawing calls below (rectangle/line) are stable across roughjs 4.x.
  const rc = rough.svg(svg, { options: { seed } })

  layout.nodeRects.forEach((rect, i) => {
    const node = rc.rectangle(rect.x, rect.y, rect.w, rect.h, { roughness: 1.8, stroke: '#3a5aa0' })
    svg.appendChild(node)

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', String(rect.x + rect.w / 2))
    text.setAttribute('y', String(rect.y + rect.h / 2))
    text.setAttribute('text-anchor', 'middle')
    text.textContent = labels[i]
    svg.appendChild(text)

    if (i > 0) {
      const prev = layout.nodeRects[i - 1]
      const connector = rc.line(prev.x + prev.w, prev.y + prev.h / 2, rect.x, rect.y + rect.h / 2, {
        roughness: 1.5,
      })
      svg.appendChild(connector)
    }
  })
}
