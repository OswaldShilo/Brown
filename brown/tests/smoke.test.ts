import { describe, it, expect } from 'vitest'

describe('scaffold smoke test', () => {
  it('runs in a jsdom environment with DOM globals available', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement('div').tagName).toBe('DIV')
  })
})
