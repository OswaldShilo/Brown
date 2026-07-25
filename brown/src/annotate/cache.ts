export async function hashContent(text: string, promptVersion: string): Promise<string> {
  const data = new TextEncoder().encode(`${promptVersion}:${text}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface AnnotationCacheEntry {
  annotations: unknown
  cachedAt: number
}

const CACHE_PREFIX = 'brown:annotations:'

export async function getCached(key: string): Promise<AnnotationCacheEntry | null> {
  const stored = await chrome.storage.local.get(CACHE_PREFIX + key)
  return (stored[CACHE_PREFIX + key] as AnnotationCacheEntry) ?? null
}

export async function setCached(key: string, annotations: unknown): Promise<void> {
  const entry: AnnotationCacheEntry = { annotations, cachedAt: Date.now() }
  await chrome.storage.local.set({ [CACHE_PREFIX + key]: entry })
}
