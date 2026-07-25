import { findCandidates } from './heuristics'
import { resolveQuote } from './anchoring'
import { Margins, type Rect, type Side } from './margins'
import { hashContent, getCached, setCached } from './cache'
import type { GeminiAnnotationResult } from './types'

const PROMPT_VERSION = 'v1'
const WORDS_TO_PX = 1.4 // rough px-per-word estimate; refined by real font metrics in Task 11+
const DIAGRAM_HEIGHT = 120 // fixed estimate; V0 diagrams are capped at one per response

export interface RenderableAnnotation {
  quote: string
  note: string
  range: Range
  side: Side
  rect: Rect
}

export interface RenderableDiagram {
  title: string
  labels: string[]
  side: Side
  rect: Rect
}

async function fetchAnnotations(
  responseText: string,
  candidates: ReturnType<typeof findCandidates>,
  apiKey: string,
): Promise<GeminiAnnotationResult> {
  const key = await hashContent(responseText, PROMPT_VERSION)
  const cached = await getCached(key)
  if (cached) return cached.annotations as GeminiAnnotationResult

  const response = await chrome.runtime.sendMessage({
    type: 'BROWN_ANNOTATE',
    responseText,
    candidates,
    apiKey,
  })
  if (!response.ok) throw new Error(response.error)

  await setCached(key, response.result)
  return response.result as GeminiAnnotationResult
}

function estimateHeight(note: string): number {
  const words = note.trim().split(/\s+/).length
  return Math.max(20, words * WORDS_TO_PX + 12)
}

export async function annotateResponse(
  container: Element,
  zones: { left: Rect; right: Rect },
  apiKey: string,
): Promise<{ notes: RenderableAnnotation[]; diagram?: RenderableDiagram }> {
  const responseText = container.textContent ?? ''
  const candidates = findCandidates(container)
  const result = await fetchAnnotations(responseText, candidates, apiKey)

  const margins = new Margins(zones)
  const placed: RenderableAnnotation[] = []

  // Margins/zones and the overlay SVG (created later, positioned absolute
  // within `container`) are both in container-relative coordinates, but
  // Range/Element.getBoundingClientRect() always return viewport-relative
  // ones — anchoring against the raw viewport value would silently offset
  // every note by however far the container sits from the viewport top.
  const containerTop = container.getBoundingClientRect?.()?.top ?? 0

  for (const note of result.notes) {
    try {
      const range = resolveQuote(container, { exact: note.quote })
      if (!range) continue // silent drop: unresolved quote

      // Range.prototype.getBoundingClientRect is a standard DOM API present in
      // every real browser (Chrome, Brown's only target, has always supported
      // it) — this optional-chain guard is purely for jsdom's test environment,
      // which does not implement it on Range at all (only on Element). Falling
      // back to 0 matches the existing failure-isolation philosophy: never let
      // a positioning quirk crash or unnecessarily drop an annotation.
      const anchorY = (range.getBoundingClientRect?.()?.top ?? 0) - containerTop
      const height = estimateHeight(note.note)
      const placement = margins.place(anchorY, height)
      if (!placement) continue // silent drop: no room in either margin

      margins.commit(placement.side, placement.rect.y1)
      placed.push({
        quote: note.quote,
        note: note.note,
        range,
        side: placement.side,
        rect: placement.rect,
      })
    } catch (err) {
      console.warn('[Brown] dropping annotation due to error', note, err)
    }
  }

  let diagram: RenderableDiagram | undefined
  if (result.diagram) {
    try {
      // No text anchor for a diagram: anchorY=0 makes Margins.place() start it
      // right at whichever side's cursor is currently lowest (i.e. the side
      // with more room left), placing it after all notes in that column.
      const placement = margins.place(0, DIAGRAM_HEIGHT)
      if (placement) {
        margins.commit(placement.side, placement.rect.y1)
        diagram = {
          title: result.diagram.title,
          labels: result.diagram.labels,
          side: placement.side,
          rect: placement.rect,
        }
      } // else: silent drop, no room for a diagram in either margin
    } catch (err) {
      console.warn('[Brown] dropping diagram due to error', result.diagram, err)
    }
  }

  return { notes: placed, diagram }
}
