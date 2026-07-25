// brown/src/content/selectors.ts
//
// IMPORTANT: Claude.ai's DOM structure is not publicly documented and can
// change without notice. `[data-testid="conversation-turn"]` no longer
// exists on the page (confirmed via live DevTools console — 0 matches).
// `.font-claude-response-body` is assistant-only (only Claude's rendered
// markdown gets this class); `[role="article"]` wraps a full turn but
// matches both user and assistant turns, so it's only used as the
// ancestor scope once we've already found an assistant-only body inside it.
export function findAssistantResponses(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll('.font-claude-response-body'))
    .map(body => body.closest('[role="article"]'))
    .filter((el): el is Element => el !== null)
}
