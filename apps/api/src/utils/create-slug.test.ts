import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createSlug } from './create-slug'

describe('createSlug', () => {
  it('normalizes accents, spaces, and casing', () => {
    assert.equal(createSlug(' Câmara Fria Principal '), 'camara-fria-principal')
  })

  it('removes unsafe punctuation and collapses repeated separators', () => {
    assert.equal(
      createSlug('Setor <script>alert(1)</script> -- 01'),
      'setor-scriptalert1script-01',
    )
  })
})
