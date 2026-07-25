export interface Candidate {
  text: string
  kind: 'heading' | 'bold' | 'code'
}

const MAX_CANDIDATES = 15
const MIN_LENGTH = 3

const SELECTORS: Record<Candidate['kind'], string> = {
  heading: 'h1, h2, h3, h4',
  bold: 'strong, b',
  code: 'code',
}

export function findCandidates(root: Element): Candidate[] {
  const seen = new Set<string>()
  const candidates: Candidate[] = []

  for (const kind of ['heading', 'bold', 'code'] as const) {
    const nodes = root.querySelectorAll(SELECTORS[kind])
    for (const node of Array.from(nodes)) {
      const text = (node.textContent ?? '').trim()
      if (text.length < MIN_LENGTH || seen.has(text)) continue
      seen.add(text)
      candidates.push({ text, kind })
      if (candidates.length >= MAX_CANDIDATES) return candidates
    }
  }
  return candidates
}
