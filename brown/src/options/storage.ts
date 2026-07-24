const API_KEY_STORAGE_KEY = 'brown:gemini-api-key'

export async function getApiKey(): Promise<string | null> {
  const stored = await chrome.storage.local.get(API_KEY_STORAGE_KEY)
  return (stored[API_KEY_STORAGE_KEY] as string) ?? null
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [API_KEY_STORAGE_KEY]: key })
}
