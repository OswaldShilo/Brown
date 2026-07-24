# Brown — PRD

Full design spec: `docs/superpowers/specs/2026-07-24-brown-annotation-extension-design.md`

## Problem

Long, dense Claude responses are hard to read and retain — no visual hierarchy, nothing to mark
what matters, no quick diagram when a picture would land faster than a paragraph. Meanwhile the
left/right margins around the chat column sit empty on wide screens.

## Product

Brown is a Chrome extension for Claude.ai that annotates a response on demand: sketch-style
highlights, short margin notes, and small diagrams drawn in the unused page margins, styled like
hand-marked book marginalia.

Core idea, borrowed from the reference project
([HalfBloodProfessor-Pdf](https://github.com/snknitin/HalfBloodProfessor-Pdf), which does the
same for PDF textbooks): **the LLM decides what to annotate and writes the prose; deterministic
code decides where everything goes on the page.** The LLM never touches coordinates.

## V0 Scope

- Chrome extension, Claude.ai only.
- On-demand per response (not automatic on every message).
- User supplies their own Gemini API key, stored in extension settings.
- Out of scope for now: other browsers/sites, automatic annotation, PDF/image annotation.

## Interaction model

A single Codex Pet ([codex-pets-react](https://github.com/backnotprop/codex-pets-react)) is the
only point of contact — no per-response buttons.

- Fixed bottom-right corner, persists across scroll.
- Idle: look-around animation while waiting.
- **Tap 1** → checkbox appears next to every response on the page.
- User checks one or more responses (checking alone does nothing yet).
- **Tap 2** (on the pet) → confirms selection, pet goes "busy" while annotating, settles when done.

## Annotation pipeline (hybrid — per selected response)

1. **Highlight candidates — local heuristics, no API call.** Scan response text/DOM for headings,
   bold terms, code blocks, key sentences → candidate quotes.
2. **Notes + diagram — Gemini 3.6 Flash.** `generateContent` + `responseSchema` returns a short
   margin note per candidate quote, plus an optional single diagram spec (2–5 node labels).
   Verbatim quotes and prose only — never coordinates.
3. **Anchoring — quote-based.** `dom-anchor-text-quote` resolves each quote to a DOM Range (exact
   match, `diff-match-patch` fuzzy fallback). Unresolvable quotes are silently dropped.
4. **Layout — cursor-based margin allocator.** Left/right margin columns each track a "filled to
   here" cursor. A note is predicted-height-then-placed at `max(anchor_y, cursor)`; cursor
   advances past it. No 2D collision detection needed — ported from the reference project's
   `Margins` class.
5. **Rendering.** `rough.js` for sketchy diagram shapes, `perfect-freehand` for hand-drawn
   underline/circle/arrow strokes, a handwriting Google Font (Caveat / Kalam / Gochi Hand — final
   pick TBD) for note text. Theme colors switch off Claude.ai's own `data-mode` attribute — no
   luminance computation.
6. **Caching.** Keyed on hash(response text + prompt version) — unchanged responses never
   re-call Gemini.
7. **Failure isolation.** Each annotation renders in its own try/catch; one bad annotation can't
   break the rest of the overlay.

## Key libraries

| Concern | Library |
|---|---|
| Pet widget + state machine | `codex-pets-react` |
| Text-quote → DOM anchoring | `dom-anchor-text-quote` |
| Sketchy diagram shapes | `rough.js` |
| Hand-drawn strokes | `perfect-freehand` |
| Handwriting font | Caveat / Kalam / Gochi Hand |
| Annotation content model | Gemini 3.6 Flash |

## Roadmap (not designed yet)

Other LLM chat sites (ChatGPT, Gemini web), automatic (non-on-demand) annotation, draggable/
pinnable pet.
