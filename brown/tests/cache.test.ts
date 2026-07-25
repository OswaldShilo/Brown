// brown/tests/cache.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashContent, getCached, setCached } from '../src/annotate/cache'

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
  }
})

describe('cache', () => {
  it('hashes the same input to the same key', async () => {
    const a = await hashContent('hello world', 'v1')
    const b = await hashContent('hello world', 'v1')
    expect(a).toBe(b)
  })

  it('hashes different prompt versions to different keys', async () => {
    const a = await hashContent('hello world', 'v1')
    const b = await hashContent('hello world', 'v2')
    expect(a).not.toBe(b)
  })

  it('returns null on cache miss, and the stored value on hit', async () => {
    const key = await hashContent('some response text', 'v1')
    expect(await getCached(key)).toBeNull()
    await setCached(key, [{ quote: 'x', note: 'y' }])
    const hit = await getCached(key)
    expect(hit).not.toBeNull()
    expect(hit!.annotations).toEqual([{ quote: 'x', note: 'y' }])
  })
})
