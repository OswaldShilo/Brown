export type ThemeMode = 'light' | 'dark'

export interface Palette {
  ink: string
  inkBlue: string
  inkRed: string
  inkGreen: string
  noteBg: string
}

const LIGHT: Palette = {
  ink: '#1a1a1a',
  inkBlue: '#2d5aa0',
  inkRed: '#a02d2d',
  inkGreen: '#2d8a4a',
  noteBg: 'rgba(0,0,0,0.03)',
}

const DARK: Palette = {
  ink: '#e8e8e8',
  inkBlue: '#7aa8ff',
  inkRed: '#ff8080',
  inkGreen: '#7adf9a',
  noteBg: 'rgba(255,255,255,0.06)',
}

export function readThemeMode(root: HTMLElement = document.documentElement): ThemeMode {
  return root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'
}

export function paletteFor(mode: ThemeMode): Palette {
  return mode === 'dark' ? DARK : LIGHT
}

export function watchThemeMode(root: HTMLElement, onChange: (mode: ThemeMode) => void): () => void {
  const observer = new MutationObserver(() => onChange(readThemeMode(root)))
  observer.observe(root, { attributes: true, attributeFilter: ['data-mode'] })
  return () => observer.disconnect()
}
