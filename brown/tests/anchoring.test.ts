import { describe, it, expect } from 'vitest'
import { resolveQuote } from '../src/annotate/anchoring'

function makeContainer(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

describe('resolveQuote', () => {
  it('resolves an exact quote to a Range', () => {
    const root = makeContainer('<p>The cache layer reduces cost significantly.</p>')
    const range = resolveQuote(root, { exact: 'cache layer reduces cost' })
    expect(range).not.toBeNull()
    expect(range!.toString()).toBe('cache layer reduces cost')
  })

  it('returns null when the quote cannot be found', () => {
    const root = makeContainer('<p>Nothing relevant here.</p>')
    const range = resolveQuote(root, { exact: 'quote that does not exist anywhere' })
    expect(range).toBeNull()
  })
})
