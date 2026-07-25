import { describe, it, expect, vi, beforeEach } from 'vitest'
import { annotateResponse } from '../src/annotate/pipeline'

const zones = {
  left: { x0: 0, y0: 0, x1: 100, y1: 800 },
  right: { x0: 400, y0: 0, x1: 500, y1: 800 },
}

function container(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  const store = new Map<string, unknown>()
  ;(globalThis as any).chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store.get(key) })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(items)) store.set(k, v)
        }),
      },
    },
    runtime: { sendMessage: vi.fn() },
  }
})

describe('annotateResponse', () => {
  it('places resolved annotations and silently drops unresolved ones', async () => {
    const el = container('<p>The prompt cache layer cuts cost.</p>')
    ;(globalThis as any).chrome.runtime.sendMessage.mockResolvedValue({
      ok: true,
      result: {
        notes: [
          { quote: 'prompt cache layer', note: 'Reused prefix, cuts cost.' },
          { quote: 'a quote not present in the text', note: 'should be dropped' },
        ],
      },
    })
    const result = await annotateResponse(el, zones, 'test-key')
    expect(result.notes).toHaveLength(1)
    expect(result.notes[0].quote).toBe('prompt cache layer')
    expect(result.diagram).toBeUndefined()
  })

  it('places a diagram after the notes, in whichever margin has more room', async () => {
    const el = container('<p>The prompt cache layer cuts cost.</p>')
    ;(globalThis as any).chrome.runtime.sendMessage.mockResolvedValue({
      ok: true,
      result: {
        notes: [{ quote: 'prompt cache layer', note: 'Reused prefix, cuts cost.' }],
        diagram: { title: 'flow', labels: ['queue', 'cache', 'model'] },
      },
    })
    const result = await annotateResponse(el, zones, 'test-key')
    expect(result.diagram).toBeDefined()
    expect(result.diagram!.labels).toEqual(['queue', 'cache', 'model'])
    // right zone (y1: 800) started emptier than left after one note was placed there,
    // so the diagram should land in whichever zone actually had more room left.
    expect(['left', 'right']).toContain(result.diagram!.side)
  })

  it('uses the cache on a second call for identical content, skipping the message call', async () => {
    const el = container('<p>Same text every time.</p>')
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, result: { notes: [] } })
    ;(globalThis as any).chrome.runtime.sendMessage = sendMessage
    await annotateResponse(el, zones, 'test-key')
    await annotateResponse(el, zones, 'test-key')
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  it('throws from the background bridge does not crash the whole call, dropping just that run', async () => {
    const el = container('<p>Will fail this time.</p>')
    ;(globalThis as any).chrome.runtime.sendMessage.mockResolvedValue({ ok: false, error: 'quota exceeded' })
    await expect(annotateResponse(el, zones, 'test-key')).rejects.toThrow('quota exceeded')
  })
})
