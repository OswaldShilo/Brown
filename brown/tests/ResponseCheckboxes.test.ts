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

  it('attaches a checkbox to responses added later via addResponses()', () => {
    const responses = makeResponses(1)
    const controller = attachCheckboxes(responses)
    const [lateResponse] = makeResponses(1)
    controller.addResponses([lateResponse])
    expect(document.querySelectorAll('.brown-response-checkbox').length).toBe(2)
    controller.destroy()
  })

  it('shows checkboxes added later at the current visibility, not always hidden', () => {
    const responses = makeResponses(1)
    const controller = attachCheckboxes(responses)
    controller.show()
    const [lateResponse] = makeResponses(1)
    controller.addResponses([lateResponse])
    const boxes = document.querySelectorAll<HTMLInputElement>('.brown-response-checkbox')
    expect(boxes[1].style.display).toBe('')
    controller.destroy()
  })

  it('does not re-attach a checkbox to a response already known', () => {
    const responses = makeResponses(1)
    const controller = attachCheckboxes(responses)
    controller.addResponses(responses)
    expect(document.querySelectorAll('.brown-response-checkbox').length).toBe(1)
    controller.destroy()
  })
})
