export interface NoteAnnotation {
  quote: string
  note: string
}

export interface DiagramSpec {
  title: string
  labels: string[]
}

export interface GeminiAnnotationResult {
  notes: NoteAnnotation[]
  diagram?: DiagramSpec
}
