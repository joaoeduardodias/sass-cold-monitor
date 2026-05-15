import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createSlug } from './create-slug'

describe('createSlug', () => {
  it('creates a normalized lowercase slug', () => {
    assert.equal(createSlug(' Câmara Fria 01 '), 'camara-fria-01')
  })

  it('removes unsafe characters', () => {
    assert.equal(
      createSlug('Sensor <script>alert(1)</script>'),
      'sensor-script-alert-1-script',
    )
  })
})
