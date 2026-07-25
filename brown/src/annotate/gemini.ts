import type { Candidate } from './heuristics'
import type { GeminiAnnotationResult, NoteAnnotation, DiagramSpec } from './types'

const MODEL = 'gemini-3.6-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const MAX_NOTE_WORDS = 36
const MAX_NOTES = 15

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    notes: {
      type: 'array',
      maxItems: MAX_NOTES,
      items: {
        type: 'object',
        properties: {
          quote: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['quote', 'note'],
      },
    },
    diagram: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
      },
      required: ['title', 'labels'],
    },
  },
  required: ['notes'],
}

function buildPrompt(responseText: string, candidates: Candidate[]): string {
  const quotedList = candidates.map(c => `- "${c.text}" (${c.kind})`).join('\n')
  return [
    'You are annotating one chat response like an expert marking a page by hand.',
    `For each candidate quote below, write a note of ${MAX_NOTE_WORDS} words or fewer explaining or elaborating on it.`,
    'If the response describes a process or structure with 2-5 steps or parts, also return a single "diagram" with short node labels in order. Otherwise omit "diagram".',
    'Every "quote" you return MUST be an exact verbatim substring of the response text below. Never invent a quote.',
    '',
    `Response text:\n"""\n${responseText}\n"""`,
    '',
    `Candidate quotes:\n${quotedList}`,
  ].join('\n')
}

function sanitize(raw: unknown): GeminiAnnotationResult {
  const obj = (raw ?? {}) as Record<string, unknown>
  const rawNotes = Array.isArray(obj.notes) ? obj.notes : []

  const notes: NoteAnnotation[] = rawNotes
    .filter(
      (n): n is NoteAnnotation =>
        typeof n === 'object' &&
        n !== null &&
        typeof (n as any).quote === 'string' &&
        typeof (n as any).note === 'string',
    )
    .filter(n => n.note.trim().split(/\s+/).length <= MAX_NOTE_WORDS)
    .slice(0, MAX_NOTES)

  let diagram: DiagramSpec | undefined
  const rawDiagram = obj.diagram as Record<string, unknown> | undefined
  if (rawDiagram && typeof rawDiagram.title === 'string' && Array.isArray(rawDiagram.labels)) {
    const labels = (rawDiagram.labels as unknown[]).filter((l): l is string => typeof l === 'string').slice(0, 5)
    if (labels.length >= 2) {
      diagram = { title: rawDiagram.title, labels }
    }
  }

  return { notes, diagram }
}

export async function annotateWithGemini(
  responseText: string,
  candidates: Candidate[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeminiAnnotationResult> {
  const res = await fetchImpl(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(responseText, candidates) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status}`)
  }

  let body: any
  try {
    body = await res.json()
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }

  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text
  if (typeof text !== 'string') {
    throw new Error('Gemini response missing text payload')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(`Gemini response was not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
  }

  return sanitize(parsed)
}
