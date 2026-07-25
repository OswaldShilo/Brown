# Brown — LLM Response Annotation Extension (V0 Design)

## Problem

Reading long, dense LLM responses (architecture explanations, technical walkthroughs) in a
plain chat UI is fatiguing: there's no visual hierarchy, no way to mark what matters, and no
quick diagram for structure that would read faster as a picture than a paragraph. Meanwhile the
left/right margins around the chat column sit empty on wide screens.

## Product

**Brown** is a Chrome extension for Claude.ai that annotates a response on demand — sketch-style
highlights, short margin notes, and small diagrams drawn in the unused page margins — styled like
hand-marked book marginalia. It borrows its core architectural idea from a reference project,
[HalfBloodProfessor-Pdf](https://github.com/snknitin/HalfBloodProfessor-Pdf), which annotates PDF
textbooks the same way: **the LLM decides what to annotate and writes the prose; deterministic
code decides where everything goes on the page.**

## V0 Scope

- Chrome extension (Manifest V3 content script), **Claude.ai only**.
- Annotation is **on-demand per response**, triggered through a floating pet widget — not automatic
  on every message.
- User supplies their own Gemini API key, stored in the extension's local settings.
- Out of scope for V0: other browsers, other LLM chat sites (ChatGPT, etc.), automatic
  annotation, PDF/image annotation. These may become later versions but are not designed here.

## Interaction Model

A single [Codex Pet](https://github.com/backnotprop/codex-pets-react) (e.g. the "yuan" sprite)
is Brown's only point of contact with the user — no per-response buttons.

- **Fixed position**, bottom-right corner of the viewport, persistent across scroll.
- **Idle state:** look-around animation while waiting for input.
- **Tap 1:** reveals a checkbox next to every Claude response currently on the page.
- User checks one or more responses to annotate. Checking does *not* trigger anything by itself.
- **Tap 2 (on the pet):** confirms the selection. Pet switches to a "busy" animation while the
  annotation pipeline runs for each checked response, then returns to idle once all are done.
- This reuses `codex-pets-react`'s existing state machine (idle / busy / settled) rather than
  inventing a new one.

## Annotation Pipeline (per selected response)

A **hybrid** approach — local heuristics choose *what* to highlight; an LLM call only elaborates
notes and diagrams, keeping API cost and latency down relative to a single call deciding
everything.

1. **Highlight candidate selection — local heuristics, no API call.**
   Scan the response's rendered text/DOM for candidate spans: headings, bold terms, code blocks,
   and structurally-signaled key sentences. Produces a list of candidate quotes.

2. **Note + diagram generation — Gemini 3.6 Flash.**
   Send the candidate quotes (plus surrounding context) to Gemini's `generateContent` endpoint
   with `responseMimeType: application/json` and a `responseSchema` that constrains the reply to:
   - a short margin note (prose, capped word count) per candidate quote, and
   - an optional single diagram spec (2–5 node labels) if the response's structure would read
     better as a picture than prose.
   The model returns **verbatim quotes and prose only — never coordinates**, exactly like the
   reference project's contract.

3. **Anchoring — quote-based, not coordinates.**
   Each returned quote is resolved to a DOM `Range` via
   [`dom-anchor-text-quote`](https://www.npmjs.com/package/dom-anchor-text-quote) (the same
   library Hypothesis uses): exact match first, `diff-match-patch` fuzzy fallback for near-misses.
   A quote that still can't be resolved is **silently dropped** — never guessed at, matching the
   reference project's safety valve.

4. **Layout — cursor-based margin allocator.**
   Ported from the reference project's `Margins` class: the left and right margin columns each
   track a cursor (the y-position below which that column is already filled). To place a note:
   - predict its rendered height from the actual handwriting font's metrics before placing it,
   - place it at `max(anchor_y, cursor)` so it never overlaps a note placed above it,
   - after drawing, advance the cursor past the note plus a small gutter.
   No true 2D collision detection — this greedy, monotonic allocator is the entire
   overlap-avoidance mechanism, and it's proven sufficient in the reference project.

5. **Rendering.**
   - [rough.js](https://roughjs.com) draws diagram nodes/connectors in a sketchy style.
   - [perfect-freehand](https://github.com/steveruizok/perfect-freehand) draws underline/circle/
     arrow strokes with natural pen wobble.
   - Note text is set in a handwriting Google Font (Caveat, Kalam, or Gochi Hand — final pick
     deferred to implementation/visual polish).
   - **Theme:** no luminance computation. Brown watches Claude.ai's own `data-mode` attribute on
     `<html>` and switches ink/note colors between a light and dark palette accordingly.

6. **Caching.**
   Annotation results are cached keyed on a hash of the response text + prompt version, so
   re-annotating an unchanged response never re-calls Gemini.

7. **Failure isolation.**
   Each annotation is rendered inside its own try/catch; one malformed or unresolvable annotation
   is dropped without breaking the rest of the overlay for that response.

## Data Flow Summary

```
[user checks responses] → [tap pet]
   → for each checked response:
       heuristics(DOM text) → candidate quotes
       → Gemini 3.6 Flash (structured output) → {quote, note, diagram?}[]
       → dom-anchor-text-quote(quote) → DOM Range | dropped
       → Margins.place(anchor_y, note_height) → placed rect
       → rough.js / perfect-freehand draw into an overlay layer
   → pet returns to idle
```

## Key Libraries

| Concern | Library |
|---|---|
| Pet widget + state machine | `codex-pets-react` (or vanilla web-component variant, for isolation from Claude.ai's own framework via shadow DOM) |
| Text-quote → DOM anchoring | `dom-anchor-text-quote` |
| Sketchy diagram shapes | `rough.js` |
| Natural hand-drawn strokes | `perfect-freehand` |
| Handwriting note font | Caveat / Kalam / Gochi Hand (Google Fonts) |
| Annotation content model | Gemini 3.6 Flash, `generateContent` + `responseSchema` |

## Open Items Deferred to Implementation

- Exact heuristic rules for highlight-candidate selection (headings/bold/code-block weighting).
- Final handwriting font choice among the three candidates.
- Whether the pet renders via `codex-pets-react` directly or a vanilla web-component wrapper
  (shadow DOM isolation preferred, to be confirmed once content-script constraints are hit).
- Diagram density cap per response (reference project uses ~1 per 8 pages; Brown's unit is one
  response, so a per-response cap needs its own tuning pass).

## Roadmap (not designed here)

Later versions may extend to other LLM chat sites (ChatGPT, Gemini web), automatic
(non-on-demand) annotation, and the pet becoming draggable/pinnable. None of this is in scope for
the V0 plan.
