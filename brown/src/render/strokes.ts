import { getStroke } from 'perfect-freehand'

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', stroke[0][0], stroke[0][1], 'Q'] as (string | number)[],
  )
  return d.join(' ') + ' Z'
}

export function underlinePath(x0: number, x1: number, y: number, seed: number): string {
  const steps = 12
  const points: number[][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const wobble = Math.sin(t * Math.PI * 2 + seed) * 1.2
    points.push([x0 + (x1 - x0) * t, y + wobble])
  }
  const stroke = getStroke(points, { size: 2.5, thinning: 0.4, smoothing: 0.5 })
  return getSvgPathFromStroke(stroke)
}
