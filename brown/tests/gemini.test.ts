import { describe, it, expect, vi } from 'vitest'
import { annotateWithGemini } from '../src/annotate/gemini'

function mockFetch(responseJson: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(responseJson) }] } }],
    }),
  })) as unknown as typeof fetch
}

describe('annotateWithGemini', () => {
  it('parses and returns a valid response', async () => {
    const fetchImpl = mockFetch({
      notes: [{ quote: 'prompt cache', note: 'Reused prefix, cuts token cost.' }],
      diagram: { title: 'flow', labels: ['queue', 'cache', 'model'] },
    })
    const result = await annotateWithGemini(
      'the prompt cache layer',
      [{ text: 'prompt cache', kind: 'bold' }],
      'test-key',
      fetchImpl,
    )
    expect(result.notes).toHaveLength(1)
    expect(result.diagram?.labels).toEqual(['queue', 'cache', 'model'])
  })

  it('drops notes over the 36-word cap and diagrams with fewer than 2 labels', async () => {
    const longNote = Array.from({ length: 40 }, () => 'word').join(' ')
    const fetchImpl = mockFetch({
      notes: [{ quote: 'x', note: longNote }],
      diagram: { title: 'flow', labels: ['only-one'] },
    })
    const result = await annotateWithGemini('x', [], 'test-key', fetchImpl)
    expect(result.notes).toHaveLength(0)
    expect(result.diagram).toBeUndefined()
  })

  it('caps notes at 15 even if the model returns more', async () => {
    const notes = Array.from({ length: 20 }, (_, i) => ({ quote: `q${i}`, note: 'short note' }))
    const fetchImpl = mockFetch({ notes })
    const result = await annotateWithGemini('x', [], 'test-key', fetchImpl)
    expect(result.notes).toHaveLength(15)
  })

  it('throws when the HTTP request fails', async () => {
    const fetchImpl = mockFetch({}, false, 429)
    await expect(annotateWithGemini('x', [], 'test-key', fetchImpl)).rejects.toThrow('429')
  })
})
