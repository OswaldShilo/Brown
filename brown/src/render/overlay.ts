export function createOverlaySvg(container: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement
  svg.style.position = 'absolute'
  svg.style.left = '0'
  svg.style.top = '0'
  svg.style.width = '100%'
  svg.style.height = `${container.scrollHeight}px`
  svg.style.pointerEvents = 'none'
  // Margin ink is placed outside [0, container width] (left margin is
  // negative-x, right margin starts past the container's own width). A
  // non-root <svg> defaults to overflow:hidden in every browser, which would
  // silently clip all of it — this override is required, not cosmetic.
  svg.style.overflow = 'visible'
  if (!container.style.position) container.style.position = 'relative'
  container.appendChild(svg)
  return svg
}

export function removeOverlaySvg(svg: SVGSVGElement): void {
  svg.remove()
}
