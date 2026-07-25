// brown/src/content/main.tsx
import { createRoot } from 'react-dom/client'
import { findAssistantResponses } from './selectors'
import { attachCheckboxes } from './ResponseCheckboxes'
import { BrownPet, type BrownPetState } from './PetWidget'
import { readThemeMode, paletteFor, watchThemeMode } from './theme'
import { createOverlaySvg } from '../render/overlay'
import { underlinePath } from '../render/strokes'
import { layoutChain, renderChainDiagram } from '../render/diagram'
import { annotateResponse, type RenderableAnnotation, type RenderableDiagram } from '../annotate/pipeline'
import { getApiKey } from '../options/storage'
import type { Rect } from '../annotate/margins'

const MARGIN_WIDTH = 160

// Overlay SVGs are appended directly into Claude.ai's own response elements
// (createOverlaySvg's `container`), not inside our shadow root, so a theme
// change can't be picked up by re-rendering the React tree alone. Ink colors
// are set once here as CSS custom properties on <html>, and drawAnnotation
// references them via var(...) instead of baking in a literal color — that
// way every already-drawn annotation repaints live when the palette changes.
function applyPaletteVars(mode: ReturnType<typeof readThemeMode>) {
  const palette = paletteFor(mode)
  const root = document.documentElement.style
  root.setProperty('--brown-ink', palette.ink)
  root.setProperty('--brown-ink-blue', palette.inkBlue)
  root.setProperty('--brown-ink-red', palette.inkRed)
  root.setProperty('--brown-ink-green', palette.inkGreen)
  root.setProperty('--brown-note-bg', palette.noteBg)
}

function marginZonesFor(container: HTMLElement): { left: Rect; right: Rect } {
  const width = container.clientWidth
  const height = container.scrollHeight
  return {
    left: { x0: -MARGIN_WIDTH, y0: 0, x1: 0, y1: height },
    right: { x0: width, y0: 0, x1: width + MARGIN_WIDTH, y1: height },
  }
}

function drawAnnotation(
  svg: SVGSVGElement,
  annotation: RenderableAnnotation,
  containerRect: DOMRect,
  seed: number,
) {
  // Highlight the actual quoted text in the response body — anchored via the
  // resolved Range, converted from viewport-relative to the same
  // container-relative frame the overlay SVG and margin rects use.
  const quoteRect = annotation.range.getBoundingClientRect()
  const underline = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  underline.setAttribute(
    'd',
    underlinePath(
      quoteRect.left - containerRect.left,
      quoteRect.right - containerRect.left,
      quoteRect.bottom - containerRect.top,
      seed,
    ),
  )
  underline.setAttribute('stroke', 'var(--brown-ink-blue)')
  underline.setAttribute('fill', 'none')
  svg.appendChild(underline)

  // Handwritten note text, placed in the margin by Margins/pipeline.ts.
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.setAttribute('x', String(annotation.rect.x0))
  text.setAttribute('y', String(annotation.rect.y0 + 12))
  text.setAttribute('font-family', 'Caveat, cursive')
  text.setAttribute('fill', 'var(--brown-ink)')
  text.textContent = annotation.note
  svg.appendChild(text)
}

function drawDiagram(svg: SVGSVGElement, diagram: RenderableDiagram, seed: number) {
  const layout = layoutChain(diagram.labels, {
    x: diagram.rect.x0,
    y: diagram.rect.y0,
    width: diagram.rect.x1 - diagram.rect.x0,
    height: diagram.rect.y1 - diagram.rect.y0,
  })
  renderChainDiagram(svg, diagram.labels, layout, seed)
}

async function runPipelineFor(response: HTMLElement) {
  const apiKey = await getApiKey()
  if (!apiKey) {
    console.warn('[Brown] no Gemini API key set — open the extension options page')
    return
  }
  const zones = marginZonesFor(response)
  const { notes, diagram } = await annotateResponse(response, zones, apiKey)
  const overlay = createOverlaySvg(response)
  const containerRect = response.getBoundingClientRect()
  notes.forEach((a, i) => drawAnnotation(overlay, a, containerRect, i))
  if (diagram) drawDiagram(overlay, diagram, notes.length)
}

async function runPipelineForSelected(responses: Element[]) {
  for (const response of responses) {
    try {
      await runPipelineFor(response as HTMLElement)
    } catch (err) {
      console.warn('[Brown] failed to annotate response', response, err)
    }
  }
}

// A page-level reinjection (extension reload, dev iteration) doesn't tear
// down a prior script instance's DOM, React root, or observers on its own —
// only a full page refresh does. Removing just the DOM node (as an earlier
// version of this function did) still leaves the old instance's React root
// and its theme MutationObserver alive and running against a detached tree,
// and does nothing to prevent it from having rendered its own visible pet
// before the new instance runs. Tracking a real teardown function on
// `window` (shared by every isolated-world reinjection of this same content
// script within the page) makes each mount() call fully tear down whatever
// came before it, guaranteeing exactly one live pet.
declare global {
  interface Window {
    __brownUnmount?: () => void
  }
}

function mount() {
  window.__brownUnmount?.()

  const host = document.createElement('div')
  host.id = 'brown-root'
  const shadow = host.attachShadow({ mode: 'open' })
  document.body.appendChild(host)

  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  const responses = findAssistantResponses()
  const checkboxes = attachCheckboxes(responses)

  // Claude.ai renders responses asynchronously after the page goes idle,
  // and switching chats is a client-side navigation that never re-runs
  // this content script — so the snapshot above is frequently empty or
  // stale by the time the user actually taps the pet. Keep it live.
  const responseObserver = new MutationObserver(() => {
    checkboxes.addResponses(findAssistantResponses())
  })
  responseObserver.observe(document.body, { childList: true, subtree: true })

  let petState: BrownPetState = 'idle'
  const root = createRoot(mountPoint)

  function render() {
    root.render(
      <BrownPet
        state={petState}
        onFirstTap={() => checkboxes.show()}
        onSecondTap={async () => {
          checkboxes.hide()
          petState = 'busy'
          render()
          try {
            await runPipelineForSelected(checkboxes.getSelected())
          } finally {
            petState = 'settled'
            render()
            setTimeout(() => {
              petState = 'idle'
              render()
            }, 1500)
          }
        }}
      />,
    )
  }

  applyPaletteVars(readThemeMode())
  render()
  const stopWatchingTheme = watchThemeMode(document.documentElement, () => {
    applyPaletteVars(readThemeMode())
    render()
  })

  window.__brownUnmount = () => {
    responseObserver.disconnect()
    stopWatchingTheme()
    root.unmount()
    host.remove()
  }
}

mount()
