// brown/src/content/selectors.ts
//
// IMPORTANT: Claude.ai's DOM structure is not publicly documented and can
// change without notice. Before Task 15's end-to-end test, open
// https://claude.ai in Chrome, open DevTools, inspect one assistant
// response's rendered container, and update this selector to match a
// stable ancestor element that wraps exactly one assistant turn.
export const ASSISTANT_RESPONSE_SELECTOR = '[data-testid="conversation-turn"][data-is-author="assistant"]'

export function findAssistantResponses(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll(ASSISTANT_RESPONSE_SELECTOR))
}
