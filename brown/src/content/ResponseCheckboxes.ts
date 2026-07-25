// brown/src/content/ResponseCheckboxes.ts
export interface CheckboxController {
  show(): void
  hide(): void
  getSelected(): Element[]
  destroy(): void
}

export function attachCheckboxes(responses: Element[]): CheckboxController {
  const boxes: HTMLInputElement[] = responses.map(response => {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.className = 'brown-response-checkbox'
    box.style.display = 'none'
    response.prepend(box)
    return box
  })

  return {
    show() {
      boxes.forEach(b => (b.style.display = ''))
    },
    hide() {
      boxes.forEach(b => (b.style.display = 'none'))
    },
    getSelected() {
      return boxes
        .map((b, i) => (b.checked ? responses[i] : null))
        .filter((r): r is Element => r !== null)
    },
    destroy() {
      boxes.forEach(b => b.remove())
    },
  }
}
