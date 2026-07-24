// brown/tests/ResponseCheckboxes.test.ts
import { describe, it, expect } from 'vitest'
import { attachCheckboxes } from '../src/content/ResponseCheckboxes'

function makeResponses(n: number): HTMLElement[] {
  return Array.from({ length: n }, () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    return el
  })
}

describe('attachCheckboxes', () => {
  it('starts hidden and shows all checkboxes on show()', () => {
    const responses = makeResponses(2)
    const controller = attachCheckboxes(responses)
    const boxes = document.querySelectorAll<HTMLInputElement>('.brown-response-checkbox')
    expect(boxes.length).toBe(2)
    expect(boxes[0].style.display).toBe('none')
    controller.show()
    expect(boxes[0].style.display).toBe('')
    controller.destroy()
  })

  it('returns only the responses whose checkbox is checked', () => {
    const responses = makeResponses(3)
    const controller = attachCheckboxes(responses)
    const boxes = document.querySelectorAll<HTMLInputElement>('.brown-response-checkbox')
    boxes[1].checked = true
    expect(controller.getSelected()).toEqual([responses[1]])
    controller.destroy()
  })

  it('removes all checkboxes on destroy()', () => {
    const responses = makeResponses(2)
    const controller = attachCheckboxes(responses)
    controller.destroy()
    expect(document.querySelectorAll('.brown-response-checkbox').length).toBe(0)
  })
})
