// brown/src/content/ResponseCheckboxes.ts
export interface CheckboxController {
  show(): void
  hide(): void
  getSelected(): Element[]
  addResponses(newResponses: Element[]): void
  destroy(): void
}

export function attachCheckboxes(responses: Element[]): CheckboxController {
  let visible = false
  const entries: { response: Element; box: HTMLInputElement }[] = []

  function attach(response: Element) {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.className = 'brown-response-checkbox'
    box.style.display = visible ? '' : 'none'
    response.prepend(box)
    entries.push({ response, box })
  }

  responses.forEach(attach)

  return {
    show() {
      visible = true
      entries.forEach(({ box }) => (box.style.display = ''))
    },
    hide() {
      visible = false
      entries.forEach(({ box }) => (box.style.display = 'none'))
    },
    getSelected() {
      return entries.filter(({ box }) => box.checked).map(({ response }) => response)
    },
    // Claude.ai renders responses asynchronously and never re-runs the content
    // script on client-side navigation between chats, so the initial
    // findAssistantResponses() snapshot passed to attachCheckboxes() often
    // misses responses that appear (or stream in) after mount(). Call this
    // from a MutationObserver to pick up newly rendered responses.
    addResponses(newResponses) {
      const known = new Set(entries.map(e => e.response))
      newResponses.filter(r => !known.has(r)).forEach(attach)
    },
    destroy() {
      entries.forEach(({ box }) => box.remove())
      entries.length = 0
    },
  }
}
