import { describe, it, expect, vi } from 'vitest'
import { readThemeMode, paletteFor, watchThemeMode } from '../src/content/theme'

describe('theme', () => {
  it('defaults to light when data-mode is absent', () => {
    const root = document.createElement('html')
    expect(readThemeMode(root)).toBe('light')
  })

  it('reads dark mode from data-mode', () => {
    const root = document.createElement('html')
    root.setAttribute('data-mode', 'dark')
    expect(readThemeMode(root)).toBe('dark')
  })

  it('returns distinct palettes for light and dark', () => {
    expect(paletteFor('light').ink).not.toBe(paletteFor('dark').ink)
  })

  it('notifies on data-mode changes', async () => {
    const root = document.createElement('html')
    const onChange = vi.fn()
    const stop = watchThemeMode(root, onChange)
    root.setAttribute('data-mode', 'dark')
    await new Promise(r => setTimeout(r, 0))
    expect(onChange).toHaveBeenCalledWith('dark')
    stop()
  })
})
