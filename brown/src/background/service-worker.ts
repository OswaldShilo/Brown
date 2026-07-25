import { annotateWithGemini } from '../annotate/gemini'
import type { Candidate } from '../annotate/heuristics'
import type { GeminiAnnotationResult } from '../annotate/types'

export interface AnnotateRequest {
  type: 'BROWN_ANNOTATE'
  responseText: string
  candidates: Candidate[]
  apiKey: string
}

export async function handleAnnotateRequest(req: AnnotateRequest): Promise<GeminiAnnotationResult> {
  return annotateWithGemini(req.responseText, req.candidates, req.apiKey)
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: AnnotateRequest, _sender, sendResponse) => {
    if (message.type !== 'BROWN_ANNOTATE') return undefined
    handleAnnotateRequest(message)
      .then(result => sendResponse({ ok: true, result }))
      .catch((err: Error) => sendResponse({ ok: false, error: err.message }))
    return true // keep the message channel open for the async sendResponse
  })
}
