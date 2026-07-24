import { describe, it, expect } from 'vitest'
import { findCandidates } from '../src/annotate/heuristics'

function root(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

describe('findCandidates', () => {
  it('picks up headings, bold text, and inline code in that order', () => {
    const el = root(
      '<h2>Architecture Overview</h2><p>Uses a <strong>prompt cache</strong> and <code>retry()</code>.</p>',
    )
    expect(findCandidates(el)).toEqual([
      { text: 'Architecture Overview', kind: 'heading' },
      { text: 'prompt cache', kind: 'bold' },
      { text: 'retry()', kind: 'code' },
    ])
  })

  it('drops duplicates and fragments under 3 characters, and caps at 15', () => {
    const many = Array.from({ length: 20 }, (_, i) => `<strong>term ${i}</strong>`).join('')
    const el = root(many + '<strong>ok</strong><strong>hi</strong><strong>term 0</strong>')
    const result = findCandidates(el)
    expect(result.length).toBe(15)
    expect(result.filter(c => c.text === 'term 0').length).toBe(1)
    expect(result.some(c => c.text === 'hi')).toBe(false)
  })
})
