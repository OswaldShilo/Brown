import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getApiKey, setApiKey } from '../src/options/storage'

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

describe('options storage', () => {
  it('returns null when no key has been set', async () => {
    expect(await getApiKey()).toBeNull()
  })

  it('stores and retrieves the API key', async () => {
    await setApiKey('test-gemini-key')
    expect(await getApiKey()).toBe('test-gemini-key')
  })
})
