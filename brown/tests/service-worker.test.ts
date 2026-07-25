import { describe, it, expect, vi } from 'vitest'
import { handleAnnotateRequest } from '../src/background/service-worker'
import * as gemini from '../src/annotate/gemini'

describe('handleAnnotateRequest', () => {
  it('delegates to annotateWithGemini with the request fields', async () => {
    const spy = vi.spyOn(gemini, 'annotateWithGemini').mockResolvedValue({ notes: [] })
    const result = await handleAnnotateRequest({
      type: 'BROWN_ANNOTATE',
      responseText: 'text',
      candidates: [],
      apiKey: 'key',
    })
    expect(spy).toHaveBeenCalledWith('text', [], 'key')
    expect(result).toEqual({ notes: [] })
  })
})
