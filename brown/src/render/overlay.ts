export function createOverlaySvg(container: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement
  svg.style.position = 'absolute'
  svg.style.left = '0'
  svg.style.top = '0'
  svg.style.width = '100%'
  svg.style.height = `${container.scrollHeight}px`
  svg.style.pointerEvents = 'none'
  if (!container.style.position) container.style.position = 'relative'
  container.appendChild(svg)
  return svg
}

export function removeOverlaySvg(svg: SVGSVGElement): void {
  svg.remove()
}
