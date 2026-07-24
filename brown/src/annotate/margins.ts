export interface Rect { x0: number; y0: number; x1: number; y1: number }
export type Side = 'left' | 'right'

const GUTTER = 9

export class Margins {
  private cursor: Record<Side, number>

  constructor(private zones: Record<Side, Rect>) {
    this.cursor = { left: zones.left.y0, right: zones.right.y0 }
  }

  place(anchorY: number, height: number, preferredSide?: Side): { side: Side; rect: Rect } | null {
    if (preferredSide) {
      const sides: Side[] = [preferredSide, preferredSide === 'left' ? 'right' : 'left']
      for (const side of sides) {
        const zone = this.zones[side]
        const y0 = Math.max(anchorY, this.cursor[side])
        const y1 = y0 + height
        if (y1 > zone.y1) continue
        return { side, rect: { x0: zone.x0, y0, x1: zone.x1, y1 } }
      }
      return null
    }

    let best: { side: Side; rect: Rect; score: number } | null = null
    for (const side of ['left', 'right'] as Side[]) {
      const zone = this.zones[side]
      const y0 = Math.max(anchorY, this.cursor[side])
      const y1 = y0 + height
      if (y1 > zone.y1) continue
      const score = Math.abs(y0 - anchorY)
      if (!best || score < best.score) {
        best = { side, rect: { x0: zone.x0, y0, x1: zone.x1, y1 }, score }
      }
    }
    return best ? { side: best.side, rect: best.rect } : null
  }

  commit(side: Side, y1: number): void {
    this.cursor[side] = Math.max(this.cursor[side], y1 + GUTTER)
  }
}