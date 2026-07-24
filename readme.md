Brown

In progress right now

Task 15 (wiring everything into the content script) was implemented and reviewed. The review came back with two real Important findings, not yet fixed:

1. Toggling Claude.ai's light/dark theme didn't repaint annotations already drawn on screen (only the pet widget re-rendered).
2. If the Gemini call failed for any selected response, the pet got stuck showing its "busy" animation forever, with no recovery.

I was mid-fix when you interrupted — I'd just added a CSS custom-properties helper (`applyPaletteVars`) to `main.tsx` so ink colors live-update on theme change instead of being baked in at draw time.

Still need to: wire that helper in, add `try/catch/finally` around the per-response pipeline loop, re-run tests/build, commit, and get it re-reviewed.