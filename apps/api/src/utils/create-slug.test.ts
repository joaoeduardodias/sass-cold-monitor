import { describe, expect, it } from 'vitest'

import { createSlug } from './create-slug'

describe('createSlug', () => {
  it('normalizes accents, spaces, and casing', () => {
    expect(createSlug(' Câmara Fria Principal ')).toBe('camara-fria-principal')
  })

  it('removes unsafe punctuation and collapses repeated separators', () => {
    expect(createSlug('Setor <script>alert(1)</script> -- 01')).toBe(
      'setor-scriptalert1script-01',
    )
  })
})
