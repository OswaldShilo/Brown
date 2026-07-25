import { toRange } from 'dom-anchor-text-quote'

export interface QuoteSelector {
  exact: string
  prefix?: string
  suffix?: string
}

export function resolveQuote(root: Node, selector: QuoteSelector): Range | null {
  try {
    const range = toRange(root, selector)
    return range ?? null
  } catch {
    return null
  }
}
