The core idea: LLM decides what, code decides where

  The whole architecture rests on one split, stated explicitly in their spec: the LLM never touches coordinates. It only picks a verbatim short quote from the page text (3–8 words)
  and writes a short note about it. All the pixel math — placement, avoiding overlap, drawing wobbly "handwritten" lines — is deterministic Python, seeded by a hash of the input so
  identical input always produces identical output.

  Pipeline (production path)

  1. PDF text extracted per page (PyMuPDF).
  2. One LLM call per page, run concurrently. Each call asks GPT for 8–15 annotations for that page, returned as strict Structured-Outputs JSON — never free text, never coordinates.
  3. A second independent validator re-checks every field (length caps, word counts, allowed enum values) — belt-and-suspenders even though the API schema already constrains it.
  4. The renderer takes each annotation's quote, searches the actual page text for that exact string (page.search_for), and gets back a bounding box — that's the anchor.
  5. Notes get placed in whichever margin (left/right/top/bottom) has free space nearest that anchor, then drawn with a connecting arrow if needed.

  The annotation schema

  Flat list of objects like:
  {"type": "underline", "quote": "appears to be the era of Artificial Intelligence",
   "note": "No longer 'appears' - settled. ChatGPT hit 100M users in 2 months."}
  Types include underline, strike, circle, margin, bracket, list, checkmark, callout, diagram — each with its own small field set (e.g. strike has a correction, diagram has labels).

  The placement algorithm — most relevant part for you

  This is the piece that maps directly onto your problem (DOM margins instead of PDF margins):

  - Each margin zone (left/right/top/bottom) tracks a cursor: "how far down is this zone already filled."
  - To place a note, it predicts the note's rendered height from actual font metrics before placing it, then puts it at max(anchor_y, cursor) — as close to what it's annotating as
  possible, but never overlapping something already placed above it.
  - After drawing, the cursor advances past that note plus a small gutter. That's the entire overlap-avoidance mechanism — no real collision detection, just a monotonically-advancing
  "next free slot" per zone.
  - If a quote can't be found on the page (extraction mismatch), the annotation is silently dropped rather than guessed at — a deliberate safety valve.

  What's directly transferable to Brown

  1. Quote-anchoring instead of coordinates — your annotation LLM call should return a verbatim text snippet, and you resolve it to a DOM range/node via text search (the browser
  equivalent of page.search_for), not ask the LLM for pixel positions.
  2. Cursor-based greedy margin allocator — exactly solves your left/right whitespace layout problem with very little code.
  3. Height-predict-before-place — measure actual rendered height (canvas text metrics or an offscreen DOM measure) before deciding where a note goes.
  4. Silent-drop on no-match — if a highlighted phrase isn't found verbatim in the rendered response, drop it instead of misplacing it.
  5. Per-annotation try/except isolation — one bad annotation shouldn't break the whole overlay.
  6. Content-hash caching — cache by hash of the response text, so re-rendering the same message never re-calls the LLM.


  (NEED TO WORK ON THIS)